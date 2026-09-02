const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family"
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  note: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Targeted Indexes:
// 1. Compound index for user-scoped date filtering and sorting (dashboard, summary, expense list)
expenseSchema.index({ user: 1, date: -1 });

// 2. Index for family expense aggregation queries
expenseSchema.index({ family: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
