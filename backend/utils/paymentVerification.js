const crypto = require("crypto");

/**
 * Deterministic test secret used ONLY in automated test suite (NODE_ENV === "test").
 * Never used as a fallback in development or production.
 */
const DEFAULT_TEST_SECRET = "rzp_test_secret_portfolio_demo";

/**
 * Resolves the effective HMAC key secret safely.
 * Fails closed in production if RAZORPAY_KEY_SECRET is not configured.
 *
 * @param {string} [secret] - Explicitly provided secret
 * @returns {string|null} Effective secret or null if missing/unauthorized
 */
function getEffectiveSecret(secret) {
  if (secret) return secret;
  if (process.env.RAZORPAY_KEY_SECRET) return process.env.RAZORPAY_KEY_SECRET;

  // Strictly allow test fallback only when running the test runner
  if (process.env.NODE_ENV === "test") {
    return DEFAULT_TEST_SECRET;
  }

  // In production or development without secret configured, fail closed
  return null;
}

/**
 * Cryptographically verifies Razorpay payment signature using HMAC SHA-256.
 *
 * @param {Object} params
 * @param {string} params.orderId - Razorpay Order ID (e.g. order_xxx)
 * @param {string} params.paymentId - Razorpay Payment ID (e.g. pay_xxx)
 * @param {string} params.signature - Razorpay HMAC SHA-256 signature
 * @param {string} [params.secret] - Optional secret override
 * @returns {boolean} True if signature matches cryptographically
 */
function verifyRazorpaySignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const keySecret = getEffectiveSecret(secret);
  if (!keySecret) {
    // Fail closed if RAZORPAY_KEY_SECRET is not configured
    return false;
  }

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
    return false;
  }
}

/**
 * Helper to generate a valid test signature for development/test environment.
 * Useful for automated tests and test simulation.
 *
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} [secret]
 * @returns {string} HMAC SHA-256 hex digest
 */
function generateTestSignature(orderId, paymentId, secret) {
  const keySecret = getEffectiveSecret(secret) || DEFAULT_TEST_SECRET;
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
