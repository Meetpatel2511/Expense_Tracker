const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const adminPaymentController = require("../controllers/adminPaymentController");

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
 * Admin Payment Request Review Routes
 */
router.get("/payment-requests", adminPaymentController.getQueue);
router.get("/payment-requests/:id", adminPaymentController.getDetail);
router.get("/payment-requests/:id/receipt", adminPaymentController.getReceipt);
router.post("/payment-requests/:id/approve", adminPaymentController.approve);
router.post("/payment-requests/:id/reject", adminPaymentController.reject);
router.post("/payment-requests/:id/request-info", adminPaymentController.requestInfo);

module.exports = router;

