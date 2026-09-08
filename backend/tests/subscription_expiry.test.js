const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

const User = require("../models/User");
const { isProActive, calculateProExpiration, requirePro } = require("../middleware/proMiddleware");
const { getProStatus, getProfile } = require("../controllers/userController");
const { getDashboardData } = require("../controllers/expenseController");

const createTestApp = (userId = "507f1f77bcf86cd799439011") => {
  const testApp = express();
  testApp.use(express.json());

  testApp.use((req, res, next) => {
    req.user = userId;
    next();
  });

  testApp.get("/api/user/pro-status", getProStatus);
  testApp.get("/api/user/profile", getProfile);
  testApp.get("/api/user/protected-test", requirePro, (req, res) => res.json({ access: "granted" }));
  testApp.get("/api/expense/dashboard", getDashboardData);

  return testApp;
};

test("Step 1C: Subscription Expiration, Helpers, and Pro Authorization Suite", async (t) => {
  const originalUserFindById = User.findById;

  t.afterEach(() => {
    User.findById = originalUserFindById;
  });

  // 1. Duration Calculation Helpers
  await t.test("1. calculateProExpiration: Monthly duration is exactly 30 days", () => {
    const base = new Date("2026-09-01T00:00:00Z");
    const expiry = calculateProExpiration("MONTHLY", null, base);
    const expected = new Date("2026-10-01T00:00:00Z"); // 30 days later
    assert.equal(expiry.getTime(), expected.getTime());
  });

  await t.test("2. calculateProExpiration: Yearly duration is exactly 365 days", () => {
    const base = new Date("2026-09-01T00:00:00Z");
    const expiry = calculateProExpiration("YEARLY", null, base);
    const expected = new Date("2027-09-01T00:00:00Z"); // 365 days later
    assert.equal(expiry.getTime(), expected.getTime());
  });

  await t.test("3. calculateProExpiration: Active Monthly renewal extends from existing future expiry", () => {
    const existingExpiry = new Date("2026-10-15T00:00:00Z"); // Future expiry
    const now = new Date("2026-09-20T00:00:00Z"); // Early renewal date
    const extendedExpiry = calculateProExpiration("MONTHLY", existingExpiry, now);
    const expected = new Date("2026-11-14T00:00:00Z"); // 30 days added to Oct 15
    assert.equal(extendedExpiry.getTime(), expected.getTime());
  });

  await t.test("4. calculateProExpiration: Active Yearly renewal extends from existing future expiry", () => {
    const existingExpiry = new Date("2026-12-31T00:00:00Z");
    const now = new Date("2026-09-20T00:00:00Z");
    const extendedExpiry = calculateProExpiration("YEARLY", existingExpiry, now);
    const expected = new Date(existingExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
    assert.equal(extendedExpiry.getTime(), expected.getTime());
  });

  await t.test("5. calculateProExpiration: Expired subscription activation starts from current activation date", () => {
    const pastExpiry = new Date("2026-01-01T00:00:00Z"); // In the past
    const now = new Date("2026-09-08T00:00:00Z");
    const newExpiry = calculateProExpiration("MONTHLY", pastExpiry, now);
    const expected = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    assert.equal(newExpiry.getTime(), expected.getTime());
  });

  await t.test("5b. calculateProExpiration: Active Monthly -> Yearly cross-plan extension adds 365 days to existing expiry", () => {
    const existingExpiry = new Date("2026-10-15T00:00:00Z");
    const now = new Date("2026-09-20T00:00:00Z");
    const extendedExpiry = calculateProExpiration("YEARLY", existingExpiry, now);
    const expected = new Date(existingExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
    assert.equal(extendedExpiry.getTime(), expected.getTime());
  });

  await t.test("5c. calculateProExpiration: Active Yearly -> Monthly cross-plan extension adds 30 days to existing expiry", () => {
    const existingExpiry = new Date("2027-09-01T00:00:00Z");
    const now = new Date("2026-12-01T00:00:00Z");
    const extendedExpiry = calculateProExpiration("MONTHLY", existingExpiry, now);
    const expected = new Date(existingExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    assert.equal(extendedExpiry.getTime(), expected.getTime());
  });

  // Step 2 Pricing & No-Trial Assertions
  await t.test("5d. Authoritative Pricing: MONTHLY = 14900 paise, YEARLY = 99900 paise", () => {
    const { PRICING_PLANS, getPlanPricing } = require("../config/pricing");
    assert.equal(PRICING_PLANS.MONTHLY.amount, 14900);
    assert.equal(PRICING_PLANS.MONTHLY.priceINR, 149);
    assert.equal(PRICING_PLANS.MONTHLY.durationDays, 30);
    assert.equal(PRICING_PLANS.MONTHLY.currency, "INR");

    assert.equal(PRICING_PLANS.YEARLY.amount, 99900);
    assert.equal(PRICING_PLANS.YEARLY.priceINR, 999);
    assert.equal(PRICING_PLANS.YEARLY.durationDays, 365);
    assert.equal(PRICING_PLANS.YEARLY.currency, "INR");

    const monthlyMeta = getPlanPricing("MONTHLY");
    assert.equal(monthlyMeta.amount, 14900);
    const yearlyMeta = getPlanPricing("YEARLY");
    assert.equal(yearlyMeta.amount, 99900);
  });

  await t.test("5e. No-Trial Policy: User schema must not have trial fields", () => {
    const userPaths = Object.keys(User.schema.paths);
    assert.equal(userPaths.includes("trialStartsAt"), false);
    assert.equal(userPaths.includes("trialExpiresAt"), false);
    assert.equal(userPaths.includes("trialUsed"), false);
  });

  // 2. isProActive Helper Evaluation
  await t.test("6. isProActive: returns false for non-Pro / null user", () => {
    assert.equal(isProActive(null), false);
    assert.equal(isProActive({ isPro: false }), false);
  });

  await t.test("7. isProActive: returns true for active future expiry", () => {
    const futureExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    assert.equal(isProActive({ isPro: true, proExpiresAt: futureExpiry }), true);
  });

  await t.test("8. isProActive: returns false for expired past expiry", () => {
    const pastExpiry = new Date(Date.now() - 1000);
    assert.equal(isProActive({ isPro: true, proExpiresAt: pastExpiry }), false);
  });

  await t.test("9. isProActive: treats expiry at exact current timestamp as expired", () => {
    const exactNow = new Date(Date.now());
    assert.equal(isProActive({ isPro: true, proExpiresAt: exactNow }), false);
  });

  await t.test("10. isProActive: preserves active status for legacy isPro: true with missing expiry", () => {
    assert.equal(isProActive({ isPro: true }), true);
    assert.equal(isProActive({ isPro: true, proExpiresAt: null }), true);
    assert.equal(isProActive({ isPro: true, proExpiresAt: undefined }), true);
  });

  // 3. requirePro Middleware Integration
  await t.test("11. requirePro: Free user is rejected with 403 PRO_REQUIRED", async () => {
    const app = createTestApp();
    User.findById = () => ({
      select: async () => ({ _id: "507f1f77bcf86cd799439011", isPro: false })
    });

    const res = await request(app).get("/api/user/protected-test");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "PRO_REQUIRED");
  });

  await t.test("12. requirePro: Active Monthly Pro user is granted access", async () => {
    const app = createTestApp();
    const futureExpiry = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    User.findById = () => ({
      select: async () => ({ _id: "507f1f77bcf86cd799439011", isPro: true, plan: "MONTHLY", proExpiresAt: futureExpiry })
    });

    const res = await request(app).get("/api/user/protected-test");
    assert.equal(res.status, 200);
    assert.equal(res.body.access, "granted");
  });

  await t.test("13. requirePro: Expired Monthly Pro user is rejected with 403 PRO_REQUIRED", async () => {
    const app = createTestApp();
    const pastExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000);
    User.findById = () => ({
      select: async () => ({ _id: "507f1f77bcf86cd799439011", isPro: true, plan: "MONTHLY", proExpiresAt: pastExpiry })
    });

    const res = await request(app).get("/api/user/protected-test");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "PRO_REQUIRED");
  });

  await t.test("14. requirePro: Expired Yearly Pro user is rejected with 403 PRO_REQUIRED", async () => {
    const app = createTestApp();
    const pastExpiry = new Date(Date.now() - 5000);
    User.findById = () => ({
      select: async () => ({ _id: "507f1f77bcf86cd799439011", isPro: true, plan: "YEARLY", proExpiresAt: pastExpiry })
    });

    const res = await request(app).get("/api/user/protected-test");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "PRO_REQUIRED");
  });

  await t.test("15. requirePro: Legacy Pro user without expiry is granted access", async () => {
    const app = createTestApp();
    User.findById = () => ({
      select: async () => ({ _id: "507f1f77bcf86cd799439011", isPro: true })
    });

    const res = await request(app).get("/api/user/protected-test");
    assert.equal(res.status, 200);
    assert.equal(res.body.access, "granted");
  });

  // 4. getProStatus Endpoint
  await t.test("16. getProStatus: Reports accurate active subscription metadata", async () => {
    const app = createTestApp();
    const proStartsAt = new Date("2026-09-01T00:00:00Z");
    const proExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    User.findById = () => ({
      select: async () => ({
        _id: "507f1f77bcf86cd799439011",
        isPro: true,
        plan: "MONTHLY",
        proSince: proStartsAt,
        proStartsAt: proStartsAt,
        proExpiresAt: proExpiresAt
      })
    });

    const res = await request(app).get("/api/user/pro-status");
    assert.equal(res.status, 200);
    assert.equal(res.body.isPro, true);
    assert.equal(res.body.plan, "MONTHLY");
    assert.equal(new Date(res.body.proExpiresAt).getTime(), proExpiresAt.getTime());
  });

  await t.test("17. getProStatus: Reports isPro: false for expired subscription", async () => {
    const app = createTestApp();
    const pastExpiry = new Date(Date.now() - 86400000);

    User.findById = () => ({
      select: async () => ({
        _id: "507f1f77bcf86cd799439011",
        isPro: true,
        plan: "MONTHLY",
        proSince: new Date("2026-01-01"),
        proStartsAt: new Date("2026-01-01"),
        proExpiresAt: pastExpiry
      })
    });

    const res = await request(app).get("/api/user/pro-status");
    assert.equal(res.status, 200);
    assert.equal(res.body.isPro, false, "Expired user must report isPro: false");
    assert.equal(res.body.plan, "MONTHLY");
  });
});
