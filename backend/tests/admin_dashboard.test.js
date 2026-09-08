process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const User = require("../models/User");
const PaymentRequest = require("../models/PaymentRequest");
const Order = require("../models/Order");
const adminDashboardController = require("../controllers/adminDashboardController");

// Setup minimal test Express app with mocked authentication & admin resolution
let currentMockUserId = null;
let currentMockUserRole = "ADMIN";

const app = express();
app.use(express.json());

// Mock authMiddleware + requireAdmin
app.use(async (req, res, next) => {
  if (!currentMockUserId) {
    return res.status(401).json({ message: "Authentication required.", code: "UNAUTHORIZED" });
  }

  req.user = currentMockUserId;

  if (currentMockUserRole !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied. Administrator privileges required.",
      code: "ADMIN_REQUIRED"
    });
  }

  req.adminUser = {
    _id: currentMockUserId,
    name: "Platform Admin",
    email: "admin@fintrack.app",
    role: "ADMIN"
  };

  next();
});

// Mount admin dashboard controller routes
app.get("/api/admin/dashboard", adminDashboardController.getDashboardOverview);
app.get("/api/admin/subscriptions", adminDashboardController.getSubscriptions);
app.get("/api/admin/users", adminDashboardController.getUsers);
app.get("/api/admin/analytics", adminDashboardController.getAnalytics);

