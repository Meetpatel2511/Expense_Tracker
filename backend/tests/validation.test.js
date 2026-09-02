const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isValidObjectId,
  isValidAmount,
  isValidDate,
  parsePagination,
  parseMonthYear
} = require("../middleware/validation");

test("Input Validation Helper Suite", async (t) => {
  await t.test("isValidObjectId should correctly validate 24-char hex ObjectIds", () => {
    assert.equal(isValidObjectId("507f1f77bcf86cd799439011"), true);
    assert.equal(isValidObjectId("60d0fe4f5311236168a109ca"), true);

    // Invalid IDs
    assert.equal(isValidObjectId("123"), false);
    assert.equal(isValidObjectId("invalid-id"), false);
    assert.equal(isValidObjectId("507f1f77bcf86cd79943901z"), false);
    assert.equal(isValidObjectId(""), false);
    assert.equal(isValidObjectId(null), false);
    assert.equal(isValidObjectId(undefined), false);
  });

  await t.test("isValidAmount should validate positive finite numbers", () => {
    assert.equal(isValidAmount(100), true);
    assert.equal(isValidAmount("199.50"), true);
    assert.equal(isValidAmount(0.01), true);

    // Invalid amounts
    assert.equal(isValidAmount(0), false);
    assert.equal(isValidAmount(-50), false);
    assert.equal(isValidAmount("abc"), false);
    assert.equal(isValidAmount(Infinity), false);
    assert.equal(isValidAmount(true), false);
    assert.equal(isValidAmount(false), false);
    assert.equal(isValidAmount(null), false);
    assert.equal(isValidAmount(2000000000), false); // Over upper bound
  });

  await t.test("isValidDate should validate parseable date strings", () => {
    assert.equal(isValidDate("2026-09-02"), true);
    assert.equal(isValidDate("2026-09-02T12:00:00Z"), true);
    assert.equal(isValidDate(new Date()), true);

    // Invalid dates
    assert.equal(isValidDate("not-a-date"), false);
    assert.equal(isValidDate(""), false);
    assert.equal(isValidDate(null), false);
  });

  await t.test("parsePagination should clamp page and limit safely", () => {
    const defaultRes = parsePagination({});
    assert.equal(defaultRes.page, 1);
    assert.equal(defaultRes.limit, 10);
    assert.equal(defaultRes.skip, 0);

    const clampedRes = parsePagination({ page: "-5", limit: "500" }, 10, 100);
    assert.equal(clampedRes.page, 1);
    assert.equal(clampedRes.limit, 100);
    assert.equal(clampedRes.skip, 0);

    const customRes = parsePagination({ page: "3", limit: "25" });
    assert.equal(customRes.page, 3);
    assert.equal(customRes.limit, 25);
    assert.equal(customRes.skip, 50);
  });

  await t.test("parseMonthYear should validate month and year bounds", () => {
    const valid = parseMonthYear("3", "2026");
    assert.equal(valid.isValid, true);
    assert.equal(valid.month, 3);
    assert.equal(valid.year, 2026);

    const invalidMonth = parseMonthYear("15", "2026");
    assert.equal(invalidMonth.isValid, false);

    const invalidYear = parseMonthYear("5", "1800");
    assert.equal(invalidYear.isValid, false);
  });
});
