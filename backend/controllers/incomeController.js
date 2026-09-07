const Income = require("../models/Income");
const { sanitize } = require("../utils/sanitize");
const {
  isValidObjectId,
  isValidAmount,
  isValidDate,
  isValidAmountRange,
  isValidDateRange,
  parsePagination
} = require("../middleware/validation");

// ADD INCOME
exports.addIncome = async (req, res) => {
  try {
    const { amount, source, date } = req.body || {};

    if (!isValidAmount(amount)) {
      return res.status(400).json({ message: "Amount must be a positive number (up to 1,000,000,000)" });
    }

    if (!source || typeof source !== "string" || !source.trim()) {
      return res.status(400).json({ message: "Source is required" });
    }

    if (date && !isValidDate(date)) {
      return res.status(400).json({ message: "Invalid date format provided" });
    }

    const income = new Income({
      user: req.user,
      amount: Number(amount),
      source: sanitize(source.trim(), 50),
      date: date ? new Date(date) : new Date()
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
      maxAmount
    } = req.query;

    const { page, limit, skip } = parsePagination(req.query, 10, 100);

    let query = { user: req.user };

    // 🔍 Search (Source) with regex escaping
    if (search && typeof search === "string") {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.source = { $regex: sanitizedSearch, $options: "i" };
    }

    // 📅 Date Range Filter
    if (startDate || endDate) {
      if (startDate && !isValidDate(startDate)) return res.status(400).json({ message: "Invalid startDate format" });
      if (endDate && !isValidDate(endDate)) return res.status(400).json({ message: "Invalid endDate format" });
      if (startDate && endDate && !isValidDateRange(startDate, endDate)) {
        return res.status(400).json({ message: "startDate cannot be after endDate" });
      }

      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
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
      if (minAmount !== undefined && minAmount !== "") {
        if (isNaN(Number(minAmount)) || Number(minAmount) < 0) {
          return res.status(400).json({ message: "Invalid minAmount" });
        }
      }
      if (maxAmount !== undefined && maxAmount !== "") {
        if (isNaN(Number(maxAmount)) || Number(maxAmount) < 0) {
          return res.status(400).json({ message: "Invalid maxAmount" });
        }
      }
      if (minAmount !== undefined && minAmount !== "" && maxAmount !== undefined && maxAmount !== "") {
        if (!isValidAmountRange(minAmount, maxAmount)) {
          return res.status(400).json({ message: "minAmount cannot be greater than maxAmount" });
        }
      }

      query.amount = {};
      if (minAmount !== undefined && minAmount !== "") {
        query.amount.$gte = Number(minAmount);
      }
      if (maxAmount !== undefined && maxAmount !== "") {
        query.amount.$lte = Number(maxAmount);
      }
    }

    const [incomes, total] = await Promise.all([
      Income.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Income.countDocuments(query)
    ]);

    res.json({
      data: incomes,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE INCOME (with ownership check)
exports.deleteIncome = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid income ID format" });
    }

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
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid income ID format" });
    }

    const income = await Income.findOne({ _id: req.params.id, user: req.user });

    if (!income) {
      return res.status(404).json({ message: "Income not found or not authorized" });
    }

    const { amount, source, date } = req.body || {};

    if (amount === undefined && source === undefined && date === undefined) {
      return res.status(400).json({ message: "No valid update fields provided" });
    }

    if (amount !== undefined && !isValidAmount(amount)) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    if (source !== undefined && (typeof source !== "string" || !source.trim())) {
      return res.status(400).json({ message: "Source cannot be empty" });
    }

    if (date !== undefined && !isValidDate(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const updated = await Income.findByIdAndUpdate(
      req.params.id,
      {
        amount: amount !== undefined ? Number(amount) : income.amount,
        source: source !== undefined ? sanitize(source.trim(), 50) : income.source,
        date: date ? new Date(date) : income.date
      },
      { new: true }
    );

    res.json({ message: "Income updated", updated });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
