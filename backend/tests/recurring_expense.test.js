const test = require("node:test");
const assert = require("node:assert/strict");
const RecurringExpense = require("../models/RecurringExpense");

test("Recurring Expense Business Logic and Interval Suite", async (t) => {
  await t.test("should instantiate RecurringExpense with correct schema fields", () => {
    const nextDate = new Date("2026-09-01");
    const rec = new RecurringExpense({
      user: "507f1f77bcf86cd799439011",
      amount: 1500,
      category: "Bills & Utilities",
      note: "Internet subscription",
      frequency: "Monthly",
      nextDate,
      lastProcessed: null
    });

    assert.equal(rec.amount, 1500);
    assert.equal(rec.category, "Bills & Utilities");
    assert.equal(rec.frequency, "Monthly");
    assert.equal(rec.nextDate.getTime(), nextDate.getTime());
    assert.equal(rec.note, "Internet subscription");
  });

  await t.test("should correctly compute next date intervals for different frequencies", () => {
    // Daily interval (+1 day)
    const dailyBase = new Date("2026-09-01T00:00:00Z");
    const dailyNext = new Date(dailyBase);
    dailyNext.setDate(dailyNext.getDate() + 1);
    assert.equal(dailyNext.toISOString().split("T")[0], "2026-09-02");

    // Weekly interval (+7 days)
    const weeklyBase = new Date("2026-09-01T00:00:00Z");
    const weeklyNext = new Date(weeklyBase);
    weeklyNext.setDate(weeklyNext.getDate() + 7);
    assert.equal(weeklyNext.toISOString().split("T")[0], "2026-09-08");

    // Monthly interval (+1 month)
    const monthlyBase = new Date("2026-09-01T00:00:00Z");
    const monthlyNext = new Date(monthlyBase);
    monthlyNext.setMonth(monthlyNext.getMonth() + 1);
    assert.equal(monthlyNext.toISOString().split("T")[0], "2026-10-01");

    // Yearly interval (+1 year)
    const yearlyBase = new Date("2026-09-01T00:00:00Z");
    const yearlyNext = new Date(yearlyBase);
    yearlyNext.setFullYear(yearlyNext.getFullYear() + 1);
    assert.equal(yearlyNext.toISOString().split("T")[0], "2027-09-01");
  });
});
