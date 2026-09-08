const User = require("../models/User");

/**
 * Checks whether a user document represents an active Pro subscription.
 * Handles legacy Pro users (isPro: true without proExpiresAt) safely.
 *
 * @param {Object} user - User document or partial object with isPro, proExpiresAt
 * @returns {boolean} True if user currently has active Pro access
 */
const isProActive = (user) => {
  if (!user || !user.isPro) return false;
  // Legacy compatibility: existing Pro users without proExpiresAt remain active
  if (!user.proExpiresAt) return true;
  return new Date(user.proExpiresAt) > new Date();
};

/**
 * Calculates a new subscription expiration date.
 * If current subscription is still active, extends from currentExpiresAt.
 * Otherwise, calculates from startDate (now).
 *
 * @param {string} [plan="MONTHLY"] - "MONTHLY" (30d) or "YEARLY" (365d)
 * @param {Date|string|null} [currentExpiresAt=null] - Existing expiration timestamp
 * @param {Date} [startDate=new Date()] - Activation base timestamp
 * @returns {Date} Calculated expiration timestamp
 */
const calculateProExpiration = (plan = "MONTHLY", currentExpiresAt = null, startDate = new Date()) => {
  const durationDays = plan === "YEARLY" ? 365 : 30;
  const durationMs = durationDays * 24 * 60 * 60 * 1000;

  if (currentExpiresAt && new Date(currentExpiresAt) > new Date()) {
    return new Date(new Date(currentExpiresAt).getTime() + durationMs);
  }

  return new Date(startDate.getTime() + durationMs);
};

/**
 * Middleware to verify Pro membership server-side.
 * Must be placed AFTER authMiddleware (requires req.user to be set).
 */
const requirePro = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select("isPro proExpiresAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!isProActive(user)) {
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
module.exports.requirePro = requirePro;
module.exports.isProActive = isProActive;
module.exports.calculateProExpiration = calculateProExpiration;
