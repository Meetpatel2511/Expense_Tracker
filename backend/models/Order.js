const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ["MONTHLY", "YEARLY"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created"
  },
  paymentId: {
    type: String,
    sparse: true
  },
  paidAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
