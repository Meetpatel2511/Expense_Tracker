const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

const User = require("../models/User");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");

const { getDashboardData, getAlertsOnly } = require("../controllers/expenseController");
const { getHealthScore } = require("../controllers/userController");
const requirePro = require("../middleware/proMiddleware");

// Helper to create an Express app with simulated auth and user role
const createTestApp = (isPro = false) => {
  const testApp = express();
  testApp.use(express.json());

  const testUserId = "507f1f77bcf86cd799439011";

  // Simulate authentication middleware attaching req.user
  testApp.use((req, res, next) => {
    req.user = testUserId;
    next();
  });

  // Mount Dashboard Route (Public to authenticated, but internally filters Pro data)
  testApp.get("/api/expense/dashboard", getDashboardData);

  // Mount Suggestions Route (Protected by requirePro)
  testApp.get("/api/expense/suggestions", requirePro, getAlertsOnly);

  // Mount Health Score Route (Protected by requirePro)
  testApp.get("/api/user/health-score", requirePro, getHealthScore);

  return { testApp, testUserId };
};

test("Step 1A: Pro Data-Access Security & Dashboard Pro Gate Suite", async (t) => {
  const originalUserFindById = User.findById;
  const originalExpenseFind = Expense.find;
  const originalIncomeFind = Income.find;
  const originalBudgetFind = Budget.find;
  const originalExpenseAggregate = Expense.aggregate;
  const originalIncomeAggregate = Income.aggregate;

  t.afterEach(() => {
    User.findById = originalUserFindById;
    Expense.find = originalExpenseFind;
    Income.find = originalIncomeFind;
    Budget.find = originalBudgetFind;
    Expense.aggregate = originalExpenseAggregate;
    Income.aggregate = originalIncomeAggregate;
  });

  await t.test("TEST 1 — FREE DASHBOARD: Free user receives alerts: [] and no Pro data", async () => {
    const { testApp, testUserId } = createTestApp(false);

    // Mock User as Free user
    User.findById = (id) => ({
      lean: async () => ({
        _id: testUserId,
        name: "Free User",
        email: "free@example.com",
        isPro: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }),
      select: () => ({
        lean: async () => ({ _id: testUserId, isPro: false })
      })
    });

    // Mock expenses & budgets
    Expense.find = () => ({
      sort: () => ({
        lean: async () => [
          { _id: "e1", user: testUserId, amount: 5000, category: "Food & Dining", date: new Date() }
        ]
      }),
      lean: async () => [
        { _id: "e1", user: testUserId, amount: 5000, category: "Food & Dining", date: new Date() }
      ]
    });

    Income.find = () => ({
      lean: async () => [
        { _id: "i1", user: testUserId, amount: 10000, date: new Date() }
      ]
    });

    Budget.find = () => ({
      lean: async () => [
        { _id: "b1", user: testUserId, category: "Food & Dining", limit: 3000, month: new Date().getMonth(), year: new Date().getFullYear() }
      ]
    });

    Expense.aggregate = async () => [{ _id: null, total: 5000 }];
    Income.aggregate = async () => [{ _id: null, total: 10000 }];

    const res = await request(testApp).get("/api/expense/dashboard");

    assert.equal(res.status, 200);
    assert.ok(res.body.summary, "Summary should be present");
    assert.equal(res.body.summary.totalExpense, 5000);
    assert.equal(res.body.summary.totalIncome, 10000);
    // CRITICAL SECURITY ASSERTION: alerts must be strictly an empty array for Free users
    assert.deepEqual(res.body.alerts, [], "Free users must receive strictly empty alerts array");
  });

  await t.test("TEST 2 — PRO DASHBOARD: Pro user receives populated Smart Alerts", async () => {
    const { testApp, testUserId } = createTestApp(true);

    // Mock User as Pro user
    User.findById = (id) => ({
      lean: async () => ({
        _id: testUserId,
        name: "Pro User",
        email: "pro@example.com",
        isPro: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }),
      select: () => ({
        lean: async () => ({ _id: testUserId, isPro: true })
      })
    });

    // Mock 3+ transactions with budget overrun to trigger alerts
    const mockExpenses = [
      { _id: "e1", user: testUserId, amount: 2000, category: "Food & Dining", date: new Date() },
      { _id: "e2", user: testUserId, amount: 2000, category: "Food & Dining", date: new Date() },
      { _id: "e3", user: testUserId, amount: 2000, category: "Food & Dining", date: new Date() }
    ];

    Expense.find = () => ({
      sort: () => ({
        lean: async () => mockExpenses
      }),
      lean: async () => mockExpenses
    });

    Income.find = () => ({
      lean: async () => [
        { _id: "i1", user: testUserId, amount: 15000, date: new Date() }
      ]
    });

    Budget.find = () => ({
      lean: async () => [
        { _id: "b1", user: testUserId, category: "Food & Dining", limit: 3000, month: new Date().getMonth(), year: new Date().getFullYear() }
      ]
    });

    Expense.aggregate = async () => [{ _id: null, total: 6000 }];
    Income.aggregate = async () => [{ _id: null, total: 15000 }];

    const res = await request(testApp).get("/api/expense/dashboard");

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.alerts), "Alerts should be an array");
    assert.ok(res.body.alerts.length > 0, "Pro users with budget overruns must receive populated alerts");
    assert.ok(res.body.alerts[0].text, "Alert must contain text description");
    assert.match(res.body.alerts[0].text, /exceeded your budget/i);
  });

  await t.test("TEST 3 — FREE HEALTH SCORE: Free user is rejected with 403 PRO_REQUIRED", async () => {
    const { testApp, testUserId } = createTestApp(false);

    User.findById = (id) => ({
      select: (fields) => ({
        _id: testUserId,
        isPro: false
      }),
      then: (resolve) => resolve({ _id: testUserId, isPro: false })
    });

    const res = await request(testApp).get("/api/user/health-score");

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "PRO_REQUIRED");
    assert.match(res.body.message, /Pro membership required/i);
  });

  await t.test("TEST 4 — PRO HEALTH SCORE: Pro user receives health score, tips, and status", async () => {
    const { testApp, testUserId } = createTestApp(true);

    User.findById = (id) => {
      const mockUser = {
        _id: testUserId,
        name: "Pro User",
        isPro: true
      };
      return {
        select: () => mockUser,
        then: (resolve) => resolve(mockUser)
      };
    };

    Expense.find = () => [
      { _id: "e1", user: testUserId, amount: 2000, category: "Food & Dining", date: new Date() },
      { _id: "e2", user: testUserId, amount: 3000, category: "Shopping", date: new Date() }
    ];

    Income.find = () => [
      { _id: "i1", user: testUserId, amount: 20000, date: new Date() }
    ];

    const res = await request(testApp).get("/api/user/health-score");

    assert.equal(res.status, 200);
    assert.ok(typeof res.body.score === "number", "Score should be a number");
    assert.ok(Array.isArray(res.body.tips), "Tips should be an array");
    assert.ok(typeof res.body.status === "string", "Status should be a string");
  });

  await t.test("TEST 5 — FREE SUGGESTIONS: Free user is rejected with 403 PRO_REQUIRED", async () => {
    const { testApp, testUserId } = createTestApp(false);

    User.findById = (id) => ({
      select: () => ({ _id: testUserId, isPro: false })
    });

    const res = await request(testApp).get("/api/expense/suggestions");

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "PRO_REQUIRED");
  });

  await t.test("TEST 6 — PRO SUGGESTIONS: Pro user receives suggestions successfully", async () => {
    const { testApp, testUserId } = createTestApp(true);

    User.findById = (id) => ({
      select: () => ({ _id: testUserId, isPro: true }),
      lean: async () => ({
        _id: testUserId,
        isPro: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })
    });

    Expense.find = () => ({
      lean: async () => [
        { _id: "e1", user: testUserId, amount: 2000, category: "Food & Dining", date: new Date() },
        { _id: "e2", user: testUserId, amount: 2000, category: "Food & Dining", date: new Date() },
        { _id: "e3", user: testUserId, amount: 2000, category: "Food & Dining", date: new Date() }
      ]
    });

    Budget.find = () => ({
      lean: async () => [
        { _id: "b1", user: testUserId, category: "Food & Dining", limit: 3000 }
      ]
    });

    const res = await request(testApp).get("/api/expense/suggestions");

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.alerts), "Alerts should be an array");
    assert.ok(res.body.alerts.length > 0, "Pro suggestions must return alerts");
  });

  await t.test("TEST 7 — DIRECT API ACCESS: Direct HTTP requests without frontend UI cannot bypass security", async () => {
    const { testApp, testUserId } = createTestApp(false);

    User.findById = (id) => ({
      select: () => ({ _id: testUserId, isPro: false }),
      lean: async () => ({
        _id: testUserId,
        isPro: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })
    });

    Expense.find = () => ({
      sort: () => ({
        lean: async () => [
          { _id: "e1", user: testUserId, amount: 10000, category: "Food & Dining", date: new Date() }
        ]
      }),
      lean: async () => [
        { _id: "e1", user: testUserId, amount: 10000, category: "Food & Dining", date: new Date() }
      ]
    });
    Income.find = () => ({ lean: async () => [] });
    Budget.find = () => ({ lean: async () => [{ _id: "b1", user: testUserId, category: "Food & Dining", limit: 1000 }] });
    Expense.aggregate = async () => [{ _id: null, total: 10000 }];
    Income.aggregate = async () => [{ _id: null, total: 0 }];

    // Direct API call to Dashboard
    const dashboardRes = await request(testApp).get("/api/expense/dashboard");
    assert.equal(dashboardRes.status, 200);
    assert.deepEqual(dashboardRes.body.alerts, []);

    // Direct API call to Health Score
    const healthRes = await request(testApp).get("/api/user/health-score");
    assert.equal(healthRes.status, 403);
    assert.equal(healthRes.body.code, "PRO_REQUIRED");

    // Direct API call to Suggestions
    const suggestionsRes = await request(testApp).get("/api/expense/suggestions");
    assert.equal(suggestionsRes.status, 403);
    assert.equal(suggestionsRes.body.code, "PRO_REQUIRED");
  });
});
