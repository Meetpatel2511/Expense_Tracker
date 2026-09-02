const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const { sanitize } = require("../utils/sanitize");
const { isValidAmount, parseMonthYear } = require("../middleware/validation");

// SET BUDGET (Global or Category-specific)
exports.setBudget = async (req, res) => {
  try {
    const { amount, category } = req.body;
    const cat = sanitize(category || "Global", 50);

    if (!isValidAmount(amount)) {
      return res.status(400).json({ message: "Budget amount must be a positive number (up to 1,000,000,000)" });
    }

    const { month: qMonth, year } = parseMonthYear(req.query.month, req.query.year);
    const month = qMonth - 1; // 0-indexed month for internal storage

    // Upsert budget for user, month, year, category
    let budget = await Budget.findOne({ user: req.user, month, year, category: cat });

    if (budget) {
      budget.limit = Number(amount);
    } else {
      budget = new Budget({
        user: req.user,
        limit: Number(amount),
        month,
        year,
        category: cat
      });
    }

    await budget.save();
    res.json({ message: `Budget for ${cat} set successfully`, budget });

  } catch (error) {
    console.error("Set Budget Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL BUDGETS FOR A MONTH
exports.getBudgets = async (req, res) => {
  try {
    const { month: qMonth, year } = parseMonthYear(req.query.month, req.query.year);
    const month = qMonth - 1;

    const budgets = await Budget.find({ user: req.user, month, year });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BUDGET STATUS (Summarized for all set budgets)
exports.getBudgetStatus = async (req, res) => {
  try {
    const { month: qMonth, year } = parseMonthYear(req.query.month, req.query.year);
    const month = qMonth - 1;

    const budgets = await Budget.find({ user: req.user, month, year });
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1));

    const expenses = await Expense.find({ 
      user: req.user, 
      date: { $gte: start, $lt: end } 
    });

    // Map spending by category
    const spendingMap = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      acc["Global"] = (acc["Global"] || 0) + exp.amount;
      return acc;
    }, {});

    if (budgets.length === 0) {
      return res.json({
        hasBudget: false,
        global: { spent: spendingMap["Global"] || 0 },
        categories: []
      });
    }

    const processedBudgets = budgets.map(b => {
      const spent = spendingMap[b.category] || 0;
      const remaining = b.limit - spent;
      const percentage = Math.min((spent / b.limit) * 100, 100);
      
      let status = "Good";
      if (remaining < 0) status = "Over budget";
      else if (remaining < b.limit * 0.2) status = "Warning";

      return {
        category: b.category,
        budget: b.limit,
        spent,
        remaining,
        percentage: Number(percentage.toFixed(1)),
        status
      };
    });

    const globalBudget = processedBudgets.find(b => b.category === "Global");
    const globalSpent = spendingMap["Global"] || 0;

    res.json({
      hasBudget: true,
      global: globalBudget || { 
        category: "Global",
        spent: globalSpent,
        budget: 0,
        remaining: -globalSpent,
        percentage: 0,
        status: "No limit set"
      },
      categories: processedBudgets.filter(b => b.category !== "Global")
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};