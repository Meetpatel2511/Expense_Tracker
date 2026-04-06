const User = require("../models/User");

/**
 * Middleware to verify Pro membership server-side.
 * Must be placed AFTER authMiddleware (requires req.user to be set).
 */
const requirePro = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select("isPro");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isPro) {
      return res.status(403).json({ 
        message: "Pro membership required. Upgrade to access this feature.",
        code: "PRO_REQUIRED"
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Pro verification failed" });
  }
};

module.exports = requirePro;
