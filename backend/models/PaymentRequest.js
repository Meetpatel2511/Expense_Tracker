const mongoose = require("mongoose");

/**
 * Normalizes a UTR string by trimming, removing all internal whitespace, and uppercase.
 * @param {string} val
 * @returns {string|undefined}
 */
const normalizeUtr = (val) => {
  if (typeof val !== "string") return val;
  const cleaned = val.replace(/\s+/g, "").toUpperCase();
  return cleaned.length > 0 ? cleaned : undefined;
};

const paymentRequestSchema = new mongoose.Schema({
  // 1. User binding
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "userId is required"],
    immutable: true,
    index: true
  },

  // 2. Selected plan
  plan: {
    type: String,
    enum: {
      values: ["MONTHLY", "YEARLY"],
      message: "Plan must be either MONTHLY or YEARLY"
    },
    required: [true, "Plan is required"],
    immutable: true
  },

  // 3. Historical server-authoritative amount in lowest currency denomination (paise)
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    immutable: true,
    validate: {
      validator: function (v) {
        return typeof v === "number" && Number.isInteger(v) && v > 0;
      },
      message: "Amount must be a positive integer in paise"
    }
  },

  // 4. Currency
  currency: {
    type: String,
    default: "INR",
    enum: {
      values: ["INR"],
      message: "Currency must be INR"
    },
    required: [true, "Currency is required"],
    immutable: true
  },

  // 5. Payment method
  paymentMethod: {
    type: String,
    enum: {
      values: ["UPI_MANUAL", "UPI_QR", "BANK_TRANSFER"],
      message: "Invalid paymentMethod"
    },
    required: [true, "paymentMethod is required"],
    immutable: true
  },

  // 6. UTR (Unique Transaction Reference)
  utr: {
    type: String,
    set: normalizeUtr,
    validate: {
      validator: function (v) {
        if (!v) return true; // Optional initially
        return typeof v === "string" && v.length >= 6 && v.length <= 30;
      },
      message: "UTR must be between 6 and 30 characters"
    }
  },

  // 7. Payer UPI identifier
  payerUpiId: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [100, "payerUpiId must not exceed 100 characters"]
  },

  // 8. Timestamp when payment was made
  paidAt: {
    type: Date
  },

  // 9. Private screenshot storage reference/key (No image bytes/base64 stored)
  screenshotRef: {
    type: String,
    trim: true,
    maxlength: [500, "screenshotRef must not exceed 500 characters"]
  },

  // 10. User note/message
  userNote: {
    type: String,
    trim: true,
    maxlength: [500, "userNote must not exceed 500 characters"]
  },

  // 11. Workflow status
  status: {
    type: String,
    required: [true, "Status is required"],
    enum: {
      values: ["UNDER_REVIEW", "NEEDS_MORE_INFO", "APPROVED", "REJECTED"],
      message: "Status must be UNDER_REVIEW, NEEDS_MORE_INFO, APPROVED, or REJECTED"
    },
    default: "UNDER_REVIEW",
    index: true
  },

  // 12. Submission timestamp
  submittedAt: {
    type: Date
  },

  // 13. Review timestamp
  reviewedAt: {
    type: Date
  },

  // 14. Admin reviewer reference
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // 15. Admin internal notes
  adminNote: {
    type: String,
    trim: true,
    maxlength: [1000, "adminNote must not exceed 1000 characters"]
  },

  // 16. Rejection reason presented to user
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, "rejectionReason must not exceed 500 characters"]
  },

  // 17. Historical subscription start granted by this payment
  proStartsAt: {
    type: Date
  },

  // 18. Historical subscription expiration granted by this payment
  proExpiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for user payment history
paymentRequestSchema.index({ userId: 1, createdAt: -1 });

// Compound index for administrative review queue
paymentRequestSchema.index({ status: 1, createdAt: 1 });

// Partial unique index enforcing maximum ONE active payment request (UNDER_REVIEW or NEEDS_MORE_INFO) per user
paymentRequestSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["UNDER_REVIEW", "NEEDS_MORE_INFO"] }
    }
  }
);

// Globally unique UTR index (allows missing/sparse UTRs, enforces strict uniqueness when present)
paymentRequestSchema.index(
  { utr: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { utr: { $type: "string" } }
  }
);

paymentRequestSchema.statics.normalizeUtr = normalizeUtr;

module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);

