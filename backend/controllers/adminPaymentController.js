const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const PaymentRequest = require("../models/PaymentRequest");
const PaymentAudit = require("../models/PaymentAudit");
const User = require("../models/User");
const { calculateProExpiration } = require("../middleware/proMiddleware");
const { receiptsDir } = require("../middleware/uploadMiddleware");

/**
 * Helper to validate MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * 1. GET /api/admin/payment-requests
 * Administrative payment queue with status filtering, UTR / email search, and pagination.
 */
exports.getQueue = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      utr,
      email
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};

    // 1. Status Filter
    if (status && typeof status === "string" && status.trim()) {
      const statuses = status.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      const validStatuses = ["UNDER_REVIEW", "NEEDS_MORE_INFO", "APPROVED", "REJECTED"];
      const allowed = statuses.filter(s => validStatuses.includes(s));
      if (allowed.length === 1) {
        filter.status = allowed[0];
      } else if (allowed.length > 1) {
        filter.status = { $in: allowed };
      }
    }

    // 2. UTR Search
    if (utr && typeof utr === "string" && utr.trim()) {
      const cleanedUtr = utr.trim().toUpperCase();
      filter.utr = { $regex: cleanedUtr, $options: "i" };
    }

    // 3. User Email Search
    if (email && typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const matchedUsers = await User.find({
        email: { $regex: normalizedEmail, $options: "i" }
      }).select("_id");
      
      const userIds = matchedUsers.map(u => u._id);
      filter.userId = { $in: userIds };
    }

    const [total, requests] = await Promise.all([
      PaymentRequest.countDocuments(filter),
      PaymentRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("userId", "name email clerkId isPro proExpiresAt")
        .populate("reviewedBy", "name email role")
        .lean()
    ]);

    const totalPages = Math.ceil(total / parsedLimit) || 1;

    res.json({
      success: true,
      count: requests.length,
      total,
      page: parsedPage,
      totalPages,
      requests
    });
  } catch (error) {
    console.error("Admin Payment Queue Error:", error);
    res.status(500).json({
      message: "Failed to retrieve payment review queue.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 2. GET /api/admin/payment-requests/:id
 * Retrieve detailed payment request information, associated user profile, and audit timeline.
 */
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id)
      .populate("userId", "name email clerkId isPro proSince proStartsAt proExpiresAt role plan")
      .populate("reviewedBy", "name email role");

    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    const auditTrail = await PaymentAudit.find({ paymentRequestId: id })
      .sort({ createdAt: -1 })
      .populate("performedBy", "name email role");

    res.json({
      success: true,
      paymentRequest,
      auditTrail
    });
  } catch (error) {
    console.error("Admin Payment Detail Error:", error);
    res.status(500).json({
      message: "Failed to retrieve payment details.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 3. GET /api/admin/payment-requests/:id/receipt
 * Stream private receipt image strictly to authenticated admins with directory traversal protection.
 */
exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id).select("screenshotRef");
    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    if (!paymentRequest.screenshotRef) {
      return res.status(404).json({
        message: "No receipt proof file attached to this payment request.",
        code: "RECEIPT_NOT_FOUND"
      });
    }

    const baseDir = path.resolve(receiptsDir);
    const filename = path.basename(paymentRequest.screenshotRef);
    const resolvedPath = path.resolve(baseDir, filename);

    // Path traversal defense: ensure resolved path is strictly within base receipts directory
    if (!resolvedPath.startsWith(baseDir) || !fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        message: "Payment receipt image not found on server storage.",
        code: "RECEIPT_NOT_FOUND"
      });
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".png") {
      contentType = "image/png";
    } else if (ext === ".webp") {
      contentType = "image/webp";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

    const stream = fs.createReadStream(resolvedPath);
    stream.on("error", (streamErr) => {
      console.error("Receipt stream error:", streamErr);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream receipt file.", code: "STREAM_ERROR" });
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Admin Get Receipt Error:", error);
    res.status(500).json({
      message: "Failed to retrieve receipt proof.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 4. POST /api/admin/payment-requests/:id/approve
 * Approves a payment request, activates Pro subscription, records append-only audits,
 * and maintains idempotency and atomic recovery on replica set and standalone MongoDB.
 */
exports.approve = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user;
  const adminNote = req.body?.adminNote ? req.body.adminNote.trim() : null;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      message: "Invalid payment request ID.",
      code: "INVALID_REQUEST_ID"
    });
  }

  // Check state machine constraints
  const paymentRequest = await PaymentRequest.findById(id);
  if (!paymentRequest) {
    return res.status(404).json({
      message: "Payment request not found.",
      code: "REQUEST_NOT_FOUND"
    });
  }

  if (paymentRequest.status === "REJECTED") {
    return res.status(400).json({
      message: "Cannot approve a rejected payment request.",
      code: "INVALID_STATE_TRANSITION"
    });
  }

  if (!["UNDER_REVIEW", "NEEDS_MORE_INFO", "APPROVED"].includes(paymentRequest.status)) {
    return res.status(400).json({
      message: `Cannot approve payment request with status ${paymentRequest.status}.`,
      code: "INVALID_STATE_TRANSITION"
    });
  }

  const user = await User.findById(paymentRequest.userId);
  if (!user) {
    return res.status(404).json({
      message: "User account associated with payment request not found.",
      code: "USER_NOT_FOUND"
    });
  }

  const deterministicPaymentId = `MANUAL_UPI_${paymentRequest.utr}`;
  const now = new Date();

  // =========================================================================
  // RECONCILIATION / RETRY PATH (PaymentRequest is ALREADY in APPROVED status)
  // =========================================================================
  if (paymentRequest.status === "APPROVED") {
    const isAlreadyApplied = user.isPro === true &&
      user.paymentId === deterministicPaymentId &&
      user.proExpiresAt &&
      paymentRequest.proExpiresAt &&
      new Date(user.proExpiresAt).getTime() >= new Date(paymentRequest.proExpiresAt).getTime();

    if (!isAlreadyApplied) {
      // Reconcile user entitlement strictly using exact persisted values on PaymentRequest
      // DO NOT call calculateProExpiration again or add extra days
      user.isPro = true;
      user.plan = paymentRequest.plan;
      user.proStartsAt = paymentRequest.proStartsAt || user.proStartsAt || now;
      user.proExpiresAt = paymentRequest.proExpiresAt;
      user.proSince = user.proSince || paymentRequest.proStartsAt || now;
      user.paymentId = deterministicPaymentId;
      await user.save();
    }

    // Ensure terminal audit records exist idempotently
    try {
      await PaymentAudit.create({
        paymentRequestId: paymentRequest._id,
        userId: paymentRequest.userId,
        action: "STATUS_CHANGED_APPROVED",
        previousStatus: "UNDER_REVIEW",
        newStatus: "APPROVED",
        performedBy: adminId,
        performedByRole: "ADMIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        note: adminNote || paymentRequest.adminNote || "Payment request approved by administrator.",
        metadata: {
          plan: paymentRequest.plan,
          amount: paymentRequest.amount,
          utr: paymentRequest.utr,
          proStartsAt: paymentRequest.proStartsAt,
          proExpiresAt: paymentRequest.proExpiresAt,
          paymentId: deterministicPaymentId,
          reconciled: true
        }
      });
    } catch (auditErr) {
      if (auditErr.code !== 11000) throw auditErr;
    }

    try {
      await PaymentAudit.create({
        paymentRequestId: paymentRequest._id,
        userId: paymentRequest.userId,
        action: "PRO_ENTITLEMENT_ACTIVATED",
        previousStatus: "UNDER_REVIEW",
        newStatus: "APPROVED",
        performedBy: adminId,
        performedByRole: "ADMIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        note: `Pro ${paymentRequest.plan} entitlement activated until ${paymentRequest.proExpiresAt ? new Date(paymentRequest.proExpiresAt).toISOString() : ""}`,
        metadata: {
          plan: paymentRequest.plan,
          proStartsAt: paymentRequest.proStartsAt,
          proExpiresAt: paymentRequest.proExpiresAt,
          paymentId: deterministicPaymentId,
          reconciled: true
        }
      });
    } catch (auditErr) {
      if (auditErr.code !== 11000) throw auditErr;
    }

    return res.json({
      message: isAlreadyApplied
        ? "Payment request is already approved and entitlement is active."
        : "Payment request entitlement reconciled successfully.",
      alreadyApproved: true,
      reconciled: !isAlreadyApplied,
      paymentRequest,
      user: {
        _id: user._id,
        isPro: user.isPro,
        plan: user.plan,
        proStartsAt: user.proStartsAt,
        proExpiresAt: user.proExpiresAt,
        proSince: user.proSince
      }
    });
  }

  // =========================================================================
  // INITIAL APPROVAL PATH (UNDER_REVIEW / NEEDS_MORE_INFO)
  // =========================================================================
  const plan = paymentRequest.plan;
  let proStartsAt;
  let newProExpiresAt;

  if (user.proExpiresAt && new Date(user.proExpiresAt) > now) {
    // Active renewal: extend from existing future expiry
    proStartsAt = new Date(user.proExpiresAt);
    newProExpiresAt = calculateProExpiration(plan, user.proExpiresAt, proStartsAt);
  } else {
    // New activation or expired subscription: start from now
    proStartsAt = now;
    newProExpiresAt = calculateProExpiration(plan, null, now);
  }

  const previousStatus = paymentRequest.status;

  // Try MongoDB transaction if replica set session is supported and connection is active
  let session = null;
  if (mongoose.connection.readyState === 1) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionErr) {
      // Standalone MongoDB without replica set: session remains null
      session = null;
    }
  }

  try {
    const sessionOpt = session ? { session } : {};

    // 1. Persist PaymentRequest Approval
    paymentRequest.status = "APPROVED";
    paymentRequest.reviewedBy = adminId;
    paymentRequest.reviewedAt = now;
    paymentRequest.proStartsAt = proStartsAt;
    paymentRequest.proExpiresAt = newProExpiresAt;
    paymentRequest.rejectionReason = undefined;
    if (adminNote) {
      paymentRequest.adminNote = adminNote;
    }
    await paymentRequest.save(sessionOpt);

    // 2. Persist User Pro Entitlement
    user.isPro = true;
    user.plan = plan;
    user.proStartsAt = proStartsAt;
    user.proExpiresAt = newProExpiresAt;
    user.proSince = user.proSince || now;
    user.paymentId = deterministicPaymentId;
    await user.save(sessionOpt);

    // 3. Create Audit Records (safely ignoring duplicate key errors from partial unique index)
    try {
      await PaymentAudit.create({
        paymentRequestId: paymentRequest._id,
        userId: paymentRequest.userId,
        action: "STATUS_CHANGED_APPROVED",
        previousStatus,
        newStatus: "APPROVED",
        performedBy: adminId,
        performedByRole: "ADMIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        note: adminNote || "Payment request approved by administrator.",
        metadata: {
          plan,
          amount: paymentRequest.amount,
          utr: paymentRequest.utr,
          proStartsAt,
          proExpiresAt: newProExpiresAt,
          paymentId: deterministicPaymentId
        }
      }, sessionOpt);
    } catch (auditErr) {
      if (auditErr.code !== 11000) throw auditErr;
    }

    try {
      await PaymentAudit.create({
        paymentRequestId: paymentRequest._id,
        userId: paymentRequest.userId,
        action: "PRO_ENTITLEMENT_ACTIVATED",
        previousStatus,
        newStatus: "APPROVED",
        performedBy: adminId,
        performedByRole: "ADMIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        note: `Pro ${plan} entitlement activated until ${newProExpiresAt.toISOString()}`,
        metadata: {
          plan,
          proStartsAt,
          proExpiresAt: newProExpiresAt,
          paymentId: deterministicPaymentId
        }
      }, sessionOpt);
    } catch (auditErr) {
      if (auditErr.code !== 11000) throw auditErr;
    }

    if (session) {
      await session.commitTransaction();
    }

    res.json({
      message: "Payment request approved and Pro entitlement activated successfully.",
      paymentRequest,
      user: {
        _id: user._id,
        isPro: user.isPro,
        plan: user.plan,
        proStartsAt: user.proStartsAt,
        proExpiresAt: user.proExpiresAt,
        proSince: user.proSince
      }
    });
  } catch (txErr) {
    if (session) {
      await session.abortTransaction();
    }
    console.error("Admin Approval Transaction Error:", txErr);
    res.status(500).json({
      message: "Failed to approve payment request.",
      code: "APPROVAL_ERROR"
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * 5. POST /api/admin/payment-requests/:id/reject
 * Rejects a payment request with a mandatory rejectionReason.
 * Does NOT modify user Pro entitlement.
 */
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user;
    const { rejectionReason, adminNote } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    if (!rejectionReason || typeof rejectionReason !== "string" || !rejectionReason.trim()) {
      return res.status(400).json({
        message: "Rejection reason is required.",
        code: "REJECTION_REASON_REQUIRED"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    if (paymentRequest.status === "APPROVED") {
      return res.status(400).json({
        message: "Cannot reject an already approved payment request.",
        code: "INVALID_STATE_TRANSITION"
      });
    }

    if (paymentRequest.status === "REJECTED") {
      return res.status(400).json({
        message: "Payment request is already rejected.",
        code: "ALREADY_REJECTED"
      });
    }

    if (!["UNDER_REVIEW", "NEEDS_MORE_INFO"].includes(paymentRequest.status)) {
      return res.status(400).json({
        message: `Cannot reject payment request with status ${paymentRequest.status}.`,
        code: "INVALID_STATE_TRANSITION"
      });
    }

    const previousStatus = paymentRequest.status;
    paymentRequest.status = "REJECTED";
    paymentRequest.rejectionReason = rejectionReason.trim();
    paymentRequest.reviewedBy = adminId;
    paymentRequest.reviewedAt = new Date();
    if (adminNote && typeof adminNote === "string") {
      paymentRequest.adminNote = adminNote.trim();
    }
    await paymentRequest.save();

    await PaymentAudit.create({
      paymentRequestId: paymentRequest._id,
      userId: paymentRequest.userId,
      action: "STATUS_CHANGED_REJECTED",
      previousStatus,
      newStatus: "REJECTED",
      performedBy: adminId,
      performedByRole: "ADMIN",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      note: rejectionReason.trim(),
      metadata: {
        rejectionReason: rejectionReason.trim(),
        adminNote: adminNote ? adminNote.trim() : null
      }
    });

    res.json({
      message: "Payment request rejected.",
      paymentRequest
    });
  } catch (error) {
    console.error("Admin Reject Error:", error);
    res.status(500).json({
      message: "Failed to reject payment request.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 6. POST /api/admin/payment-requests/:id/request-info
 * Moves payment request to NEEDS_MORE_INFO status with a mandatory adminNote.
 */
exports.requestInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user;
    const { adminNote } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    if (!adminNote || typeof adminNote !== "string" || !adminNote.trim()) {
      return res.status(400).json({
        message: "Admin note explaining the required information is required.",
        code: "ADMIN_NOTE_REQUIRED"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    if (paymentRequest.status === "APPROVED") {
      return res.status(400).json({
        message: "Cannot request information on an already approved payment request.",
        code: "INVALID_STATE_TRANSITION"
      });
    }

    if (paymentRequest.status === "REJECTED") {
      return res.status(400).json({
        message: "Cannot request information on a rejected payment request.",
        code: "INVALID_STATE_TRANSITION"
      });
    }

    const previousStatus = paymentRequest.status;
    paymentRequest.status = "NEEDS_MORE_INFO";
    paymentRequest.adminNote = adminNote.trim();
    paymentRequest.reviewedBy = adminId;
    paymentRequest.reviewedAt = new Date();
    await paymentRequest.save();

    await PaymentAudit.create({
      paymentRequestId: paymentRequest._id,
      userId: paymentRequest.userId,
      action: "STATUS_CHANGED_NEEDS_MORE_INFO",
      previousStatus,
      newStatus: "NEEDS_MORE_INFO",
      performedBy: adminId,
      performedByRole: "ADMIN",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      note: adminNote.trim(),
      metadata: {
        adminNote: adminNote.trim()
      }
    });

    res.json({
      message: "Payment request updated to require more information.",
      paymentRequest
    });
  } catch (error) {
    console.error("Admin Request Info Error:", error);
    res.status(500).json({
      message: "Failed to update payment request to require more info.",
      code: "INTERNAL_ERROR"
    });
  }
};
