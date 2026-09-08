const User = require("../models/User");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Order = require("../models/Order");
const { verifyRazorpaySignature } = require("../utils/paymentVerification");
const { isProActive, calculateProExpiration } = require("../middleware/proMiddleware");
const { isValidPlan, getPlanPricing } = require("../config/pricing");

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch aggregate stats for the profile
    const [totalExpense, totalIncome] = await Promise.all([
      Expense.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Income.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      clerkId: user.clerkId,
      isPro: isProActive(user),
      plan: user.plan || null,
      proSince: user.proSince || null,
      proStartsAt: user.proStartsAt || null,
      proExpiresAt: user.proExpiresAt || null,
      createdAt: user.createdAt,
      stats: {
        totalExpense: totalExpense[0]?.total || 0,
        totalIncome: totalIncome[0]?.total || 0,
        savings: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/user/update
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body || {};
    
    const updateFields = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ message: "Name must not exceed 100 characters" });
      }
      updateFields.name = name.trim();
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof email !== "string" || !emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "A valid email address is required" });
      }

      const existingUser = await User.findOne({ email: email.trim() });
      if (existingUser && existingUser._id.toString() !== req.user.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updateFields.email = email.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid update fields provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/user/create-order (Razorpay test order generation with authoritative plan binding)
exports.createOrder = async (req, res) => {
  try {
    const requestedPlan = req.body?.plan ? String(req.body.plan).toUpperCase().trim() : "MONTHLY";

    if (!isValidPlan(requestedPlan)) {
      return res.status(400).json({
        message: "Invalid subscription plan. Allowed plans: MONTHLY, YEARLY.",
        code: "INVALID_PLAN"
      });
    }

    const pricing = getPlanPricing(requestedPlan);
    const orderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const receipt = `rcpt_${Date.now()}`;

    // Persist order in DB with server-authoritative plan and amount
    const order = await Order.create({
      orderId,
      userId: req.user,
      plan: requestedPlan,
      amount: pricing.amount,
      currency: pricing.currency,
      status: "created"
    });

    res.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      plan: order.plan,
      receipt,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_demo_key"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/user/upgrade-pro
exports.upgradeToPro = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentId = razorpay_payment_id,
      orderId = razorpay_order_id,
      signature = razorpay_signature
    } = req.body || {};

    if (!paymentId || typeof paymentId !== "string" || !paymentId.trim()) {
      return res.status(400).json({
        message: "Payment verification failed: razorpay_payment_id is required.",
        code: "PAYMENT_VERIFICATION_FAILED"
      });
    }

    if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
      return res.status(400).json({
        message: "Payment verification failed: razorpay_order_id is required.",
        code: "PAYMENT_VERIFICATION_FAILED"
      });
    }

    if (!signature || typeof signature !== "string" || !signature.trim()) {
      return res.status(400).json({
        message: "Payment verification failed: razorpay_signature is required.",
        code: "PAYMENT_VERIFICATION_FAILED"
      });
    }

    const cleanOrderId = orderId.trim();
    const cleanPaymentId = paymentId.trim();
    const cleanSignature = signature.trim();

    // 1. Cryptographically verify the HMAC SHA-256 signature
    const isValidSignature = verifyRazorpaySignature({
      orderId: cleanOrderId,
      paymentId: cleanPaymentId,
      signature: cleanSignature
    });

    if (!isValidSignature) {
      return res.status(400).json({
        message: "Payment verification failed: invalid signature. Pro upgrade rejected.",
        code: "PAYMENT_VERIFICATION_FAILED"
      });
    }

    // 2. Find server-side order
    const order = await Order.findOne({ orderId: cleanOrderId });
    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
        code: "ORDER_NOT_FOUND"
      });
    }

    // 3. Verify order ownership
    if (order.userId.toString() !== req.user.toString()) {
      return res.status(403).json({
        message: "Order ownership mismatch. You cannot claim an order created by another account.",
        code: "ORDER_OWNERSHIP_MISMATCH"
      });
    }

    // 4. Verify paymentId has not been used across other orders
    const existingPayment = await Order.findOne({ paymentId: cleanPaymentId });
    if (existingPayment && existingPayment.orderId !== cleanOrderId) {
      return res.status(400).json({
        message: "Payment identifier has already been used.",
        code: "PAYMENT_ALREADY_USED"
      });
    }

    // 5. Atomically redeem the order to prevent replay / race conditions
    const now = new Date();
    const redeemedOrder = await Order.findOneAndUpdate(
      {
        orderId: cleanOrderId,
        userId: req.user,
        status: "created"
      },
      {
        $set: {
          status: "paid",
          paymentId: cleanPaymentId,
          paidAt: now
        }
      },
      { new: true }
    );

    if (!redeemedOrder) {
      return res.status(400).json({
        message: "Order has already been processed or is invalid.",
        code: "ORDER_ALREADY_PROCESSED"
      });
    }

    // 6. Find user and activate Pro using server-authoritative order.plan
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = redeemedOrder.plan; // Authoritative plan from Order
    let proStartsAt;
    let newProExpiresAt;
    if (user.proExpiresAt && new Date(user.proExpiresAt) > now) {
      // Active renewal: start from existing expiry
      proStartsAt = new Date(user.proExpiresAt);
      newProExpiresAt = calculateProExpiration(plan, user.proExpiresAt, proStartsAt);
    } else {
      // New activation or expired subscription: start from now
      proStartsAt = now;
      newProExpiresAt = calculateProExpiration(plan, null, now);
    }

    user.isPro = true;
    user.plan = plan;
    user.proStartsAt = proStartsAt;
    user.proExpiresAt = newProExpiresAt;
    user.proSince = user.proSince || now;
    user.paymentId = cleanPaymentId;
    await user.save();

    res.json({
      message: "Upgraded to Pro successfully!",
      isPro: true,
      plan: user.plan,
      proStartsAt: user.proStartsAt,
      proExpiresAt: user.proExpiresAt,
      proSince: user.proSince
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/user/pro-status
exports.getProStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("isPro proSince proStartsAt proExpiresAt plan");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      isPro: isProActive(user),
      plan: user.plan || null,
      proSince: user.proSince || null,
      proStartsAt: user.proStartsAt || null,
      proExpiresAt: user.proExpiresAt || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/user/reset-pro (dev/test only)
exports.resetPro = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isPro = false;
    user.plan = undefined;
    // Preserve original activation timestamp for legacy reference
    // user.proSince remains unchanged
    user.proStartsAt = undefined;
    user.proExpiresAt = undefined;
    await user.save();

    res.json({ message: "Pro status reset", isPro: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET /api/user/health-score (Deterministic Engine)
exports.getHealthScore = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user || !user.isPro) {
      return res.status(403).json({ message: "Pro membership required" });
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [expenses, incomes] = await Promise.all([
      Expense.find({ user: req.user, date: { $gte: threeMonthsAgo } }),
      Income.find({ user: req.user, date: { $gte: threeMonthsAgo } })
    ]);

    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const totalInc = incomes.reduce((s, i) => s + i.amount, 0);
    const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

    // Categorized spending
    const categoryMap = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    // 4. Mathematical Health Score Engine (100% uptime)
    // Formula: (Savings Rate * 0.7) + (Consistency & Diversity * 0.3)
    const baseSavingsScore = Math.min(100, Math.max(0, savingsRate));
    
    // Calculate a "Discipline Score" based on consistency
    const uniqueMonths = new Set(expenses.map(e => new Date(e.date).getMonth())).size;
    const consistencyScore = (uniqueMonths / 3) * 100;
    
    const finalScore = Math.round((baseSavingsScore * 0.7) + (consistencyScore * 0.3));
    
    let status = "Poor";
    if (finalScore >= 85) status = "Excellent";
    else if (finalScore >= 70) status = "Good";
    else if (finalScore >= 50) status = "Fair";

    // Manual Tips Selection
    const tips = [];
    if (savingsRate < 20) tips.push("Aim to save at least 20% of your income monthly.");
    if (uniqueMonths < 2) tips.push("Consistency is key—track your daily expenses regularly.");
    
    // Check for category spikes
    const highSpender = Object.keys(categoryMap).find(cat => (categoryMap[cat] / totalExp) > 0.5);
    if (highSpender) {
      tips.push(`Your spending is heavily concentrated in ${highSpender}.`);
    } else {
      tips.push("Your spending is well-diversified across categories.");
    }
    
    if (tips.length < 3) tips.push("Review and set specific category budgets.");
    if (tips.length < 3) tips.push("Consider using the 'Family' feature to track group expenses.");

    res.json({
      score: finalScore,
      tips: tips.slice(0, 3),
      status: status
    });

  } catch (error) {
    console.error("Health Score Engine Error:", error);
    res.status(500).json({ error: "Failed to calculate health score." });
  }
};
