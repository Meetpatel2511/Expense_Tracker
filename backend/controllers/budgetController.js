const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const { sanitize } = require("../utils/sanitize");

// SET BUDGET (Global or Category-specific)
exports.setBudget = async (req, res) => {
  try {
    const { amount, category } = req.body;
    const cat = sanitize(category || "Global", 50);

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Budget amount must be a positive number" });
    }

    const month = req.query.month ? parseInt(req.query.month) - 1 : new Date().getUTCMonth();
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

    // Use upsert-like logic with category
    let budget = await Budget.findOne({ user: req.user, month, year, category: cat });

    if (budget) {
      budget.amount = Number(amount);
    } else {
      budget = new Budget({
        user: req.user,
        amount: Number(amount),
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
    const month = req.query.month ? parseInt(req.query.month) - 1 : new Date().getUTCMonth();
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

    const budgets = await Budget.find({ user: req.user, month, year });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BUDGET STATUS (Summarized for all set budgets)
exports.getBudgetStatus = async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month) - 1 : new Date().getUTCMonth();
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

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
      const remaining = b.amount - spent;
      const percentage = Math.min((spent / b.amount) * 100, 100);
      
      let status = "Good";
      if (remaining < 0) status = "Over budget";
      else if (remaining < b.amount * 0.2) status = "Warning";

      return {
        category: b.category,
        budget: b.amount,
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