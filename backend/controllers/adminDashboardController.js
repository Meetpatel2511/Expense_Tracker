const User = require("../models/User");
const PaymentRequest = require("../models/PaymentRequest");
const Order = require("../models/Order");

/**
 * 1. GET /api/admin/dashboard
 * Live SaaS business overview with verified counts and revenue split.
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      activeProSubscribers,
      monthlyProSubscribers,
      yearlyProSubscribers,
      pendingPaymentReviews,
      approvedPaymentsCount,
      needsInfoPaymentsCount,
      rejectedPaymentsCount,
      approvedPaymentsAggregate,
      paidOrdersAggregate,
      recentPayments,
      recentRegistrations
    ] = await Promise.all([
      // 1. Total registered accounts
      User.countDocuments(),

      // 2. Currently active Pro subscribers
      User.countDocuments({
        isPro: true,
        proExpiresAt: { $gt: now }
      }),

      // 3. Active Monthly Pro subscribers
      User.countDocuments({
        isPro: true,
        proExpiresAt: { $gt: now },
        plan: "MONTHLY"
      }),

      // 4. Active Yearly Pro subscribers
      User.countDocuments({
        isPro: true,
        proExpiresAt: { $gt: now },
        plan: "YEARLY"
      }),

      // 5. Pending Payment Requests requiring review
      PaymentRequest.countDocuments({
        status: { $in: ["UNDER_REVIEW", "NEEDS_MORE_INFO"] }
      }),

      // 6. Approved payment requests count
      PaymentRequest.countDocuments({ status: "APPROVED" }),

      // 7. Needs info payment requests count
      PaymentRequest.countDocuments({ status: "NEEDS_MORE_INFO" }),

      // 8. Rejected payment requests count
      PaymentRequest.countDocuments({ status: "REJECTED" }),

      // 9. Manual UPI Revenue from APPROVED payment requests (amount stored in paise)
      PaymentRequest.aggregate([
        { $match: { status: "APPROVED" } },
        { $group: { _id: null, totalPaise: { $sum: "$amount" } } }
      ]),

      // 10. Razorpay Revenue from paid Orders (amount stored in paise)
      Order.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, totalPaise: { $sum: "$amount" } } }
      ]),

      // 11. Recent 5 Payment Requests
      PaymentRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .select("plan amount status utr createdAt userId")
        .lean(),

      // 12. Recent 5 User Registrations
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email role isPro plan createdAt")
        .lean()
    ]);

    const manualUpiRevenuePaise = approvedPaymentsAggregate[0]?.totalPaise || 0;
    const razorpayRevenuePaise = paidOrdersAggregate[0]?.totalPaise || 0;
    const manualUpiRevenue = Math.round(manualUpiRevenuePaise / 100);
    const razorpayRevenue = Math.round(razorpayRevenuePaise / 100);
    const totalRecognizedRevenue = manualUpiRevenue + razorpayRevenue;

    const freeUsers = Math.max(0, totalUsers - activeProSubscribers);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeProSubscribers,
        freeUsers,
        monthlyProSubscribers,
        yearlyProSubscribers,
        pendingPaymentReviews,
        revenue: {
          manualUpiRevenue,
          razorpayRevenue,
          totalRecognizedRevenue
        }
      },
      paymentStatusBreakdown: {
        approved: approvedPaymentsCount,
        underReview: pendingPaymentReviews - needsInfoPaymentsCount,
        needsInfo: needsInfoPaymentsCount,
        rejected: rejectedPaymentsCount
      },
      recentPayments,
      recentRegistrations
    });
  } catch (error) {
    console.error("Admin Dashboard Overview Error:", error);
    res.status(500).json({
      message: "Failed to retrieve admin dashboard overview.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 2. GET /api/admin/subscriptions
 * Filterable, paginated Pro subscription roster with precise status definition.
 */
