const mongoose = require("mongoose");
const PaymentRequest = require("../models/PaymentRequest");
const PaymentAudit = require("../models/PaymentAudit");
const { getPlanPricing, isValidPlan, PRICING_PLANS } = require("../config/pricing");
const { cleanupReceiptFile } = require("../middleware/uploadMiddleware");

// GET /api/payment-request/config
exports.getConfig = async (req, res) => {
  try {
    const vpa = process.env.UPI_PAYEE_VPA ? process.env.UPI_PAYEE_VPA.trim() : null;
    const payeeName = process.env.UPI_PAYEE_NAME ? process.env.UPI_PAYEE_NAME.trim() : "FinTrack";

    // Fail closed: If no authoritative UPI VPA is configured in environment, do not return fake/example fallbacks
    if (!vpa) {
      return res.status(503).json({
        message: "Manual UPI payment service is currently unavailable. Please contact support or use instant checkout.",
        code: "PAYMENT_CONFIG_UNAVAILABLE"
      });
    }

    res.json({
      upi: {
        vpa,
        payeeName
      },
      plans: {
        MONTHLY: {
          priceINR: PRICING_PLANS.MONTHLY.priceINR,
          amount: PRICING_PLANS.MONTHLY.amount,
          durationDays: PRICING_PLANS.MONTHLY.durationDays
        },
        YEARLY: {
          priceINR: PRICING_PLANS.YEARLY.priceINR,
          amount: PRICING_PLANS.YEARLY.amount,
          durationDays: PRICING_PLANS.YEARLY.durationDays,
          badge: PRICING_PLANS.YEARLY.badge
        }
      },
      instructions: [
        "Open any UPI-enabled payment app (Google Pay, PhonePe, Paytm, BHIM, etc.).",
        "Scan the QR code or send the exact plan amount to the UPI ID provided above.",
        "Copy the 12-digit UTR (Unique Transaction Reference) / UPI Reference number from your payment confirmation.",
        "Upload a clear screenshot of the completed payment receipt and submit the form below."
      ]
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load payment configuration.", code: "INTERNAL_ERROR" });
  }
};

// POST /api/payment-request/submit
exports.submitPaymentRequest = async (req, res) => {
  let uploadedFileRef = req.file?.screenshotRef || null;

  try {
    const {
      plan,
      paymentMethod = "UPI_MANUAL",
      utr,
      payerUpiId,
      paidAt,
      userNote
    } = req.body || {};

    // 1. Plan validation & Authoritative Pricing derivation
    if (!plan || typeof plan !== "string" || !isValidPlan(plan)) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Invalid subscription plan. Allowed plans: MONTHLY, YEARLY.",
        code: "INVALID_PLAN"
      });
    }

    const pricing = getPlanPricing(plan);
    const amount = pricing.amount; // Server-authoritative amount in paise (14900 or 99900)
    const currency = pricing.currency; // "INR"

    // 2. Payment method validation
    if (paymentMethod !== "UPI_MANUAL") {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Invalid payment method for manual transfer. Expected UPI_MANUAL.",
        code: "INVALID_PAYMENT_METHOD"
      });
    }

    // 3. UTR validation & normalization
    if (!utr || typeof utr !== "string" || !utr.trim()) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "UTR / Transaction Reference number is required.",
        code: "UTR_REQUIRED"
      });
    }

    const normalizedUtr = PaymentRequest.normalizeUtr(utr);
    if (!normalizedUtr || normalizedUtr.length < 6 || normalizedUtr.length > 30) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "UTR reference must be between 6 and 30 characters.",
        code: "INVALID_UTR_LENGTH"
      });
    }

    // 4. Screenshot evidence validation
    if (!uploadedFileRef) {
      return res.status(400).json({
        message: "Payment receipt screenshot is required for verification.",
        code: "SCREENSHOT_REQUIRED"
      });
    }

    // 5. PaidAt date validation
    if (!paidAt || (typeof paidAt !== "string" && !(paidAt instanceof Date)) || !String(paidAt).trim()) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Payment date & time is required.",
        code: "PAID_AT_REQUIRED"
      });
    }

    const parsedPaidAt = new Date(paidAt);
    if (isNaN(parsedPaidAt.getTime())) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Invalid payment date format.",
        code: "INVALID_PAYMENT_DATE"
      });
    }

    const now = new Date();
    if (parsedPaidAt > now) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Payment date cannot be in the future.",
        code: "FUTURE_PAYMENT_DATE"
      });
    }

    // Reject unreasonable historical dates (older than 90 days)
    const minAllowedDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (parsedPaidAt < minAllowedDate) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Payment date cannot be older than 90 days.",
        code: "HISTORICAL_PAYMENT_DATE"
      });
    }

    // 6. Sanitization of optional fields
    const sanitizedPayerUpiId = typeof payerUpiId === "string" && payerUpiId.trim()
      ? payerUpiId.trim().toLowerCase().substring(0, 100)
      : undefined;

    const sanitizedUserNote = typeof userNote === "string" && userNote.trim()
      ? userNote.trim().substring(0, 500)
      : undefined;

    // 7. Single Active Request Enforcement (UNDER_REVIEW or NEEDS_MORE_INFO)
    const existingActive = await PaymentRequest.findOne({
      userId: req.user,
      status: { $in: ["UNDER_REVIEW", "NEEDS_MORE_INFO"] }
    });

    if (existingActive) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(409).json({
        message: "You already have a payment request under review. Please wait for verification before submitting another.",
        code: "PENDING_REQUEST_EXISTS"
      });
    }

    // 8. Friendly UTR collision check
    const existingUtr = await PaymentRequest.findOne({ utr: normalizedUtr });
    if (existingUtr) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(409).json({
        message: "This UTR / Transaction Reference has already been submitted. Please verify your reference number or contact support.",
        code: "UTR_ALREADY_EXISTS"
      });
    }

    // 9. Atomic persistence of PaymentRequest and PaymentAudit
    let session = null;
    let isTransactional = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      isTransactional = true;
    } catch (sessionErr) {
      session = null;
      isTransactional = false;
    }

    const paymentRequest = new PaymentRequest({
      userId: req.user,
      plan: plan.toUpperCase().trim(),
      amount,
      currency,
      paymentMethod: "UPI_MANUAL",
      utr: normalizedUtr,
      payerUpiId: sanitizedPayerUpiId,
      paidAt: parsedPaidAt,
      screenshotRef: uploadedFileRef,
      userNote: sanitizedUserNote,
      status: "UNDER_REVIEW",
      submittedAt: now
    });

    const paymentAudit = new PaymentAudit({
      paymentRequestId: paymentRequest._id,
      userId: req.user,
      action: "EVIDENCE_SUBMITTED",
      newStatus: "UNDER_REVIEW",
      performedBy: req.user,
      performedByRole: "USER",
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
      note: "User submitted manual UPI payment evidence"
    });

    try {
      if (isTransactional && session) {
        await paymentRequest.save({ session });
        await paymentAudit.save({ session });
        await session.commitTransaction();
      } else {
        await paymentRequest.save();
        await paymentAudit.save();
      }
    } catch (saveError) {
      if (isTransactional && session) {
        await session.abortTransaction();
      }
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);

      if (saveError.code === 11000) {
        const keyPattern = saveError.keyPattern || {};
        const isUserCollision = keyPattern.userId || (saveError.message && saveError.message.includes("userId"));

        if (isUserCollision) {
          return res.status(409).json({
            message: "You already have a payment request under review. Please wait for verification before submitting another.",
            code: "PENDING_REQUEST_EXISTS"
          });
        }

        return res.status(409).json({
          message: "This UTR / Transaction Reference has already been submitted. Please verify your reference number or contact support.",
          code: "UTR_ALREADY_EXISTS"
        });
      }

      console.error("PaymentRequest Submission Save Error:", saveError);
      return res.status(500).json({
        message: "Failed to submit payment request. Please try again.",
        code: "INTERNAL_ERROR"
      });
    } finally {
      if (session) {
        session.endSession();
      }
    }

    // 10. Return sanitized response (No Pro activation occurs)
    res.status(201).json({
      message: "Payment request submitted successfully and is now under review.",
      paymentRequest: {
        _id: paymentRequest._id,
        plan: paymentRequest.plan,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        paymentMethod: paymentRequest.paymentMethod,
        utr: paymentRequest.utr,
        payerUpiId: paymentRequest.payerUpiId,
        paidAt: paymentRequest.paidAt,
        status: paymentRequest.status,
        submittedAt: paymentRequest.submittedAt
      }
    });

  } catch (error) {
    if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
    console.error("PaymentRequest Submit Handler Error:", error);
    res.status(500).json({ message: "An unexpected error occurred.", code: "INTERNAL_ERROR" });
  }
};

