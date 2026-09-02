const crypto = require("crypto");

/**
 * Default test secret for development/demo test environment if RAZORPAY_KEY_SECRET is not in env.
 */
const DEFAULT_TEST_SECRET = "rzp_test_secret_portfolio_demo";

/**
 * Cryptographically verifies Razorpay payment signature using HMAC SHA-256.
 *
 * @param {Object} params
 * @param {string} params.orderId - Razorpay Order ID (e.g. order_xxx)
 * @param {string} params.paymentId - Razorpay Payment ID (e.g. pay_xxx)
 * @param {string} params.signature - Razorpay HMAC SHA-256 signature
 * @param {string} [params.secret] - Optional secret, defaults to env or test secret
 * @returns {boolean} True if signature matches cryptographically
 */
function verifyRazorpaySignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const keySecret = secret || process.env.RAZORPAY_KEY_SECRET || DEFAULT_TEST_SECRET;

  try {
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(generatedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

/**
 * Helper to generate a valid test signature for development/test environment.
 * Useful for automated tests and frontend test simulator.
 *
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} [secret]
 * @returns {string} HMAC SHA-256 hex digest
 */
function generateTestSignature(orderId, paymentId, secret) {
  const keySecret = secret || process.env.RAZORPAY_KEY_SECRET || DEFAULT_TEST_SECRET;
  return crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

module.exports = {
  verifyRazorpaySignature,
  generateTestSignature,
  DEFAULT_TEST_SECRET
};
