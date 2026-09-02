const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  category: {
    type: String,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Targeted Index:
// Compound index for monthly budget lookup and upsert by category
budgetSchema.index({ user: 1, month: 1, year: 1, category: 1 });

module.exports = mongoose.model("Budget", budgetSchema);