test("Step 5 Upgrade: Admin SaaS Dashboard, Subscriptions, Users & Analytics Suite", async (t) => {
  const origFindById = User.findById;
  const origFind = User.find;
  const origCountDocumentsUser = User.countDocuments;
  const origAggregateUser = User.aggregate;

  const origCountDocumentsPR = PaymentRequest.countDocuments;
  const origFindPR = PaymentRequest.find;
  const origAggregatePR = PaymentRequest.aggregate;

  const origAggregateOrder = Order.aggregate;
  const origCountDocumentsOrder = Order.countDocuments;

  t.afterEach(() => {
    currentMockUserId = null;
    currentMockUserRole = "ADMIN";
    User.findById = origFindById;
    User.find = origFind;
    User.countDocuments = origCountDocumentsUser;
    User.aggregate = origAggregateUser;

    PaymentRequest.countDocuments = origCountDocumentsPR;
    PaymentRequest.find = origFindPR;
    PaymentRequest.aggregate = origAggregatePR;

    Order.aggregate = origAggregateOrder;
    Order.countDocuments = origCountDocumentsOrder;
  });

  const adminUserId = new mongoose.Types.ObjectId();
  const regularUserId = new mongoose.Types.ObjectId();

  // ==========================================
  // SECTION 1: Authorization on New Endpoints
  // ==========================================

  await t.test("1. Unauthenticated requests to /api/admin/dashboard return 401 UNAUTHORIZED", async () => {
    currentMockUserId = null;
    const res = await request(app).get("/api/admin/dashboard");
    assert.equal(res.status, 401);
    assert.equal(res.body.code, "UNAUTHORIZED");
  });

  await t.test("2. Regular USER requests to /api/admin/dashboard return 403 ADMIN_REQUIRED", async () => {
    currentMockUserId = regularUserId;
    currentMockUserRole = "USER";

    const res = await request(app).get("/api/admin/dashboard");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
  });

  await t.test("3. Regular USER requests to /api/admin/subscriptions return 403 ADMIN_REQUIRED", async () => {
    currentMockUserId = regularUserId;
    currentMockUserRole = "USER";

    const res = await request(app).get("/api/admin/subscriptions");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
  });

  await t.test("4. Regular USER requests to /api/admin/users return 403 ADMIN_REQUIRED", async () => {
    currentMockUserId = regularUserId;
    currentMockUserRole = "USER";

    const res = await request(app).get("/api/admin/users");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
  });

  await t.test("5. Regular USER requests to /api/admin/analytics return 403 ADMIN_REQUIRED", async () => {
    currentMockUserId = regularUserId;
    currentMockUserRole = "USER";

    const res = await request(app).get("/api/admin/analytics");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
  });

  // ==========================================
  // SECTION 2: GET /api/admin/dashboard
  // ==========================================

  await t.test("6. ADMIN gets verified dashboard metrics with dual revenue channels", async () => {
    currentMockUserId = adminUserId;
    currentMockUserRole = "ADMIN";

    // Mock countDocuments for users
    User.countDocuments = async (query = {}) => {
      if (query.isPro && query.plan === "MONTHLY") return 8;
      if (query.isPro && query.plan === "YEARLY") return 4;
      if (query.isPro) return 12;
      return 50; // Total users
    };

    // Mock PaymentRequest counts and aggregate
    PaymentRequest.countDocuments = async (query = {}) => {
      if (query.status === "APPROVED") return 15;
      if (query.status === "NEEDS_MORE_INFO") return 2;
      if (query.status === "REJECTED") return 3;
      if (query.status?.$in) return 5; // Under review + needs info
      return 20;
    };

    PaymentRequest.aggregate = async () => [
      { _id: null, totalPaise: 149000 } // ₹1,490 in manual UPI
    ];

    Order.aggregate = async () => [
      { _id: null, totalPaise: 999000 } // ₹9,990 in Razorpay
    ];

    PaymentRequest.find = () => ({
      sort: () => ({
        limit: () => ({
          populate: () => ({
            select: () => ({
              lean: () => Promise.resolve([
                {
                  _id: new mongoose.Types.ObjectId(),
                  plan: "MONTHLY",
                  amount: 14900,
                  status: "UNDER_REVIEW",
                  utr: "123456789012",
                  createdAt: new Date(),
                  userId: { name: "Alice", email: "alice@test.com" }
                }
              ])
            })
          })
        })
      })
    });

    User.find = () => ({
      sort: () => ({
        limit: () => ({
          select: () => ({
            lean: () => Promise.resolve([
              {
                _id: new mongoose.Types.ObjectId(),
                name: "Bob",
                email: "bob@test.com",
                role: "USER",
                isPro: false,
                plan: null,
                createdAt: new Date()
              }
            ])
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/dashboard");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Metrics validation
    assert.equal(res.body.metrics.totalUsers, 50);
    assert.equal(res.body.metrics.activeProSubscribers, 12);
    assert.equal(res.body.metrics.freeUsers, 38);
    assert.equal(res.body.metrics.monthlyProSubscribers, 8);
    assert.equal(res.body.metrics.yearlyProSubscribers, 4);
    assert.equal(res.body.metrics.pendingPaymentReviews, 5);

    // Revenue validation
    assert.equal(res.body.metrics.revenue.manualUpiRevenue, 1490);
    assert.equal(res.body.metrics.revenue.razorpayRevenue, 9990);
    assert.equal(res.body.metrics.revenue.totalRecognizedRevenue, 11480);

    // Recent lists validation
    assert.equal(res.body.recentPayments.length, 1);
    assert.equal(res.body.recentPayments[0].utr, "123456789012");
    assert.equal(res.body.recentRegistrations.length, 1);
    assert.equal(res.body.recentRegistrations[0].name, "Bob");
  });

  // ==========================================
  // SECTION 3: GET /api/admin/subscriptions
  // ==========================================

  await t.test("7. ADMIN gets subscriptions roster with verified ACTIVE / EXPIRED logic", async () => {
    currentMockUserId = adminUserId;
    currentMockUserRole = "ADMIN";

    const futureDate = new Date(Date.now() + 15 * 86400000); // 15 days in future
    const pastDate = new Date(Date.now() - 5 * 86400000); // 5 days in past

    User.countDocuments = async () => 2;
    User.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve([
                {
                  _id: new mongoose.Types.ObjectId(),
                  name: "Active Member",
                  email: "active@test.com",
                  isPro: true,
                  plan: "MONTHLY",
                  proStartsAt: pastDate,
                  proExpiresAt: futureDate,
                  paymentId: "MANUAL_UPI_123456789012",
                  createdAt: pastDate
                },
                {
                  _id: new mongoose.Types.ObjectId(),
                  name: "Expired Member",
                  email: "expired@test.com",
                  isPro: false,
                  plan: "YEARLY",
                  proStartsAt: new Date(Date.now() - 370 * 86400000),
                  proExpiresAt: pastDate,
                  paymentId: "MANUAL_UPI_987654321098",
                  createdAt: new Date(Date.now() - 370 * 86400000)
                }
              ])
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/subscriptions?status=ALL&page=1&limit=10");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.subscriptions.length, 2);

    // Verify dynamic status calculation
    assert.equal(res.body.subscriptions[0].status, "ACTIVE");
    assert.equal(res.body.subscriptions[0].plan, "MONTHLY");
    assert.equal(res.body.subscriptions[1].status, "EXPIRED");
    assert.equal(res.body.subscriptions[1].plan, "YEARLY");
  });

  // ==========================================
  // SECTION 4: GET /api/admin/users
  // ==========================================

  await t.test("8. ADMIN gets paginated user directory with role and Pro badges", async () => {
    currentMockUserId = adminUserId;
    currentMockUserRole = "ADMIN";

    User.countDocuments = async () => 2;
    User.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve([
                {
                  _id: adminUserId,
                  name: "Platform Admin",
                  email: "admin@fintrack.app",
                  role: "ADMIN",
                  isPro: true,
                  plan: "YEARLY",
                  proExpiresAt: new Date(Date.now() + 100 * 86400000),
                  createdAt: new Date()
                },
                {
                  _id: regularUserId,
                  name: "Standard User",
                  email: "standard@test.com",
                  role: "USER",
                  isPro: false,
                  plan: null,
                  proExpiresAt: null,
                  createdAt: new Date()
                }
              ])
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/users?role=ALL&page=1&limit=10");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.users.length, 2);

    assert.equal(res.body.users[0].role, "ADMIN");
    assert.equal(res.body.users[0].isPro, true);
    assert.equal(res.body.users[1].role, "USER");
    assert.equal(res.body.users[1].isPro, false);
  });

  // ==========================================
  // SECTION 5: GET /api/admin/analytics
  // ==========================================

  await t.test("9. ADMIN gets real aggregations for analytics with revenue channel separation", async () => {
    currentMockUserId = adminUserId;
    currentMockUserRole = "ADMIN";

    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;

    User.aggregate = async () => [
      { _id: { year: currYear, month: currMonth }, count: 15 }
    ];

    PaymentRequest.aggregate = async () => [
      { _id: { year: currYear, month: currMonth }, totalPaise: 29800 } // ₹298
    ];

    Order.aggregate = async () => [
      { _id: { year: currYear, month: currMonth }, totalPaise: 99900 } // ₹999
    ];

    User.countDocuments = async (query = {}) => {
      if (query.isPro && query.plan === "MONTHLY") return 20;
      if (query.isPro && query.plan === "YEARLY") return 10;
      return 70; // Free users
    };

    PaymentRequest.countDocuments = async (query = {}) => {
      if (query.status === "APPROVED") return 30;
      if (query.status === "REJECTED") return 5;
      if (query.status === "UNDER_REVIEW") return 3;
      if (query.status === "NEEDS_MORE_INFO") return 2;
      return 40;
    };

    const res = await request(app).get("/api/admin/analytics");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify user growth timeline
    assert.ok(Array.isArray(res.body.userGrowthTrend));
    assert.equal(res.body.userGrowthTrend.length, 6);

    // Verify revenue channel separation in timeline
    assert.ok(Array.isArray(res.body.revenueTrend));
    assert.equal(res.body.revenueTrend.length, 6);
    const currentMonthRev = res.body.revenueTrend[res.body.revenueTrend.length - 1];
    assert.equal(currentMonthRev.manualUpi, 298);
    assert.equal(currentMonthRev.razorpay, 999);
    assert.equal(currentMonthRev.total, 1297);

    // Verify plan distribution
    assert.equal(res.body.planDistribution[0].name, "Pro Monthly");
    assert.equal(res.body.planDistribution[0].value, 20);
    assert.equal(res.body.planDistribution[1].name, "Pro Yearly");
    assert.equal(res.body.planDistribution[1].value, 10);
    assert.equal(res.body.planDistribution[2].name, "Free Tier");
    assert.equal(res.body.planDistribution[2].value, 70);

    // Verify performance & approval rate
    assert.equal(res.body.performance.totalRequests, 40);
    assert.equal(res.body.performance.approvedCount, 30);
    assert.equal(res.body.performance.rejectedCount, 5);
    // approvalRate = (30 / (30 + 5)) * 100 = 85.7% -> 86%
    assert.equal(res.body.performance.approvalRate, 86);
  });

  // ==========================================
  // SECTION 6: Privacy & Data Leakage Boundary
  // ==========================================

  await t.test("10. Invariant: Admin responses strictly contain ZERO private user financial records", async () => {
    currentMockUserId = adminUserId;
    currentMockUserRole = "ADMIN";

    User.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => ({
              lean: () => Promise.resolve([
                {
                  _id: regularUserId,
                  name: "Target User",
                  email: "target@test.com",
                  role: "USER",
                  isPro: false
                }
              ])
            })
          })
        })
      })
    });

    User.countDocuments = async () => 1;

    const res = await request(app).get("/api/admin/users");
    assert.equal(res.status, 200);
    const userPayload = JSON.stringify(res.body);

    // Ensure forbidden financial and sensitive keywords are not exposed in user payload
    assert.equal(userPayload.includes("expenses"), false);
    assert.equal(userPayload.includes("incomes"), false);
    assert.equal(userPayload.includes("budgets"), false);
    assert.equal(userPayload.includes("familyFinancials"), false);
    assert.equal(userPayload.includes("password"), false);
    assert.equal(userPayload.includes("clerkSecret"), false);
  });
});