exports.getSubscriptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "ALL", // 'ALL' | 'ACTIVE' | 'EXPIRED'
      plan = "ALL", // 'ALL' | 'MONTHLY' | 'YEARLY'
      search = ""
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;
    const now = new Date();

    const query = {};

    // Base query: Must have current or historical subscription footprint
    const baseSubscriptionCondition = {
      $or: [
        { isPro: true },
        { proSince: { $ne: null } },
        { proExpiresAt: { $ne: null } }
      ]
    };

    // 1. Status Filter
    if (status === "ACTIVE") {
      query.isPro = true;
      query.proExpiresAt = { $gt: now };
    } else if (status === "EXPIRED") {
      query.$and = [
        baseSubscriptionCondition,
        {
          $or: [
            { isPro: false },
            { isPro: null },
            { proExpiresAt: { $lte: now } }
          ]
        }
      ];
    } else {
      // ALL
      query.$or = baseSubscriptionCondition.$or;
    }

    // 2. Plan Filter
    if (plan === "MONTHLY" || plan === "YEARLY") {
      query.plan = plan;
    }

    // 3. Search by name or email
    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchCondition = {
        $or: [{ name: searchRegex }, { email: searchRegex }]
      };
      if (query.$and) {
        query.$and.push(searchCondition);
      } else {
        query.$and = [searchCondition];
      }
    }

    const [total, subscriptions] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ proExpiresAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select("name email isPro plan proSince proStartsAt proExpiresAt paymentId createdAt")
        .lean()
    ]);

    // Format subscriptions with dynamic computed active flag
    const formattedSubscriptions = subscriptions.map((user) => {
      const isActive = user.isPro === true && user.proExpiresAt && new Date(user.proExpiresAt) > now;
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan || "MONTHLY",
        status: isActive ? "ACTIVE" : "EXPIRED",
        isPro: user.isPro,
        proSince: user.proSince,
        proStartsAt: user.proStartsAt,
        proExpiresAt: user.proExpiresAt,
        paymentId: user.paymentId,
        createdAt: user.createdAt
      };
    });

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    res.json({
      success: true,
      count: formattedSubscriptions.length,
      total,
      page: parsedPage,
      totalPages,
      subscriptions: formattedSubscriptions
    });
  } catch (error) {
    console.error("Admin Subscriptions Error:", error);
    res.status(500).json({
      message: "Failed to retrieve subscriptions roster.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 3. GET /api/admin/users
 * Paginated application user directory (Read-only, no sensitive financial data).
 */
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role = "ALL", // 'ALL' | 'USER' | 'ADMIN'
      proStatus = "ALL", // 'ALL' | 'PRO' | 'FREE'
      search = ""
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;
    const now = new Date();

    const query = {};

    // 1. Role filter
    if (role === "USER" || role === "ADMIN") {
      query.role = role;
    }

    // 2. Pro Status filter
    if (proStatus === "PRO") {
      query.isPro = true;
      query.proExpiresAt = { $gt: now };
    } else if (proStatus === "FREE") {
      query.$or = [
        { isPro: false },
        { isPro: null },
        { proExpiresAt: { $lte: now } }
      ];
    }

    // 3. Search by name or email
    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$and = [{ $or: [{ name: searchRegex }, { email: searchRegex }] }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select("name email role isPro plan proExpiresAt createdAt")
        .lean()
    ]);

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "USER",
      isPro: user.isPro === true && user.proExpiresAt && new Date(user.proExpiresAt) > now,
      plan: user.plan || null,
      proExpiresAt: user.proExpiresAt || null,
      createdAt: user.createdAt
    }));

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    res.json({
      success: true,
      count: formattedUsers.length,
      total,
      page: parsedPage,
      totalPages,
      users: formattedUsers
    });
  } catch (error) {
    console.error("Admin Users Directory Error:", error);
    res.status(500).json({
      message: "Failed to retrieve users directory.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 4. GET /api/admin/analytics
 * Real aggregate trend metrics across 6 months for growth, revenue, and conversion.
 */
exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      userRegistrationsByMonth,
      manualUpiRevenueByMonth,
      razorpayRevenueByMonth,
      planDistributionData,
      paymentStatusCounts
    ] = await Promise.all([
      // 1. User registrations by month
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      // 2. Manual UPI revenue by month (APPROVED payments)
      PaymentRequest.aggregate([
        { $match: { status: "APPROVED", createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            totalPaise: { $sum: "$amount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      // 3. Razorpay revenue by month (paid Orders)
      Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            totalPaise: { $sum: "$amount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      // 4. Plan distribution
      Promise.all([
        User.countDocuments({ isPro: true, proExpiresAt: { $gt: now }, plan: "MONTHLY" }),
        User.countDocuments({ isPro: true, proExpiresAt: { $gt: now }, plan: "YEARLY" }),
        User.countDocuments({
          $or: [{ isPro: false }, { isPro: null }, { proExpiresAt: { $lte: now } }]
        })
      ]),

      // 5. Payment request status breakdown
      Promise.all([
        PaymentRequest.countDocuments({ status: "APPROVED" }),
        PaymentRequest.countDocuments({ status: "REJECTED" }),
        PaymentRequest.countDocuments({ status: "UNDER_REVIEW" }),
        PaymentRequest.countDocuments({ status: "NEEDS_MORE_INFO" })
      ])
    ]);

    // Build standard 6-month continuous timeline labels
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      });
    }

    const userGrowthTrend = months.map((m) => {
      const match = userRegistrationsByMonth.find(
        (r) => r._id.year === m.year && r._id.month === m.month
      );
      return {
        month: m.label,
        users: match ? match.count : 0
      };
    });

    const revenueTrend = months.map((m) => {
      const upiMatch = manualUpiRevenueByMonth.find(
        (r) => r._id.year === m.year && r._id.month === m.month
      );
      const rzpMatch = razorpayRevenueByMonth.find(
        (r) => r._id.year === m.year && r._id.month === m.month
      );

      const manualUpi = Math.round((upiMatch?.totalPaise || 0) / 100);
      const razorpay = Math.round((rzpMatch?.totalPaise || 0) / 100);

      return {
        month: m.label,
        manualUpi,
        razorpay,
        total: manualUpi + razorpay
      };
    });

    const [monthlyPro, yearlyPro, freeUsers] = planDistributionData;
    const [approvedCount, rejectedCount, underReviewCount, needsInfoCount] = paymentStatusCounts;
    const totalDecided = approvedCount + rejectedCount;
    const approvalRate = totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 0;
    const totalRequests = approvedCount + rejectedCount + underReviewCount + needsInfoCount;

    res.json({
      success: true,
      userGrowthTrend,
      revenueTrend,
      planDistribution: [
        { name: "Pro Monthly", value: monthlyPro, color: "#3b82f6" },
        { name: "Pro Yearly", value: yearlyPro, color: "#8b5cf6" },
        { name: "Free Tier", value: freeUsers, color: "#64748b" }
      ],
      paymentStatusDistribution: [
        { name: "Approved", value: approvedCount, color: "#10b981" },
        { name: "Under Review", value: underReviewCount, color: "#f59e0b" },
        { name: "Needs Info", value: needsInfoCount, color: "#a855f7" },
        { name: "Rejected", value: rejectedCount, color: "#ef4444" }
      ],
      performance: {
        totalRequests,
        approvedCount,
        rejectedCount,
        approvalRate
      }
    });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    res.status(500).json({
      message: "Failed to retrieve analytics data.",
      code: "INTERNAL_ERROR"
    });
  }
};
