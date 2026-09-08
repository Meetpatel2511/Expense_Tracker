const mongoose = require("mongoose");

const VALID_STATUSES = ["UNDER_REVIEW", "NEEDS_MORE_INFO", "APPROVED", "REJECTED"];

const VALID_ACTIONS = [
  "REQUEST_CREATED",
  "EVIDENCE_SUBMITTED",
  "EVIDENCE_RESUBMITTED",
  "STATUS_CHANGED_UNDER_REVIEW",
  "STATUS_CHANGED_NEEDS_MORE_INFO",
  "STATUS_CHANGED_REJECTED",
  "STATUS_CHANGED_APPROVED",
  "PRO_ENTITLEMENT_ACTIVATED",
  "REQUEST_EXPIRED"
];

const VALID_ROLES = ["USER", "ADMIN", "SYSTEM"];

const paymentAuditSchema = new mongoose.Schema({
  // 1. Linked Payment Request
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

  // 3. Lifecycle action
  action: {
    type: String,
    required: [true, "action is required"],
    enum: {
      values: VALID_ACTIONS,
      message: "Invalid audit action"
    },
    immutable: true
  },

  // 4. Previous status before action
  previousStatus: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: "Invalid previousStatus"
    },
    immutable: true
  },

  // 5. New status resulting from action
  newStatus: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: "Invalid newStatus"
    },
    immutable: true
  },

  // 6. User or Admin who initiated the action (optional for system events)
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    immutable: true
  },

  // 7. Role of the actor
  performedByRole: {
    type: String,
    required: [true, "performedByRole is required"],
    enum: {
      values: VALID_ROLES,
      message: "performedByRole must be USER, ADMIN, or SYSTEM"
    },
    immutable: true
  },

  // 8. IP address of request (if available)
  ipAddress: {
    type: String,
    immutable: true
  },

  // 9. User-Agent of request (if available)
  userAgent: {
    type: String,
    immutable: true
  },

  // 10. Audit note / reason
  note: {
    type: String,
    trim: true,
    maxlength: [1000, "note must not exceed 1000 characters"],
    immutable: true
  },

  // 11. Structured metadata (no secrets, credentials, or image bytes)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    immutable: true
  }
}, {
  // Audit records are strictly append-only: createdAt only, no updatedAt
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for audit traceability
paymentAuditSchema.index({ paymentRequestId: 1, createdAt: -1 });
paymentAuditSchema.index({ userId: 1, createdAt: -1 });
paymentAuditSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentAudit", paymentAuditSchema);
