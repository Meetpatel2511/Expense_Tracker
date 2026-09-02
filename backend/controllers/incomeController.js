const Income = require("../models/Income");
const { sanitize } = require("../utils/sanitize");

// ADD INCOME
exports.addIncome = async (req, res) => {
  try {
    const { amount, source, date } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    if (!source || !source.trim()) {
      return res.status(400).json({ message: "Source is required" });
    }

    const income = new Income({
      user: req.user,
      amount: Number(amount),
      source: sanitize(source, 50),
      date: date || Date.now()
    });

    await income.save();

    res.json({ message: "Income added", income });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL INCOMES (Supported: Search, Filtering, Pagination)
exports.getIncomes = async (req, res) => {
  try {
    const { 
      search, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount, 
      page = 1, 
      limit = 10 
    } = req.query;

    let query = { user: req.user };

    // 🔍 Search (Source)
    if (search) {
      query.source = { $regex: search, $options: "i" };
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
    
    const [incomes, total] = await Promise.all([
      Income.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Income.countDocuments(query)
    ]);

    res.json({
      data: incomes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE INCOME (with ownership check)
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.user });

    if (!income) {
      return res.status(404).json({ message: "Income not found or not authorized" });
    }

    await Income.findByIdAndDelete(req.params.id);

    res.json({ message: "Income deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE INCOME (with ownership check)
exports.updateIncome = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.user });

    if (!income) {
      return res.status(404).json({ message: "Income not found or not authorized" });
    }

    const { amount, source, date } = req.body;

    if (amount && Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const updated = await Income.findByIdAndUpdate(
      req.params.id,
      {
        amount: amount ? Number(amount) : income.amount,
        source: source ? source.trim() : income.source,
        date: date || income.date
      },
      { new: true }
    );

    res.json({ message: "Income updated", updated });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
