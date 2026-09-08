/**
 * Authoritative Server-Side Pricing Configuration for Pro Subscriptions
 *
 * All amounts are in lowest currency denomination (paise for INR).
 * Clients must never dictate pricing or entitlement amounts.
 */

const PRICING_PLANS = {
  MONTHLY: {
    amount: 19900, // ₹199
    currency: "INR"
  },
  YEARLY: {
    amount: 99900, // ₹999
    currency: "INR"
  }
};

const VALID_PLANS = Object.keys(PRICING_PLANS);

/**
 * Validates if a given plan name is a supported subscription plan.
 * @param {string} plan
 * @returns {boolean}
 */
const isValidPlan = (plan) => typeof plan === "string" && VALID_PLANS.includes(plan.toUpperCase().trim());

/**
 * Retrieves pricing metadata for a given plan.
 * @param {string} [plan="MONTHLY"]
 * @returns {{ amount: number, currency: string } | null}
 */
const getPlanPricing = (plan = "MONTHLY") => {
  if (!plan || typeof plan !== "string") return null;
  return PRICING_PLANS[plan.toUpperCase().trim()] || null;
};

module.exports = {
  PRICING_PLANS,
  VALID_PLANS,
  isValidPlan,
  getPlanPricing
};
