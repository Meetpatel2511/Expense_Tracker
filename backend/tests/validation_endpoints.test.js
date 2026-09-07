const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
process.env.NODE_ENV = "test";
const app = require("../server");

const Expense = require("../models/Expense");
const Income = require("../models/Income");
const { updateExpense, getExpenses, getSummary, getDashboardData } = require("../controllers/expenseController");
const { updateIncome, getIncomes } = require("../controllers/incomeController");
const { setBudget, getBudgetStatus } = require("../controllers/budgetController");

// Helper to create an authenticated Express test app
const createAuthenticatedApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use((req, res, next) => {
    req.user = "507f1f77bcf86cd799439011";
    next();
  });

  // Expense test routes
  testApp.get("/api/expense", getExpenses);
  testApp.get("/api/expense/summary", getSummary);
  testApp.get("/api/expense/dashboard", getDashboardData);
  testApp.put("/api/expense/:id", updateExpense);

  // Income test routes
  testApp.get("/api/income", getIncomes);
  testApp.put("/api/income/:id", updateIncome);

  // Budget test routes
  testApp.post("/api/budget", setBudget);
  testApp.get("/api/budget", getBudgetStatus);

  return testApp;
};

test("Endpoint Validation & Parameter Handling Suite", async (t) => {
  const authApp = createAuthenticatedApp();
  const validId = "507f1f77bcf86cd799439011";

  // --- Preserved baseline tests ---
  await t.test("DELETE /api/expense/:id with malformed ObjectId should return 400 Bad Request", async () => {
    const res = await request(app).delete("/api/expense/123-invalid-id");
    assert.ok(res.status === 400 || res.status === 401);
    assert.notEqual(res.status, 500);
  });

  await t.test("PUT /api/expense/:id with malformed ObjectId should return 400 Bad Request", async () => {
    const res = await request(app).put("/api/expense/malformed-id").send({ amount: 100 });
    assert.ok(res.status === 400 || res.status === 401);
    assert.notEqual(res.status, 500);
  });

  await t.test("DELETE /api/income/:id with malformed ObjectId should return 400 Bad Request", async () => {
    const res = await request(app).delete("/api/income/malformed-id");
    assert.ok(res.status === 400 || res.status === 401);
    assert.notEqual(res.status, 500);
  });

  // --- Day 5 Validation Improvements Tests ---

  // 1. Budget category validation
  await t.test("POST /api/budget with unknown category should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .post("/api/budget")
      .send({ amount: 500, category: "NonExistentCategoryXYZ" });
    
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid budget category/i);
  });

  await t.test("POST /api/budget with valid category 'Food & Dining' or 'Global' should not fail category validation", async () => {
    // Stub Budget.findOne to avoid database dependency
    const origFindOne = require("../models/Budget").findOne;
    require("../models/Budget").findOne = async () => ({
      save: async () => true,
      limit: 0
    });

    try {
      const res = await request(authApp)
        .post("/api/budget")
        .send({ amount: 1000, category: "Food & Dining" });
      
      assert.notEqual(res.status, 400);
    } finally {
      require("../models/Budget").findOne = origFindOne;
    }
  });

  // 2. Empty update payloads
  await t.test("PUT /api/expense/:id with empty payload should return 400 Bad Request", async () => {
    const origFindOne = Expense.findOne;
    Expense.findOne = async () => ({
      _id: validId,
      user: "507f1f77bcf86cd799439011",
      amount: 100,
      category: "Food & Dining",
      note: "Lunch",
      date: new Date()
    });

    try {
      const res = await request(authApp)
        .put(`/api/expense/${validId}`)
        .send({});

      assert.equal(res.status, 400);
      assert.match(res.body.message, /No valid update fields provided/i);
    } finally {
      Expense.findOne = origFindOne;
    }
  });

  await t.test("PUT /api/income/:id with empty payload should return 400 Bad Request", async () => {
    const origFindOne = Income.findOne;
    Income.findOne = async () => ({
      _id: validId,
      user: "507f1f77bcf86cd799439011",
      amount: 2000,
      source: "Salary",
      date: new Date()
    });

    try {
      const res = await request(authApp)
        .put(`/api/income/${validId}`)
        .send({});

      assert.equal(res.status, 400);
      assert.match(res.body.message, /No valid update fields provided/i);
    } finally {
      Income.findOne = origFindOne;
    }
  });

  // 3. Inverted amount ranges
  await t.test("GET /api/expense with minAmount > maxAmount should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .get("/api/expense?minAmount=500&maxAmount=100");

    assert.equal(res.status, 400);
    assert.match(res.body.message, /minAmount cannot be greater than maxAmount/i);
  });

  await t.test("GET /api/income with minAmount > maxAmount should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .get("/api/income?minAmount=1000&maxAmount=200");

    assert.equal(res.status, 400);
    assert.match(res.body.message, /minAmount cannot be greater than maxAmount/i);
  });

  // 4. Inverted date ranges
  await t.test("GET /api/expense with startDate > endDate should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .get("/api/expense?startDate=2026-12-31&endDate=2026-01-01");

    assert.equal(res.status, 400);
    assert.match(res.body.message, /startDate cannot be after endDate/i);
  });

  await t.test("GET /api/income with startDate > endDate should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .get("/api/income?startDate=2026-12-31&endDate=2026-01-01");

    assert.equal(res.status, 400);
    assert.match(res.body.message, /startDate cannot be after endDate/i);
  });

  // 5. Malformed month/year parameters
  await t.test("POST /api/budget with invalid month should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .post("/api/budget?month=99")
      .send({ amount: 500, category: "Global" });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid month or year parameter/i);
  });

  await t.test("GET /api/budget with invalid year should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .get("/api/budget?year=invalidYear");

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid month or year parameter/i);
  });

  await t.test("GET /api/expense/summary with invalid month string should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .get("/api/expense/summary?month=notANumber");

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid month or year parameter/i);
  });

  await t.test("GET /api/expense/dashboard with invalid year should return 400 Bad Request", async () => {
    const res = await request(authApp)
      .get("/api/expense/dashboard?year=1800");

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid month or year parameter/i);
  });
});