// GET /api/payment-request/my-requests
exports.getMyPaymentRequests = async (req, res) => {
  try {
    const requests = await PaymentRequest.find({ userId: req.user })
      .sort({ createdAt: -1 })
      .select("-adminNote -screenshotRef -__v");

    res.json(requests);
  } catch (error) {
    console.error("Get My Payment Requests Error:", error);
    res.status(500).json({ message: "Failed to fetch payment requests.", code: "INTERNAL_ERROR" });
  }
};

// PUT /api/payment-request/:id/resubmit
exports.resubmitPaymentRequest = async (req, res) => {
  let uploadedFileRef = req.file?.screenshotRef || null;

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Invalid payment request ID.",
        code: "INVALID_REQUEST_ID"
      });
    }

    const paymentRequest = await PaymentRequest.findById(id);

    if (!paymentRequest) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(404).json({
        message: "Payment request not found.",
        code: "REQUEST_NOT_FOUND"
      });
    }

    // Ownership check
    if (paymentRequest.userId.toString() !== req.user.toString()) {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(403).json({
        message: "You do not have permission to modify this payment request.",
        code: "UNAUTHORIZED_ACCESS"
      });
    }

    // Only allow resubmission if status is NEEDS_MORE_INFO
    if (paymentRequest.status !== "NEEDS_MORE_INFO") {
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
      return res.status(400).json({
        message: "Only payment requests in NEEDS_MORE_INFO status can be resubmitted.",
        code: "INVALID_RESUBMIT_STATE"
      });
    }

    const { utr, payerUpiId, paidAt, userNote } = req.body || {};

    // If new UTR provided, validate and check uniqueness
    if (utr !== undefined) {
      const normalizedUtr = PaymentRequest.normalizeUtr(utr);
      if (!normalizedUtr || normalizedUtr.length < 6 || normalizedUtr.length > 30) {
        if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
        return res.status(400).json({
          message: "UTR reference must be between 6 and 30 characters.",
          code: "INVALID_UTR_LENGTH"
        });
      }

      // Check collision with other requests
      const existingUtr = await PaymentRequest.findOne({
        utr: normalizedUtr,
        _id: { $ne: paymentRequest._id }
      });

      if (existingUtr) {
        if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
        return res.status(409).json({
          message: "This UTR / Transaction Reference has already been submitted by another request.",
          code: "UTR_ALREADY_EXISTS"
        });
      }

      paymentRequest.utr = normalizedUtr;
    }

    if (payerUpiId !== undefined) {
      paymentRequest.payerUpiId = typeof payerUpiId === "string" && payerUpiId.trim()
        ? payerUpiId.trim().toLowerCase().substring(0, 100)
        : undefined;
    }

    if (paidAt !== undefined && paidAt !== null && String(paidAt).trim() !== "") {
      const parsedPaidAt = new Date(paidAt);
      if (isNaN(parsedPaidAt.getTime())) {
        if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
        return res.status(400).json({
          message: "Invalid payment date format.",
          code: "INVALID_PAYMENT_DATE"
        });
      }
      const now = new Date();
      if (parsedPaidAt > now) {
        if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
        return res.status(400).json({
          message: "Payment date cannot be in the future.",
          code: "FUTURE_PAYMENT_DATE"
        });
      }
      const minAllowedDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      if (parsedPaidAt < minAllowedDate) {
        if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
        return res.status(400).json({
          message: "Payment date cannot be older than 90 days.",
          code: "HISTORICAL_PAYMENT_DATE"
        });
      }
      paymentRequest.paidAt = parsedPaidAt;
    }

    if (userNote !== undefined) {
      paymentRequest.userNote = typeof userNote === "string" && userNote.trim()
        ? userNote.trim().substring(0, 500)
        : undefined;
    }

    const previousFileRef = paymentRequest.screenshotRef;
    if (uploadedFileRef) {
      paymentRequest.screenshotRef = uploadedFileRef;
    }

    const previousStatus = paymentRequest.status;
    paymentRequest.status = "UNDER_REVIEW";
    paymentRequest.submittedAt = new Date();

    const paymentAudit = new PaymentAudit({
      paymentRequestId: paymentRequest._id,
      userId: req.user,
      action: "EVIDENCE_RESUBMITTED",
      previousStatus,
      newStatus: "UNDER_REVIEW",
      performedBy: req.user,
      performedByRole: "USER",
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
      note: "User resubmitted updated payment evidence"
    });

    let session = null;
    let isTransactional = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      isTransactional = true;
    } catch (sessionErr) {
      session = null;
      isTransactional = false;
    }

    try {
      if (isTransactional && session) {
        await paymentRequest.save({ session });
        await paymentAudit.save({ session });
        await session.commitTransaction();
      } else {
        await paymentRequest.save();
        await paymentAudit.save();
      }

      // Cleanup old file if replaced
      if (uploadedFileRef && previousFileRef && previousFileRef !== uploadedFileRef) {
        cleanupReceiptFile(previousFileRef);
      }
    } catch (saveError) {
      if (isTransactional && session) {
        await session.abortTransaction();
      }
      if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);

      if (saveError.code === 11000) {
        const keyPattern = saveError.keyPattern || {};
        const isUserCollision = keyPattern.userId || (saveError.message && saveError.message.includes("userId"));

        if (isUserCollision) {
          return res.status(409).json({
            message: "You already have a payment request under review. Please wait for verification before submitting another.",
            code: "PENDING_REQUEST_EXISTS"
          });
        }

        return res.status(409).json({
          message: "This UTR / Transaction Reference has already been submitted.",
          code: "UTR_ALREADY_EXISTS"
        });
      }

      console.error("PaymentRequest Resubmit Save Error:", saveError);
      return res.status(500).json({
        message: "Failed to resubmit payment request.",
        code: "INTERNAL_ERROR"
      });
    } finally {
      if (session) {
        session.endSession();
      }
    }

    res.json({
      message: "Payment evidence resubmitted successfully and is now under review.",
      paymentRequest: {
        _id: paymentRequest._id,
        plan: paymentRequest.plan,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        paymentMethod: paymentRequest.paymentMethod,
        utr: paymentRequest.utr,
        payerUpiId: paymentRequest.payerUpiId,
        paidAt: paymentRequest.paidAt,
        status: paymentRequest.status,
        submittedAt: paymentRequest.submittedAt
      }
    });

  } catch (error) {
    if (uploadedFileRef) cleanupReceiptFile(uploadedFileRef);
    console.error("PaymentRequest Resubmit Handler Error:", error);
    res.status(500).json({ message: "An unexpected error occurred.", code: "INTERNAL_ERROR" });
  }
};
