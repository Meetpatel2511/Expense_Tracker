const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const { processReceiptUpload } = require("../middleware/uploadMiddleware");
const {
  getConfig,
  submitPaymentRequest,
  getMyPaymentRequests,
  resubmitPaymentRequest
} = require("../controllers/paymentRequestController");

// Dedicated rate limiter for manual payment submission and upload operations
// 5 submissions per 15 minutes per IP to prevent spam and resource exhaustion
const paymentSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many payment submission attempts. Please wait 15 minutes before trying again.",
    code: "RATE_LIMITED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test" // Skip rate limiter in automated test runs
});

// All payment-request routes require authentication
router.use(authMiddleware);

// 1. Get UPI Configuration & Authoritative Pricing
router.get("/config", getConfig);

// 2. Submit initial Payment Request with receipt screenshot
router.post(
  "/submit",
  paymentSubmissionLimiter,
  processReceiptUpload("screenshot"),
  submitPaymentRequest
);

// 3. View user's own payment requests history
router.get("/my-requests", getMyPaymentRequests);

// 4. Resubmit payment evidence for a request in NEEDS_MORE_INFO status
router.put(
  "/:id/resubmit",
  paymentSubmissionLimiter,
  processReceiptUpload("screenshot"),
  resubmitPaymentRequest
);

module.exports = router;
