const mongoose = require("mongoose");

const recurringExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
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
  frequency: {
    type: String,
    enum: ["Daily", "Weekly", "Monthly", "Yearly"],
    default: "Monthly"
  },
  nextDate: {
    type: Date,
    required: true
  },
  lastProcessed: {
    type: Date
  }
}, { timestamps: true });

// Targeted Index:
// Compound index for finding recurring expenses due for execution per user
recurringExpenseSchema.index({ user: 1, nextDate: 1 });

module.exports = mongoose.model("RecurringExpense", recurringExpenseSchema);
