process.env.NODE_ENV = "test";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  verifyRazorpaySignature,
  generateTestSignature,
  DEFAULT_TEST_SECRET
} = require("../utils/paymentVerification");

test("Razorpay Payment Verification Suite", async (t) => {
  await t.test("1. should successfully verify a valid HMAC SHA-256 signature in test environment", () => {
    const orderId = "order_test_123456";
    const paymentId = "pay_test_789012";
    const secret = DEFAULT_TEST_SECRET;

    const signature = generateTestSignature(orderId, paymentId, secret);

    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
      secret
    });

    assert.equal(isValid, true, "Valid signature must verify as true");
  });

  await t.test("2. should reject forged or tampered signature", () => {
    const orderId = "order_test_123456";
    const paymentId = "pay_test_789012";
    const secret = DEFAULT_TEST_SECRET;

    const forgedSignature = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature: forgedSignature,
      secret
    });

    assert.equal(isValid, false, "Forged signature must be rejected");
  });

  await t.test("3. should reject when orderId or paymentId is modified", () => {
    const orderId = "order_test_123456";
    const paymentId = "pay_test_789012";
    const secret = DEFAULT_TEST_SECRET;

    const validSignature = generateTestSignature(orderId, paymentId, secret);

    const isTamperedOrder = verifyRazorpaySignature({
      orderId: "order_test_different",
      paymentId,
      signature: validSignature,
      secret
    });

    const isTamperedPayment = verifyRazorpaySignature({
      orderId,
      paymentId: "pay_test_different",
      signature: validSignature,
      secret
    });

    assert.equal(isTamperedOrder, false);
    assert.equal(isTamperedPayment, false);
  });

  await t.test("4. should reject missing or empty parameters safely", () => {
    assert.equal(verifyRazorpaySignature({ orderId: "", paymentId: "pay_1", signature: "sig" }), false);
    assert.equal(verifyRazorpaySignature({ orderId: "ord_1", paymentId: "", signature: "sig" }), false);
    assert.equal(verifyRazorpaySignature({ orderId: "ord_1", paymentId: "pay_1", signature: "" }), false);
    assert.equal(verifyRazorpaySignature({}), false);
  });

  await t.test("5. should fail closed in production when RAZORPAY_KEY_SECRET is missing", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.RAZORPAY_KEY_SECRET;

    try {
      process.env.NODE_ENV = "production";
      delete process.env.RAZORPAY_KEY_SECRET;

      const orderId = "order_prod_123";
      const paymentId = "pay_prod_456";
      const signature = generateTestSignature(orderId, paymentId, DEFAULT_TEST_SECRET);

      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature
      });

      assert.equal(isValid, false, "Must fail closed in production if secret is unconfigured");
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSecret) {
        process.env.RAZORPAY_KEY_SECRET = originalSecret;
      } else {
        delete process.env.RAZORPAY_KEY_SECRET;
      }
    }
  });

  await t.test("6. should verify correctly in production when RAZORPAY_KEY_SECRET is configured", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.RAZORPAY_KEY_SECRET;
    const prodSecret = "prod_super_secure_secret_key_12345";

    try {
      process.env.NODE_ENV = "production";
      process.env.RAZORPAY_KEY_SECRET = prodSecret;

      const orderId = "order_prod_123";
      const paymentId = "pay_prod_456";
      const signature = generateTestSignature(orderId, paymentId, prodSecret);

      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature
      });

      assert.equal(isValid, true, "Must verify with configured production secret");
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSecret) {
        process.env.RAZORPAY_KEY_SECRET = originalSecret;
      } else {
        delete process.env.RAZORPAY_KEY_SECRET;
      }
    }
  });
});
