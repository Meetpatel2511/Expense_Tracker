/**
 * Authoritative Server-Side Pricing Configuration for Pro Subscriptions
 *
 * All amounts are in lowest currency denomination (paise for INR).
 * Clients must never dictate pricing or entitlement amounts.
 */

const PRICING_PLANS = {
  MONTHLY: {
    amount: 14900, // ₹149 (in paise)
    priceINR: 149,
    currency: "INR",
    durationDays: 30,
    label: "Monthly Pro",
    billingInterval: "/month"
  },
  YEARLY: {
    amount: 99900, // ₹999 (in paise)
    priceINR: 999,
    currency: "INR",
    durationDays: 365,
    label: "Yearly Pro",
    billingInterval: "/year",
    badge: "Best Value — Save 44%"
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
 * @returns {{ amount: number, priceINR: number, currency: string, durationDays: number, label: string, billingInterval: string, badge?: string } | null}
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
