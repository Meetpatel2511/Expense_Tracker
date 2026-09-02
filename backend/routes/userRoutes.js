const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, createOrder, upgradeToPro, getProStatus, resetPro, getHealthScore } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// All user routes require authentication
router.use(authMiddleware);

router.get("/profile", getProfile);
router.get("/health-score", getHealthScore);
router.put("/update", updateProfile);
router.post("/create-order", createOrder);
router.post("/upgrade-pro", upgradeToPro);
router.get("/pro-status", getProStatus);

// DEV ONLY: Reset Pro status for testing — blocked in production
if (process.env.NODE_ENV === "development") {
  router.post("/reset-pro", resetPro);
}

module.exports = router;
