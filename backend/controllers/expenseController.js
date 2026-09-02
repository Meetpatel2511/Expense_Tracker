const Expense = require("../models/Expense");
const Income = require("../models/Income");
const User = require("../models/User");
const Budget = require("../models/Budget");
const RecurringExpense = require("../models/RecurringExpense");
const { sanitize } = require("../utils/sanitize");
const {
  isValidObjectId,
  isValidAmount,
  isValidDate,
  parsePagination,
  parseMonthYear
} = require("../middleware/validation");
const mongoose = require("mongoose");

// VALID CATEGORIES
const VALID_CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment",
  "Bills & Utilities", "Healthcare", "Education", "Travel",
  "Groceries", "Rent", "Other"
];

// ADD EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const { amount, category, note, date } = req.body;

    if (!isValidAmount(amount)) {
      return res.status(400).json({ message: "Amount must be a positive number (up to 1,000,000,000)" });
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }

    const trimmedCategory = category.trim();
    if (!VALID_CATEGORIES.includes(trimmedCategory)) {
      return res.status(400).json({ 
        message: `Invalid category. Allowed categories: ${VALID_CATEGORIES.join(", ")}` 
      });
    }

    if (date && !isValidDate(date)) {
      return res.status(400).json({ message: "Invalid date format provided" });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const expense = new Expense({
      user: req.user,
      family: user.family,
      amount: Number(amount),
      category: sanitize(trimmedCategory, 50),
      note: sanitize(note, 200),
      date: date ? new Date(date) : new Date()
    });

    await expense.save();

    res.json({ message: "Expense added", expense });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL EXPENSES (Supported: Search, Filtering, Pagination)
exports.getExpenses = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount
    } = req.query;

    const { page, limit, skip } = parsePagination(req.query, 10, 100);

    let query = { user: req.user };

    // 🔍 Search (Note) with regex escaping
    if (search && typeof search === "string") {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.note = { $regex: sanitizedSearch, $options: "i" };
    }

    // 📂 Category Filter
    if (category && typeof category === "string" && VALID_CATEGORIES.includes(category.trim())) {
      query.category = category.trim();
    }

    // 📅 Date Range Filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        if (!isValidDate(startDate)) return res.status(400).json({ message: "Invalid startDate format" });
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        if (!isValidDate(endDate)) return res.status(400).json({ message: "Invalid endDate format" });
        query.date.$lte = new Date(endDate);
      }
    } else {
      // Default to current month if no dates provided (for UI convenience)
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // 💰 Amount Filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined && minAmount !== "") {
        if (isNaN(Number(minAmount)) || Number(minAmount) < 0) {
          return res.status(400).json({ message: "Invalid minAmount" });
        }
        query.amount.$gte = Number(minAmount);
      }
      if (maxAmount !== undefined && maxAmount !== "") {
        if (isNaN(Number(maxAmount)) || Number(maxAmount) < 0) {
          return res.status(400).json({ message: "Invalid maxAmount" });
        }
        query.amount.$lte = Number(maxAmount);
      }
    }

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(query)
    ]);

    res.json({
      data: expenses,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// HELPER: PROCESS RECURRING EXPENSES (Every Dashboard Load)
const processRecurringExpenses = async (userId) => {
  try {
    const now = new Date();
    const recurring = await RecurringExpense.find({ user: userId, isActive: true, nextExecutionDate: { $lte: now } });

    for (const rec of recurring) {
      let nextDate = new Date(rec.nextExecutionDate);
      
      // Keep processing if missed multiple intervals (e.g. daily missed for 3 days)
      while (nextDate <= now) {
        // Create the actual expense entry
        const newExpense = new Expense({
          user: userId,
          amount: rec.amount,
          category: rec.category,
          note: `[Recurring] ${rec.note || ""}`,
          date: new Date(nextDate)
        });
        await newExpense.save();

        // Increment based on frequency
        if (rec.frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
        else if (rec.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        else if (rec.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
        else if (rec.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        // Safety break if something goes wrong with dates
        if (rec.frequency === "daily" && nextDate < rec.nextExecutionDate) break; 
      }

      rec.nextExecutionDate = nextDate;
      rec.lastProcessedAt = now;
      await rec.save();
    }
  } catch (err) {
    console.error("Recurring Processing Error:", err);
  }
};

// GET SUMMARY (MongoDB query filtering)
exports.getSummary = async (req, res) => {
  try {
    // Process any pending recurring expenses first to ensure fresh data
    await processRecurringExpenses(req.user);

    const month = req.query.month ? parseInt(req.query.month) : new Date().getUTCMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

    // Selected Month Range
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    // Previous Month Range
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastMonthYear = month === 1 ? year - 1 : year;
    const lastStart = new Date(Date.UTC(lastMonthYear, lastMonth - 1, 1));
    const lastEnd = new Date(Date.UTC(lastMonthYear, lastMonth, 1));

    // Fetch this month and last month data using queries
    const [allTimeExpense, allTimeIncome, monthlyExpense, monthlyIncome, lastExpenses, lastIncomes] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user, date: { $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Income.aggregate([
        { $match: { user: req.user, date: { $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Expense.aggregate([
        { $match: { user: req.user, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Income.aggregate([
        { $match: { user: req.user, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Expense.find({ user: req.user, date: { $gte: lastStart, $lt: lastEnd } }),
      Income.find({ user: req.user, date: { $gte: lastStart, $lt: lastEnd } })
    ]);

    const totalExpense = monthlyExpense[0]?.total || 0;
    const totalIncome = monthlyIncome[0]?.total || 0;
    const balance = (allTimeIncome[0]?.total || 0) - (allTimeExpense[0]?.total || 0);
    
    let lastMonthIncome = lastIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    let lastMonthExpense = lastExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const savings = totalIncome - totalExpense;
    const lastMonthSavings = lastMonthIncome - lastMonthExpense;

    // Changes
    const incomeChange = lastMonthIncome > 0
      ? Number(((totalIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1))
      : 0;
    const expenseChange = lastMonthExpense > 0
      ? Number(((totalExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1))
      : 0;
    const savingsChange = lastMonthSavings !== 0
      ? Number(((savings - lastMonthSavings) / Math.abs(lastMonthSavings) * 100).toFixed(1))
      : 0;

    res.json({
      totalIncome,
      totalExpense,
      savings,
      balance,
      incomeChange,
      expenseChange,
      savingsChange,
      totalTransactions: (monthlyExpense[0]?.count || 0) + (monthlyIncome[0]?.count || 0)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET CATEGORY STATS (MongoDB query filtering)
exports.getCategoryStats = async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month) : new Date().getUTCMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const expenses = await Expense.find({ 
      user: req.user, 
      date: { $gte: start, $lt: end } 
    });

    const categoryMap = {};
    let total = 0;

    expenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
      total += exp.amount;
    });

    res.json({ categories: categoryMap, total });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET INSIGHTS (Dashboard Stats)
exports.getInsights = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Only fetch expenses from this month and last month
    const startOfLastMonth = new Date(Date.UTC(lastMonthYear, lastMonth, 1));
    const endOfThisMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 1));

    const expenses = await Expense.find({ 
      user: req.user,
      date: { $gte: startOfLastMonth, $lt: endOfThisMonth }
    });

    let currentMonthTotal = 0;
    let lastMonthTotal = 0;
    let categoryMapCurrent = {};
    let categoryMapLast = {};

    expenses.forEach(exp => {
      const d = new Date(exp.date);
      const m = d.getUTCMonth();
      const y = d.getUTCFullYear();

      if (m === currentMonth && y === currentYear) {
        currentMonthTotal += exp.amount;
        categoryMapCurrent[exp.category] = (categoryMapCurrent[exp.category] || 0) + exp.amount;
      }

      if (m === lastMonth && y === lastMonthYear) {
        lastMonthTotal += exp.amount;
        categoryMapLast[exp.category] = (categoryMapLast[exp.category] || 0) + exp.amount;
      }
    });

    const insights = [];

    if (currentMonthTotal > lastMonthTotal * 1.5 && lastMonthTotal > 0) {
      insights.push("Your total spending increased significantly this month");
    }

    for (let category in categoryMapCurrent) {
      const current = categoryMapCurrent[category];
      const previous = categoryMapLast[category] || 0;

      if (previous > 0 && current > previous * 1.5) {
        insights.push(`High spending on ${category}`);
      }
    }

    if (insights.length === 0) {
      insights.push("Your spending is under control");
    }

    res.json({ currentMonthTotal, lastMonthTotal, insights });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET YEARLY REPORT (fixed data shape for Recharts)
exports.getYearlyReport = async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const [expenses, incomes] = await Promise.all([
      Expense.find({ user: req.user, date: { $gte: start, $lt: end } }),
      Income.find({ user: req.user, date: { $gte: start, $lt: end } })
    ]);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('default', { month: 'short' }),
      expense: 0,
      income: 0
    }));

    expenses.forEach(exp => {
      const d = new Date(exp.date);
      monthlyData[d.getUTCMonth()].expense += exp.amount;
    });

    incomes.forEach(inc => {
      const d = new Date(inc.date);
      monthlyData[d.getUTCMonth()].income += inc.amount;
    });

    res.json({ year, monthlyData });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// HELPER: AI SMART ALERTS (CRED-LEVEL)
const generateSmartAlerts = ({ expenses, budgets, transactions, user }) => {
  const alerts = [];
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const transactionCount = transactions.length;

  // 1. MINIMUM DATA CHECK
  const accountAgeInDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  
  if (totalExpense < 1000 || transactionCount < 3 || accountAgeInDays < 3) {
    return [{
      type: "info",
      text: "We're still learning your spending patterns. Insights will improve soon. ✨",
      priority: 3,
      icon: "FiInfo"
    }];
  }

  // 2. CATEGORY ANALYSIS
  const categoryMap = {};
  expenses.forEach(exp => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });

  budgets.forEach(b => {
    if (b.category === "Global") return; // Handle global separately if needed

    const spent = categoryMap[b.category] || 0;
    const limit = b.limit;
    const percentage = (spent / limit) * 100;

    if (spent > limit) {
      alerts.push({
        type: "danger",
        text: `You've exceeded your budget for ${b.category} by ₹${(spent - limit).toLocaleString()}.`,
        priority: 1,
        icon: "FiAlertCircle"
      });
    } else if (percentage >= 90) {
      alerts.push({
        type: "warning",
        text: `You're close to your limit for ${b.category}.`,
        priority: 2,
        icon: "FiAlertTriangle"
      });
    } else if (percentage >= 75) {
      alerts.push({
        type: "warning",
        text: `You're approaching your budget for ${b.category}. Keep an eye on it.`,
        priority: 2,
        icon: "FiAlertTriangle"
      });
    } else if (percentage >= 50) {
      alerts.push({
        type: "info",
        text: `Spending on ${b.category} is balanced so far.`,
        priority: 3,
        icon: "FiInfo"
      });
    } else {
      alerts.push({
        type: "success",
        text: `You're well within your budget for ${b.category}. Nice control.`,
        priority: 3,
        icon: "FiCheckCircle"
      });
    }
  });

  // 3. NO BUDGET CASE
  const categoriesWithBudget = new Set(budgets.map(b => b.category));
  Object.keys(categoryMap).forEach(cat => {
    if (!categoriesWithBudget.has(cat)) {
      alerts.push({
        type: "info",
        text: `You've spent ₹${categoryMap[cat].toLocaleString()} on ${cat}. Consider setting a budget to track better.`,
        priority: 3,
        icon: "FiPieChart"
      });
    }
  });

  // Sort by priority and limit to top 3
  return alerts
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
};

// GET DASHBOARD (NEW Unified Optimized Endpoint)
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user;
    const month = req.query.month ? parseInt(req.query.month) : new Date().getUTCMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

    // Time Ranges (UTC for consistency)
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    // Previous Month (for comparison)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
    const prevEnd = new Date(Date.UTC(prevYear, prevMonth, 1));

    // Parallel fetching with .lean() for performance
    const [
      user,
      currentExpenses,
      currentIncomes,
      prevExpenses,
      prevIncomes,
      budgets,
      allTimeExpense,
      allTimeIncome,
      yearlyReport
    ] = await Promise.all([
      User.findById(userId).lean(),
      Expense.find({ user: userId, date: { $gte: start, $lt: end } }).sort({ date: -1 }).lean(),
      Income.find({ user: userId, date: { $gte: start, $lt: end } }).lean(),
      Expense.find({ user: userId, date: { $gte: prevStart, $lt: prevEnd } }).lean(),
      Income.find({ user: userId, date: { $gte: prevStart, $lt: prevEnd } }).lean(),
      Budget.find({ user: userId, month: month - 1, year }).lean(),
      Expense.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), date: { $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Income.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), date: { $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // Yearly stats part (mimic getYearlyReport logic)
      Promise.resolve().then(async () => {
        const yStart = new Date(Date.UTC(year, 0, 1));
        const yEnd = new Date(Date.UTC(year + 1, 0, 1));
        const [yExp, yInc] = await Promise.all([
          Expense.find({ user: userId, date: { $gte: yStart, $lt: yEnd } }).lean(),
          Income.find({ user: userId, date: { $gte: yStart, $lt: yEnd } }).lean()
        ]);
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString('default', { month: 'short' }),
          expense: 0,
          income: 0
        }));
        yExp.forEach(e => monthlyData[new Date(e.date).getUTCMonth()].expense += e.amount);
        yInc.forEach(i => monthlyData[new Date(i.date).getUTCMonth()].income += i.amount);
        return monthlyData;
      })
    ]);

    // Current totals
    const totalExpense = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = currentIncomes.reduce((sum, i) => sum + i.amount, 0);
    const savings = totalIncome - totalExpense;
    const balance = (allTimeIncome[0]?.total || 0) - (allTimeExpense[0]?.total || 0);

    // Prev month comparison for changes
    const lastMonthExpense = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthSavings = prevIncomes.reduce((sum, i) => sum + i.amount, 0) - lastMonthExpense;

    const expenseChange = lastMonthExpense > 0 
      ? Number(((totalExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1)) 
      : 0;
    const savingsChange = lastMonthSavings !== 0 
      ? Number(((savings - lastMonthSavings) / Math.abs(lastMonthSavings) * 100).toFixed(1)) 
      : 0;

    // Category breakdown
    const categoryMap = {};
    currentExpenses.forEach(e => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    // Generate Smart Alerts
    const alerts = generateSmartAlerts({ 
      expenses: currentExpenses, 
      budgets, 
      transactions: currentExpenses, 
      user 
    });

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        savings,
        balance,
        expenseChange,
        savingsChange
      },
      categories: categoryMap,
      budgets: {
        categories: budgets.map(b => ({ category: b.category, budget: b.limit })),
        global: budgets.find(b => b.category === "Global") ? { budget: budgets.find(b => b.category === "Global").limit } : null
      },
      recentTransactions: currentExpenses.slice(0, 5),
      monthlyData: yearlyReport,
      alerts,
      lastUpdated: Date.now()
    });

  } catch (error) {
    console.error("Dashboard Endpoint Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALERTS ONLY (for Notification Bell)
exports.getAlertsOnly = async (req, res) => {
  try {
    const userId = req.user;
    const month = req.query.month ? parseInt(req.query.month) : new Date().getUTCMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [user, expenses, budgets] = await Promise.all([
      User.findById(userId).lean(),
      Expense.find({ user: userId, date: { $gte: start, $lt: end } }).lean(),
      Budget.find({ user: userId, month: month - 1, year }).lean()
    ]);

    const alerts = generateSmartAlerts({ 
      expenses, 
      budgets, 
      transactions: expenses, 
      user 
    });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADD RECURRING EXPENSE
exports.addRecurringExpense = async (req, res) => {
  try {
    const { amount, category, note, frequency, startDate } = req.body;

    if (!isValidAmount(amount)) {
      return res.status(400).json({ message: "Amount must be a positive number (up to 1,000,000,000)" });
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }

    const trimmedCategory = category.trim();
    if (!VALID_CATEGORIES.includes(trimmedCategory)) {
      return res.status(400).json({ message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}` });
    }

    const allowedFrequencies = ["Daily", "Weekly", "Monthly", "Yearly", "daily", "weekly", "monthly", "yearly"];
    if (!frequency || !allowedFrequencies.includes(frequency)) {
      return res.status(400).json({ message: "Frequency must be Daily, Weekly, Monthly, or Yearly" });
    }

    // Normalize to PascalCase
    const normalizedFrequency = frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();

    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({ message: "Invalid startDate format" });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const nextExecutionDate = start < new Date() ? new Date() : start;

    const recurring = new RecurringExpense({
      user: req.user,
      amount: Number(amount),
      category: sanitize(trimmedCategory, 50),
      note: note ? sanitize(note, 200) : "",
      frequency: normalizedFrequency,
      startDate: start,
      nextExecutionDate
    });

    await recurring.save();
    res.status(201).json({ message: "Recurring expense set up successfully", recurring });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE EXPENSE (with ownership check)
exports.deleteExpense = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    const expense = await Expense.findOne({ _id: req.params.id, user: req.user });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or not authorized" });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ message: "Expense deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE EXPENSE (with ownership check)
exports.updateExpense = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    const expense = await Expense.findOne({ _id: req.params.id, user: req.user });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or not authorized" });
    }

    const { amount, category, note, date } = req.body;

    if (amount !== undefined && !isValidAmount(amount)) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    let trimmedCategory = expense.category;
    if (category !== undefined) {
      if (!category || typeof category !== "string" || !VALID_CATEGORIES.includes(category.trim())) {
        return res.status(400).json({ message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}` });
      }
      trimmedCategory = sanitize(category.trim(), 50);
    }

    if (date !== undefined && !isValidDate(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        amount: amount !== undefined ? Number(amount) : expense.amount,
        category: trimmedCategory,
        note: note !== undefined ? sanitize(note, 200) : expense.note,
        date: date ? new Date(date) : expense.date
      },
      { new: true }
    );

    res.json({ message: "Expense updated", updated });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export valid categories for frontend reference
exports.getCategories = (req, res) => {
  res.json({ categories: VALID_CATEGORIES });
};