const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const { processSupportUpload } = require("../middleware/uploadMiddleware");
const adminPaymentController = require("../controllers/adminPaymentController");
const adminDashboardController = require("../controllers/adminDashboardController");
const paymentSupportController = require("../controllers/paymentSupportController");

// All routes under /api/admin require authentication + ADMIN role
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * GET /api/admin/me
 * Helper endpoint for frontend navigation & UX detection.
 * Returns isAdmin: true and sanitized admin profile.
 */
router.get("/me", (req, res) => {
  res.json({
    isAdmin: true,
    user: {
      _id: req.adminUser._id,
      name: req.adminUser.name,
      email: req.adminUser.email,
      role: req.adminUser.role
    }
  });
});

/**
 * Admin SaaS Dashboard & Management Routes
 */
router.get("/dashboard", adminDashboardController.getDashboardOverview);
router.get("/subscriptions", adminDashboardController.getSubscriptions);
router.get("/users", adminDashboardController.getUsers);
router.get("/analytics", adminDashboardController.getAnalytics);

/**
 * Admin Payment Request Review Routes
 */
router.get("/payment-requests", adminPaymentController.getQueue);
router.get("/payment-requests/:id", adminPaymentController.getDetail);
router.get("/payment-requests/:id/receipt", adminPaymentController.getReceipt);
router.post("/payment-requests/:id/approve", adminPaymentController.approve);
router.post("/payment-requests/:id/reject", adminPaymentController.reject);
router.post("/payment-requests/:id/request-info", adminPaymentController.requestInfo);

/**
 * Admin Payment Support Routes
 */
router.get("/payment-requests/:id/support", paymentSupportController.getAdminSupportMessages);
router.post(
  "/payment-requests/:id/support",
  processSupportUpload("attachment"),
  paymentSupportController.sendAdminSupportMessage
);
router.get("/payment-requests/:id/support/attachment/:messageId", paymentSupportController.getAdminSupportAttachment);

module.exports = router;
