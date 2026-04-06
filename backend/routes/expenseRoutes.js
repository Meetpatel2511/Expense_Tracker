const express = require("express");
const router = express.Router();

const {
  addExpense,
  getExpenses,
  getSummary,
  getCategoryStats,
  getInsights,
  getYearlyReport,
  getSmartSuggestions,
  deleteExpense,
  updateExpense,
  getCategories,
  addRecurringExpense
} = require("../controllers/expenseController");

const authMiddleware = require("../middleware/authMiddleware");
const requirePro = require("../middleware/proMiddleware");

// Add expense
router.post("/add", authMiddleware, addExpense);

// Get all expenses
router.get("/", authMiddleware, getExpenses);

// Recurring Expenses
router.post("/recurring/add", authMiddleware, addRecurringExpense);

// Summary (income, expense, savings, balance)
router.get("/summary", authMiddleware, getSummary);

// Category stats
router.get("/categories", authMiddleware, getCategoryStats);

// Insights (month over month)
router.get("/insights", authMiddleware, getInsights);

// Yearly report (monthly data)
router.get("/yearly", authMiddleware, getYearlyReport);

// Smart suggestions (Pro only)
router.get("/suggestions", authMiddleware, requirePro, getSmartSuggestions);

// Valid categories list
router.get("/category-list", getCategories);

// Delete expense
router.delete("/:id", authMiddleware, deleteExpense);

// Update expense
router.put("/:id", authMiddleware, updateExpense);

module.exports = router;