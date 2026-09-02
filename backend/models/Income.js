const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Targeted Index:
// User-scoped date filtering and sorting for income queries
incomeSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Income", incomeSchema);
