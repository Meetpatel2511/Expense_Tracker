const User = require("../models/User");

/**
 * Authorization middleware that strictly verifies if the authenticated user
 * has an "ADMIN" role in MongoDB.
 * 
 * Rules:
 * - Must be placed AFTER authMiddleware (which resolves and attaches req.user)
 * - User.role in MongoDB is the ONLY authorization source of truth
 * - Does NOT inspect environment variables or auto-promote users
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
        code: "UNAUTHORIZED"
      });
    }

    const user = await User.findById(req.user).select("role email name");

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
        code: "USER_NOT_FOUND"
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied. Administrator privileges required.",
        code: "ADMIN_REQUIRED"
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error("requireAdmin Authorization Error:", error);
    return res.status(500).json({
      message: "Internal authorization error.",
      code: "INTERNAL_ERROR"
    });
  }
};

module.exports = requireAdmin;
