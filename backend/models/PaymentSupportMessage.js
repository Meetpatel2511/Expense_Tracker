const mongoose = require("mongoose");

const paymentSupportMessageSchema = new mongoose.Schema({
  // 1. Linked PaymentRequest (1:1 conversation root)
  paymentRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentRequest",
    required: [true, "paymentRequestId is required"],
    immutable: true,
    index: true
  },

  // 2. User associated with the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "userId is required"],
    immutable: true,
    index: true
  },

  // 3. Sender User reference
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "senderId is required"],
    immutable: true
  },

  // 4. Role of sender at time of sending
  senderRole: {
    type: String,
    enum: {
      values: ["USER", "ADMIN"],
      message: "senderRole must be USER or ADMIN"
    },
    required: [true, "senderRole is required"],
    immutable: true
  },

  // 5. Message text content (sanitized plain text, max 2000 chars)
  message: {
    type: String,
    trim: true,
    maxlength: [2000, "Message cannot exceed 2000 characters"]
  },

  // 6. Optional private attachment reference (e.g. "support/1726..._abc.jpg")
  attachmentRef: {
    type: String,
    trim: true,
    maxlength: [500, "attachmentRef cannot exceed 500 characters"]
  },

  // 7. Original filename (sanitized for display)
  attachmentOriginalName: {
    type: String,
    trim: true,
    maxlength: [255, "attachmentOriginalName cannot exceed 255 characters"]
  },

  // 8. Attachment MIME type validated via magic bytes
  attachmentMime: {
    type: String,
    enum: ["image/jpeg", "image/png", "image/webp"]
  },

  // 9. Attachment file size in bytes
  attachmentSize: {
    type: Number
  },

  // 10. Read receipts (granular tracking for unread badges)
  readByUserAt: {
    type: Date,
    default: null
  },
  readByAdminAt: {
    type: Date,
    default: null
  }
}, {
  // Append-only messages: createdAt only, no updatedAt
  timestamps: { createdAt: true, updatedAt: false }
});

// Compound index for chronological timeline loading per payment request
paymentSupportMessageSchema.index({ paymentRequestId: 1, createdAt: 1 });

// Unread tracking indexes
paymentSupportMessageSchema.index({ paymentRequestId: 1, senderRole: 1, readByAdminAt: 1 });
paymentSupportMessageSchema.index({ paymentRequestId: 1, senderRole: 1, readByUserAt: 1 });

// User-level index for account cleanup or user query performance
paymentSupportMessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentSupportMessage", paymentSupportMessageSchema);
