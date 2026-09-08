const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  clerkId: {
    type: String,
    unique: true,
    sparse: true
  },
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family"
  },
  isPro: {
    type: Boolean,
    default: false
  },
  plan: {
    type: String,
    enum: ["MONTHLY", "YEARLY"]
  },
  proSince: {
    type: Date
  },
  proStartsAt: {
    type: Date
  },
  proExpiresAt: {
    type: Date
  },
  paymentId: {
    type: String
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

