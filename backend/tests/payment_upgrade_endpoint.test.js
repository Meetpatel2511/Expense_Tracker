process.env.NODE_ENV = "test";
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const { createOrder, upgradeToPro } = require("../controllers/userController");
const { generateTestSignature, DEFAULT_TEST_SECRET } = require("../utils/paymentVerification");
const User = require("../models/User");
const Order = require("../models/Order");

// Setup minimal test Express app exercising the HTTP endpoints with authenticated req.user
const createTestApp = (userId = "507f1f77bcf86cd799439011") => {
  const app = express();
  app.use(express.json());
  // Mock authentication layer attaching test user ID
  app.use((req, res, next) => {
    req.user = userId;
    next();
  });
  app.post("/api/user/create-order", createOrder);
  app.post("/api/user/upgrade-pro", upgradeToPro);
  return app;
};

test("HTTP Endpoint Security: POST /api/user/create-order & /upgrade-pro", async (t) => {
  const app = createTestApp("507f1f77bcf86cd799439011");

  // Save original methods
  const originalUserFindById = User.findById;
  const originalOrderCreate = Order.create;
  const originalOrderFindOne = Order.findOne;
  const originalOrderFindOneAndUpdate = Order.findOneAndUpdate;

  t.afterEach(() => {
    User.findById = originalUserFindById;
    Order.create = originalOrderCreate;
    Order.findOne = originalOrderFindOne;
    Order.findOneAndUpdate = originalOrderFindOneAndUpdate;
  });

  // --- SECTION A: ORDER CREATION TESTS ---

  await t.test("1. createOrder: default plan creates MONTHLY order (14900 INR)", async () => {
    let capturedOrder = null;
    Order.create = async (doc) => {
      capturedOrder = doc;
      return doc;
    };

    const res = await request(app)
      .post("/api/user/create-order")
      .send({});

    assert.equal(res.status, 200);
    assert.equal(res.body.plan, "MONTHLY");
    assert.equal(res.body.amount, 14900);
    assert.equal(res.body.currency, "INR");
    assert.ok(res.body.orderId.startsWith("order_test_"));
    assert.equal(capturedOrder.plan, "MONTHLY");
    assert.equal(capturedOrder.amount, 14900);
    assert.equal(capturedOrder.status, "created");
  });

  await t.test("2. createOrder: explicit YEARLY plan creates 99900 INR order", async () => {
    let capturedOrder = null;
    Order.create = async (doc) => {
      capturedOrder = doc;
      return doc;
    };

    const res = await request(app)
      .post("/api/user/create-order")
      .send({ plan: "YEARLY" });

    assert.equal(res.status, 200);
    assert.equal(res.body.plan, "YEARLY");
    assert.equal(res.body.amount, 99900);
    assert.equal(res.body.currency, "INR");
    assert.equal(capturedOrder.plan, "YEARLY");
    assert.equal(capturedOrder.amount, 99900);
  });

  await t.test("3. createOrder: client cannot tamper amount via request body", async () => {
    let capturedOrder = null;
    Order.create = async (doc) => {
      capturedOrder = doc;
      return doc;
    };

    const res = await request(app)
      .post("/api/user/create-order")
      .send({ plan: "YEARLY", amount: 100, currency: "USD" });

    assert.equal(res.status, 200);
    // Server enforces authoritative pricing
    assert.equal(res.body.amount, 99900);
    assert.equal(res.body.currency, "INR");
    assert.equal(capturedOrder.amount, 99900);
    assert.equal(capturedOrder.currency, "INR");
  });

  await t.test("4. createOrder: invalid plan is rejected with 400 INVALID_PLAN", async () => {
    const res = await request(app)
      .post("/api/user/create-order")
      .send({ plan: "LIFETIME_FREE" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_PLAN");
  });

  // --- SECTION B: INPUT & SIGNATURE VERIFICATION TESTS ---

  await t.test("5. upgradeToPro: Missing payment_id should return 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: "order_test_123",
        razorpay_signature: "sig_test_123"
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /razorpay_payment_id is required/);
  });

  await t.test("6. upgradeToPro: Missing order_id should return 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_payment_id: "pay_test_123",
        razorpay_signature: "sig_test_123"
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /razorpay_order_id is required/);
  });

  await t.test("7. upgradeToPro: Missing signature should return 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_payment_id: "pay_test_123",
        razorpay_order_id: "order_test_123"
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /razorpay_signature is required/);
  });

  await t.test("8. upgradeToPro: Forged signature should be rejected with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: "order_test_12345",
        razorpay_payment_id: "pay_test_67890",
        razorpay_signature: "deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567"
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /invalid signature/i);
  });

  await t.test("9. upgradeToPro: Tampered payment ID should be rejected with 400 Bad Request", async () => {
    const orderId = "order_test_1001";
    const paymentId = "pay_test_2002";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: "pay_test_TAMPERED",
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /invalid signature/i);
  });

  await t.test("10. upgradeToPro: Tampered order ID should be rejected with 400 Bad Request", async () => {
    const orderId = "order_test_1001";
    const paymentId = "pay_test_2002";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: "order_test_TAMPERED",
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /invalid signature/i);
  });

  // --- SECTION C: ORDER OWNERSHIP & PLAN BINDING TESTS ---

  await t.test("11. upgradeToPro: Non-existent order returns 404 ORDER_NOT_FOUND", async () => {
    const orderId = "order_non_existent";
    const paymentId = "pay_test_123";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    Order.findOne = async () => null;

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 404);
    assert.equal(res.body.code, "ORDER_NOT_FOUND");
  });

  await t.test("12. upgradeToPro: Order created by User A cannot be redeemed by User B (ORDER_OWNERSHIP_MISMATCH)", async () => {
    const orderId = "order_user_a_123";
    const paymentId = "pay_user_a_456";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    // Order belongs to User A ("507f1f77bcf86cd799439099")
    Order.findOne = async () => ({
      orderId,
      userId: "507f1f77bcf86cd799439099",
      plan: "MONTHLY",
      status: "created"
    });

    // App is authenticated as User B ("507f1f77bcf86cd799439011")
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ORDER_OWNERSHIP_MISMATCH");
  });

  await t.test("13. upgradeToPro: Valid MONTHLY order activates 30-day Pro", async () => {
    const orderId = "order_test_monthly_ok";
    const paymentId = "pay_test_monthly_ok";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    const mockOrder = {
      orderId,
      userId: "507f1f77bcf86cd799439011",
      plan: "MONTHLY",
      status: "created"
    };

    Order.findOne = async ({ orderId: oId, paymentId: pId }) => {
      if (pId) return null; // No existing payment with this ID
      if (oId === orderId) return mockOrder;
      return null;
    };

    Order.findOneAndUpdate = async (filter, update) => {
      if (filter.orderId === orderId && filter.status === "created") {
        return { ...mockOrder, status: "paid", paymentId, paidAt: new Date() };
      }
      return null;
    };

    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      isPro: false,
      save: async function () { return this; }
    };
    User.findById = async () => mockUser;

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.isPro, true);
    assert.equal(res.body.plan, "MONTHLY");
    assert.equal(mockUser.isPro, true);
    assert.equal(mockUser.plan, "MONTHLY");
    assert.ok(mockUser.proExpiresAt);
  });

  await t.test("14. upgradeToPro: Valid YEARLY order activates 365-day Pro", async () => {
    const orderId = "order_test_yearly_ok";
    const paymentId = "pay_test_yearly_ok";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    const mockOrder = {
      orderId,
      userId: "507f1f77bcf86cd799439011",
      plan: "YEARLY",
      status: "created"
    };

    Order.findOne = async ({ orderId: oId, paymentId: pId }) => {
      if (pId) return null;
      if (oId === orderId) return mockOrder;
      return null;
    };

    Order.findOneAndUpdate = async (filter, update) => {
      if (filter.orderId === orderId && filter.status === "created") {
        return { ...mockOrder, status: "paid", paymentId, paidAt: new Date() };
      }
      return null;
    };

    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      isPro: false,
      save: async function () { return this; }
    };
    User.findById = async () => mockUser;

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.isPro, true);
    assert.equal(res.body.plan, "YEARLY");
    assert.equal(mockUser.plan, "YEARLY");
  });

  await t.test("15. upgradeToPro: Client cannot override server-stored order.plan in upgrade body", async () => {
    const orderId = "order_test_monthly_tamper";
    const paymentId = "pay_test_monthly_tamper";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    // Order in database is MONTHLY
    const mockOrder = {
      orderId,
      userId: "507f1f77bcf86cd799439011",
      plan: "MONTHLY",
      status: "created"
    };

    Order.findOne = async ({ orderId: oId, paymentId: pId }) => {
      if (pId) return null;
      if (oId === orderId) return mockOrder;
      return null;
    };

    Order.findOneAndUpdate = async (filter, update) => {
      if (filter.orderId === orderId && filter.status === "created") {
        return { ...mockOrder, status: "paid", paymentId, paidAt: new Date() };
      }
      return null;
    };

    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      isPro: false,
      save: async function () { return this; }
    };
    User.findById = async () => mockUser;

    // Client requests YEARLY in the upgrade payload
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
        plan: "YEARLY"
      });

    assert.equal(res.status, 200);
    // Server must use the order's stored plan (MONTHLY), ignoring the client request
    assert.equal(res.body.plan, "MONTHLY");
    assert.equal(mockUser.plan, "MONTHLY");
  });

  // --- SECTION D: REPLAY & DOUBLE-SPENDING TESTS ---

  await t.test("16. upgradeToPro: Replay attack on already paid order is rejected with 400 ORDER_ALREADY_PROCESSED", async () => {
    const orderId = "order_already_paid_123";
    const paymentId = "pay_already_paid_456";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    const mockOrder = {
      orderId,
      userId: "507f1f77bcf86cd799439011",
      plan: "MONTHLY",
      status: "paid"
    };

    Order.findOne = async ({ orderId: oId, paymentId: pId }) => {
      if (pId) return mockOrder; // Already registered with this paymentId
      if (oId === orderId) return mockOrder;
      return null;
    };

    // Atomic update fails because status is not "created"
    Order.findOneAndUpdate = async () => null;

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 400);
    assert.ok(["ORDER_ALREADY_PROCESSED", "PAYMENT_ALREADY_USED"].includes(res.body.code));
  });

  await t.test("17. upgradeToPro: Same paymentId cannot be reused across different order", async () => {
    const orderId = "order_new_different";
    const paymentId = "pay_previously_used";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    const mockOrder = {
      orderId,
      userId: "507f1f77bcf86cd799439011",
      plan: "MONTHLY",
      status: "created"
    };

    Order.findOne = async ({ orderId: oId, paymentId: pId }) => {
      if (pId === paymentId) {
        // Exists under another order
        return { orderId: "order_original_paid", paymentId, status: "paid" };
      }
      if (oId === orderId) return mockOrder;
      return null;
    };

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "PAYMENT_ALREADY_USED");
  });
});
