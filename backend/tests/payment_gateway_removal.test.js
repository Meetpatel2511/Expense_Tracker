process.env.NODE_ENV = "test";
process.env.UPI_PAYEE_VPA = "fintrack.pay@icici";
process.env.UPI_PAYEE_NAME = "FinTrack Financials";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const userController = require("../controllers/userController");
const paymentRequestController = require("../controllers/paymentRequestController");
const userRoutes = require("../routes/userRoutes");
const paymentRequestRoutes = require("../routes/paymentRequestRoutes");
const PaymentRequest = require("../models/PaymentRequest");

// Build test app with mocked authentication and centralized 404 handler
const createTestApp = (userId = "507f1f77bcf86cd799439011") => {
  const app = express();
  app.use(express.json());

  // Attach mock authenticated user middleware
  app.use((req, res, next) => {
    if (userId) {
      req.user = userId;
    }
    next();
  });

  // User routes
  app.get("/api/user/profile", userController.getProfile);
  app.put("/api/user/update", userController.updateProfile);
  app.get("/api/user/pro-status", userController.getProStatus);

  // Payment Request routes
  app.get("/api/payment-request/config", paymentRequestController.getConfig);
  app.get("/api/payment-request/my-requests", paymentRequestController.getMyPaymentRequests);

  // 404 Handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  return app;
};

test("Payment Gateway Removal & Regression Suite", async (t) => {
  const mockUserId = "507f1f77bcf86cd799439011";
  const app = createTestApp(mockUserId);

  await t.test("1. POST /api/user/create-order no longer exists (returns 404)", async () => {
    const res = await request(app)
      .post("/api/user/create-order")
      .send({ plan: "MONTHLY" });

    assert.equal(res.status, 404, "Endpoint must return 404 Not Found");
    assert.equal(res.body.message, "Route not found");
  });

  await t.test("2. POST /api/user/upgrade-pro no longer exists (returns 404)", async () => {
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({
        razorpay_payment_id: "pay_fake123",
        razorpay_order_id: "order_fake123",
        razorpay_signature: "sig_fake123",
        plan: "MONTHLY"
      });

    assert.equal(res.status, 404, "Endpoint must return 404 Not Found");
    assert.equal(res.body.message, "Route not found");
  });

  await t.test("3. Direct client request cannot activate Pro through removed endpoints", async () => {
    // Attempting any upgrade through user route paths must fail with 404
    const res = await request(app)
      .post("/api/user/upgrade-pro")
      .send({ plan: "YEARLY" });

    assert.equal(res.status, 404);
  });

  await t.test("4. userController exports no Razorpay-related controller functions", () => {
    assert.equal(userController.createOrder, undefined, "createOrder must not be exported");
    assert.equal(userController.upgradeToPro, undefined, "upgradeToPro must not be exported");
  });

  await t.test("5. No Razorpay routes or handlers remain registered on userRoutes", () => {
    const stack = userRoutes.stack || [];
    const routePaths = stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      }));

    const createOrderRoute = routePaths.find((r) => r.path === "/create-order");
    const upgradeProRoute = routePaths.find((r) => r.path === "/upgrade-pro");

    assert.equal(createOrderRoute, undefined, "create-order route must not exist");
    assert.equal(upgradeProRoute, undefined, "upgrade-pro route must not exist");
  });

  await t.test("6. Manual UPI configuration endpoint remains available", async () => {
    const res = await request(app)
      .get("/api/payment-request/config");

    assert.equal(res.status, 200);
    assert.ok(res.body.upi);
    assert.ok(res.body.upi.vpa);
    assert.ok(res.body.upi.payeeName);
    assert.ok(res.body.plans);
  });

  await t.test("7. Pricing remains Monthly ₹149 (14900 paise) and Yearly ₹999 (99900 paise)", async () => {
    const res = await request(app)
      .get("/api/payment-request/config");

    assert.equal(res.status, 200);
    const { plans } = res.body;
    assert.equal(plans.MONTHLY.amount, 14900);
    assert.equal(plans.MONTHLY.priceINR, 149);
    assert.equal(plans.MONTHLY.durationDays, 30);

    assert.equal(plans.YEARLY.amount, 99900);
    assert.equal(plans.YEARLY.priceINR, 999);
    assert.equal(plans.YEARLY.durationDays, 365);
  });

  await t.test("8. No active Razorpay environment keys are required to boot application", () => {
    assert.equal(process.env.RAZORPAY_KEY_ID, undefined);
    assert.equal(process.env.RAZORPAY_KEY_SECRET, undefined);
  });

  await t.test("9. Manual UPI PaymentRequest schema enforces valid data structure", () => {
    const pr = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "123456789012"
    });

    const err = pr.validateSync();
    assert.equal(err, undefined, "PaymentRequest validation must pass");
  });
});
