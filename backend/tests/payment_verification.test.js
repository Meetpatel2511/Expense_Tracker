const test = require("node:test");
const assert = require("node:assert/strict");
const {
  verifyRazorpaySignature,
  generateTestSignature,
  DEFAULT_TEST_SECRET
} = require("../utils/paymentVerification");

test("Razorpay Payment Verification Suite", async (t) => {
  await t.test("should successfully verify a valid HMAC SHA-256 signature", () => {
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

  await t.test("should reject forged or tampered signature", () => {
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

  await t.test("should reject when orderId or paymentId is modified", () => {
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

  await t.test("should reject missing or empty parameters safely", () => {
    assert.equal(verifyRazorpaySignature({ orderId: "", paymentId: "pay_1", signature: "sig" }), false);
    assert.equal(verifyRazorpaySignature({ orderId: "ord_1", paymentId: "", signature: "sig" }), false);
    assert.equal(verifyRazorpaySignature({ orderId: "ord_1", paymentId: "pay_1", signature: "" }), false);
    assert.equal(verifyRazorpaySignature({}), false);
  });
});
