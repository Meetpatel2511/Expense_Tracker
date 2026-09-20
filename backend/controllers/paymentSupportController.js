const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const PaymentRequest = require("../models/PaymentRequest");
const PaymentSupportMessage = require("../models/PaymentSupportMessage");
const { supportDir, cleanupSupportFile } = require("../middleware/uploadMiddleware");

/**
 * Validates MongoDB ObjectId format
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// =========================================================================
// USER PAYMENT SUPPORT HANDLERS
// =========================================================================

/**
 * 1. GET /api/payment-request/:id/support
 * Retrieve support thread messages for user's own payment request.
 * Atomically marks admin messages as read by the user.
 */
exports.getUserSupportMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    // Ownership check: user can only view their own payment request support
    if (paymentRequest.userId.toString() !== req.user.toString()) {
      return res.status(403).json({
        message: "You do not have permission to view support for this payment request.",
        code: "UNAUTHORIZED_ACCESS"
      });
    }

    // Atomically mark any unread admin messages as read by this user
    await PaymentSupportMessage.updateMany(
      {
        paymentRequestId: paymentRequest._id,
        senderRole: "ADMIN",
        readByUserAt: null
      },
      { $set: { readByUserAt: new Date() } }
    );

    const messages = await PaymentSupportMessage.find({ paymentRequestId: paymentRequest._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email role")
      .lean();

    res.json({
      success: true,
      paymentRequestId: paymentRequest._id,
      status: paymentRequest.status,
      messages
    });
  } catch (error) {
    console.error("Get User Support Messages Error:", error);
    res.status(500).json({
      message: "Failed to load support messages.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 2. POST /api/payment-request/:id/support
 * Send a message or upload an attachment to the payment request's support thread.
 * INVARIANT: Does NOT modify PaymentRequest.status or User.isPro.
 */
exports.sendUserSupportMessage = async (req, res) => {
  const uploadedAttachmentRef = req.file?.attachmentRef || null;

  try {
    const { id } = req.params;
    const { message } = req.body || {};

    if (!isValidObjectId(id)) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    // Validation: Message text or attachment is required
    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage && !uploadedAttachmentRef) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(400).json({
        message: "Please enter a message or attach a screenshot.",
        code: "MESSAGE_OR_ATTACHMENT_REQUIRED"
      });
    }

    if (trimmedMessage.length > 2000) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(400).json({
        message: "Message cannot exceed 2000 characters.",
        code: "MESSAGE_TOO_LONG"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    // Ownership check
    if (paymentRequest.userId.toString() !== req.user.toString()) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(403).json({
        message: "You do not have permission to send support messages for this payment request.",
        code: "UNAUTHORIZED_ACCESS"
      });
    }

    const now = new Date();
    const supportMessage = new PaymentSupportMessage({
      paymentRequestId: paymentRequest._id,
      userId: paymentRequest.userId,
      senderId: req.user,
      senderRole: "USER",
      message: trimmedMessage || undefined,
      attachmentRef: uploadedAttachmentRef || undefined,
      attachmentOriginalName: req.file?.originalname ? req.file.originalname.substring(0, 255) : undefined,
      attachmentMime: req.file?.detectedMime || undefined,
      attachmentSize: req.file?.size || undefined,
      readByUserAt: now, // User's own message is already seen by the user
      readByAdminAt: null // Unread for admins
    });

    await supportMessage.save();

    await supportMessage.populate("senderId", "name email role");

    res.status(201).json({
      success: true,
      message: supportMessage
    });
  } catch (error) {
    if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
    console.error("Send User Support Message Error:", error);
    res.status(500).json({
      message: "Failed to send support message.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 3. GET /api/payment-request/:id/support/attachment/:messageId
 * Stream private support attachment strictly to the payment owner.
 */
exports.getUserSupportAttachment = async (req, res) => {
  try {
    const { id, messageId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        message: "Invalid ID parameter.",
        code: "INVALID_ID"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    // Ownership check
    if (paymentRequest.userId.toString() !== req.user.toString()) {
      return res.status(403).json({
        message: "You do not have permission to access this attachment.",
        code: "UNAUTHORIZED_ACCESS"
      });
    }

    const supportMessage = await PaymentSupportMessage.findOne({
      _id: messageId,
      paymentRequestId: paymentRequest._id
    });

    if (!supportMessage || !supportMessage.attachmentRef) {
      return res.status(404).json({
        message: "Attachment not found.",
        code: "ATTACHMENT_NOT_FOUND"
      });
    }

    const baseDir = path.resolve(supportDir);
    const filename = path.basename(supportMessage.attachmentRef);
    const resolvedPath = path.resolve(baseDir, filename);

    // Path traversal defense
    if (!resolvedPath.startsWith(baseDir) || !fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        message: "Attachment file not found on server storage.",
        code: "ATTACHMENT_NOT_FOUND"
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
      console.error("Support attachment stream error:", streamErr);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream attachment file.", code: "STREAM_ERROR" });
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Get User Support Attachment Error:", error);
    res.status(500).json({
      message: "Failed to retrieve attachment.",
      code: "INTERNAL_ERROR"
    });
  }
};

// =========================================================================
// ADMIN PAYMENT SUPPORT HANDLERS
// =========================================================================

/**
 * 4. GET /api/admin/payment-requests/:id/support
 * Retrieve support thread messages for admin review.
 * Atomically marks user messages as read by the admin.
 */
exports.getAdminSupportMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id)
      .populate("userId", "name email");

    if (!paymentRequest) {
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    // Atomically mark any unread user messages as read by admin
    await PaymentSupportMessage.updateMany(
      {
        paymentRequestId: paymentRequest._id,
        senderRole: "USER",
        readByAdminAt: null
      },
      { $set: { readByAdminAt: new Date() } }
    );

    const messages = await PaymentSupportMessage.find({ paymentRequestId: paymentRequest._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email role")
      .lean();

    res.json({
      success: true,
      paymentRequestId: paymentRequest._id,
      status: paymentRequest.status,
      user: paymentRequest.userId,
      messages
    });
  } catch (error) {
    console.error("Get Admin Support Messages Error:", error);
    res.status(500).json({
      message: "Failed to retrieve support messages.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 5. POST /api/admin/payment-requests/:id/support
 * Post an admin response or instruction to the payment support thread.
 * INVARIANT: Does NOT modify PaymentRequest.status.
 */
exports.sendAdminSupportMessage = async (req, res) => {
  const uploadedAttachmentRef = req.file?.attachmentRef || null;

  try {
    const { id } = req.params;
    const { message } = req.body || {};

    if (!isValidObjectId(id)) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage && !uploadedAttachmentRef) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(400).json({
        message: "Please enter a message or attach a screenshot.",
        code: "MESSAGE_OR_ATTACHMENT_REQUIRED"
      });
    }

    if (trimmedMessage.length > 2000) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(400).json({
        message: "Message cannot exceed 2000 characters.",
        code: "MESSAGE_TOO_LONG"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    const now = new Date();
    const supportMessage = new PaymentSupportMessage({
      paymentRequestId: paymentRequest._id,
      userId: paymentRequest.userId,
      senderId: req.user,
      senderRole: "ADMIN",
      message: trimmedMessage || undefined,
      attachmentRef: uploadedAttachmentRef || undefined,
      attachmentOriginalName: req.file?.originalname ? req.file.originalname.substring(0, 255) : undefined,
      attachmentMime: req.file?.detectedMime || undefined,
      attachmentSize: req.file?.size || undefined,
      readByUserAt: null, // Unread for user
      readByAdminAt: now // Admin's own message is immediately read by admin
    });

    await supportMessage.save();

    await supportMessage.populate("senderId", "name email role");

    res.status(201).json({
      success: true,
      message: supportMessage
    });
  } catch (error) {
    if (uploadedAttachmentRef) cleanupSupportFile(uploadedAttachmentRef);
    console.error("Send Admin Support Message Error:", error);
    res.status(500).json({
      message: "Failed to send support response.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 6. GET /api/admin/payment-requests/:id/support/attachment/:messageId
 * Stream private support attachment strictly to authenticated admins.
 */
exports.getAdminSupportAttachment = async (req, res) => {
  try {
    const { id, messageId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        message: "Invalid ID parameter.",
        code: "INVALID_ID"
      });
    }

    const supportMessage = await PaymentSupportMessage.findOne({
      _id: messageId,
      paymentRequestId: id
    });

    if (!supportMessage || !supportMessage.attachmentRef) {
      return res.status(404).json({
        message: "Attachment not found.",
        code: "ATTACHMENT_NOT_FOUND"
      });
    }

    const baseDir = path.resolve(supportDir);
    const filename = path.basename(supportMessage.attachmentRef);
    const resolvedPath = path.resolve(baseDir, filename);

    // Path traversal defense
    if (!resolvedPath.startsWith(baseDir) || !fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        message: "Attachment file not found on server storage.",
        code: "ATTACHMENT_NOT_FOUND"
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
      console.error("Admin support attachment stream error:", streamErr);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream attachment file.", code: "STREAM_ERROR" });
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Get Admin Support Attachment Error:", error);
    res.status(500).json({
      message: "Failed to retrieve attachment.",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * 7. GET /api/payment-request/support/unread-summary
 * Get summary of unread support messages for current user.
 */
exports.getUserUnreadSupportCount = async (req, res) => {
  try {
    const unreadCount = await PaymentSupportMessage.countDocuments({
      userId: req.user,
      senderRole: "ADMIN",
      readByUserAt: null
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error("Get User Unread Support Count Error:", error);
    res.status(500).json({
      message: "Failed to get unread support count.",
      code: "INTERNAL_ERROR"
    });
  }
};
