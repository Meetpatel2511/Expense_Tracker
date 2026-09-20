const User = require("../models/User");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const { isProActive } = require("../middleware/proMiddleware");

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
