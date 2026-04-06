const Expense = require("../models/Expense");
const Income = require("../models/Income");
const User = require("../models/User");
const Budget = require("../models/Budget");
const RecurringExpense = require("../models/RecurringExpense");
const { sanitize } = require("../utils/sanitize");

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

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }

    const user = await User.findById(req.user);

    const expense = new Expense({
      user: req.user,
      family: user.family,
      amount: Number(amount),
      category: sanitize(category, 50),
      note: sanitize(note, 200),
      date: date || Date.now()
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
      maxAmount, 
      page = 1, 
      limit = 10 
    } = req.query;

    let query = { user: req.user };

    // 🔍 Search (Note)
    if (search) {
      query.note = { $regex: search, $options: "i" };
    }

    // 📂 Category Filter
    if (category) {
      query.category = category;
    }

    // 📅 Date Range Filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    } else {
      // Default to current month if no dates provided (for UI convenience)
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // 💰 Amount Filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // 📊 Pagination Logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(query)
    ]);

    res.json({
      data: expenses,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
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

// GET SMART SUGGESTIONS
exports.getSmartSuggestions = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user });
    const incomes = await Income.find({ user: req.user });

    const month = req.query.month ? parseInt(req.query.month) - 1 : new Date().getUTCMonth();
    const year = req.query.year ? parseInt(req.query.year) : new Date().getUTCFullYear();
    const now = new Date(Date.UTC(year, month, 1)); // Reference date for current month logic

    const budget = await Budget.findOne({ user: req.user, month, year });

    let totalExpense = 0;
    let totalIncome = 0;
    let categoryMap = {};

    // Current Month Totals
    const currentMonthExpenses = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    currentMonthExpenses.forEach(exp => {
      totalExpense += exp.amount;
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });

    const currentMonthIncomes = incomes.filter(inc => {
      const d = new Date(inc.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    currentMonthIncomes.forEach(inc => {
      totalIncome += inc.amount;
    });

    const alerts = [];

    // 1. Budget Alerts (Deterministic - Global & Categories)
    const budgets = await Budget.find({ user: req.user, month, year });

    if (budgets.length > 0) {
      for (const b of budgets) {
        const isGlobal = b.category === "Global";
        const spent = isGlobal ? totalExpense : (categoryMap[b.category] || 0);
        const percentUsed = (spent / b.amount) * 100;
        const catName = isGlobal ? "Global budget" : `${b.category} budget`;

        if (spent > b.amount) {
          alerts.push({ 
            type: "danger", 
            text: `🚨 ${catName} exceeded by ₹${(spent - b.amount).toLocaleString()}`, 
            icon: "FiAlertOctagon" 
          });
        } else if (percentUsed > 80) {
          alerts.push({ 
            type: "warning", 
            text: `⚠️ ${catName} is ${percentUsed.toFixed(0)}% full. Careful!`, 
            icon: "FiAlertTriangle" 
          });
        }
      }
    }

    // 2. Weekly Velocity (Deterministic)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const lastSevenDaysTotal = expenses.filter(exp => new Date(exp.date) >= sevenDaysAgo)
                                      .reduce((sum, exp) => sum + exp.amount, 0);
    const priorSevenDaysTotal = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).reduce((sum, exp) => sum + exp.amount, 0);

    if (lastSevenDaysTotal > priorSevenDaysTotal && priorSevenDaysTotal > 0) {
      const increase = ((lastSevenDaysTotal - priorSevenDaysTotal) / priorSevenDaysTotal) * 100;
      alerts.push({ type: "warning", text: `📈 Spending increased by ${increase.toFixed(0)}% this week`, icon: "FiTrendingUp" });
    }

    // 3. Category Spikes (Deterministic)
    for (let category in categoryMap) {
      const percent = totalExpense > 0 ? (categoryMap[category] / totalExpense) * 100 : 0;
      if (percent > 40) {
        alerts.push({ type: "info", text: `💡 You're spending too much on ${category} (${percent.toFixed(0)}% of total)`, icon: "FiInfo" });
      }
    }

    // 4. Financial Health Alerts (Deterministic)
    const ruleAlerts = [];

    // Rule C: Savings & Income Insights
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
      if (savingsRate < 10 && totalExpense > 0) {
        ruleAlerts.push({ type: "danger", text: "⚠️ Low savings alert! Expenses are currently 90%+ of income.", icon: "FiZap" });
      } else if (savingsRate > 30) {
        ruleAlerts.push({ type: "success", text: "🌟 Impressive! You've saved over 30% of your income so far.", icon: "FiCheckCircle" });
      }
    }

    // Rule D: Action Required
    if (totalIncome === 0 && totalExpense > 0) {
      ruleAlerts.push({ type: "info", text: "📝 Consider logging your income to see your actual savings rate.", icon: "FiDollarSign" });
    }

    // Merge with deterministic alerts
    const finalAlerts = [...alerts, ...ruleAlerts];

    res.json({ 
      totalSpending: totalExpense, 
      totalIncome, 
      alerts: finalAlerts.slice(0, 5) 
    });

  } catch (error) {
    console.error("Smart Suggestions Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ADD RECURRING EXPENSE
exports.addRecurringExpense = async (req, res) => {
  try {
    const { amount, category, note, frequency, startDate } = req.body;

    if (!amount || !category || !frequency) {
      return res.status(400).json({ message: "Amount, category, and frequency are required" });
    }

    const start = startDate ? new Date(startDate) : new Date();
    
    // Set nextExecutionDate to start date (or now if start date is in the past)
    const nextExecutionDate = start < new Date() ? new Date() : start;

    const recurring = new RecurringExpense({
      user: req.user,
      amount: Number(amount),
      category: category.trim(),
      note: note ? note.trim() : "",
      frequency,
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
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or not authorized" });
    }

    const { amount, category, note, date } = req.body;

    if (amount && Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        amount: amount ? Number(amount) : expense.amount,
        category: category ? category.trim() : expense.category,
        note: note !== undefined ? note.trim() : expense.note,
        date: date || expense.date
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