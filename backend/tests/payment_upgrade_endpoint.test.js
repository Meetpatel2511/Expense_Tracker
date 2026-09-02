const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const { upgradeToPro } = require("../controllers/userController");
const { generateTestSignature, DEFAULT_TEST_SECRET } = require("../utils/paymentVerification");
const User = require("../models/User");

// Setup minimal test Express app exercising the HTTP endpoint with authenticated req.user
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  // Mock authentication layer attaching test user ID
  app.use((req, res, next) => {
    req.user = "507f1f77bcf86cd799439011";
    next();
  });
  app.post("/api/user/upgrade-pro", upgradeToPro);
  return app;
};

test("HTTP Endpoint Security: POST /api/user/upgrade-pro", async (t) => {
  const app = createTestApp();

  await t.test("1. Missing payment_id should return 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: "order_test_123",
        razorpay_signature: "sig_test_123"
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /razorpay_payment_id is required/);
  });

  await t.test("2. Missing order_id should return 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_payment_id: "pay_test_123",
        razorpay_signature: "sig_test_123"
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /razorpay_order_id is required/);
  });

  await t.test("3. Missing signature should return 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_payment_id: "pay_test_123",
        razorpay_order_id: "order_test_123"
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /razorpay_signature is required/);
  });

  await t.test("4. Forged signature should be rejected with 400 Bad Request", async () => {
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

  await t.test("5. Tampered payment ID should be rejected with 400 Bad Request", async () => {
    const orderId = "order_test_1001";
    const paymentId = "pay_test_2002";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    // Send tampered payment ID with signature created for another payment
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

  await t.test("6. Tampered order ID should be rejected with 400 Bad Request", async () => {
    const orderId = "order_test_1001";
    const paymentId = "pay_test_2002";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    // Send tampered order ID with signature created for another order
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

  await t.test("7. Valid signature should reach successful verification path and upgrade user", async () => {
    const orderId = "order_test_verified_123";
    const paymentId = "pay_test_verified_456";
    const validSignature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

    // Stub User.findById for this test case
    const originalFindById = User.findById;
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      isPro: false,
      save: async function () {
        return this;
      }
    };
    User.findById = async () => mockUser;

    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    User.findById = originalFindById;

    assert.equal(res.status, 200);
    assert.equal(res.body.isPro, true);
    assert.match(res.body.message, /Upgraded to Pro successfully/i);
    assert.equal(mockUser.paymentId, paymentId);
  });
});
