process.env.NODE_ENV = "test";
process.env.UPI_PAYEE_VPA = "fintrack.pay@icici";
process.env.UPI_PAYEE_NAME = "FinTrack Financials";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const User = require("../models/User");
const PaymentRequest = require("../models/PaymentRequest");
const PaymentAudit = require("../models/PaymentAudit");
const { processReceiptUpload, cleanupReceiptFile } = require("../middleware/uploadMiddleware");
const {
  getConfig,
  submitPaymentRequest,
  getMyPaymentRequests,
  resubmitPaymentRequest
} = require("../controllers/paymentRequestController");

// Helper to generate minimal valid image buffers for testing
const createJpegBuffer = () => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01]);
const createPngBuffer = () => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const createWebpBuffer = () => {
  const buf = Buffer.alloc(16);
  buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46; // RIFF
  buf[8] = 0x57; buf[9] = 0x45; buf[10] = 0x42; buf[11] = 0x50; // WEBP
  return buf;
};
const createFakeExeBuffer = () => Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00");

// Setup test Express app with mocked authentication
const createTestApp = (userId = "507f1f77bcf86cd799439011") => {
  const app = express();
  app.use(express.json());

  // Attach mock user
  app.use((req, res, next) => {
    if (userId) {
      req.user = userId;
    }
    next();
  });

  app.get("/api/payment-request/config", getConfig);
  app.post("/api/payment-request/submit", processReceiptUpload("screenshot"), submitPaymentRequest);
  app.get("/api/payment-request/my-requests", getMyPaymentRequests);
  app.put("/api/payment-request/:id/resubmit", processReceiptUpload("screenshot"), resubmitPaymentRequest);

  return app;
};

test("Step 4: UPI Payment Workflow Suite", async (t) => {
  const userA = "507f1f77bcf86cd799439011";
  const userB = "507f1f77bcf86cd799439022";
  const appA = createTestApp(userA);
  const appB = createTestApp(userB);
  const unauthApp = createTestApp(null);

  // Preserve original Mongoose methods
  const origFind = PaymentRequest.find;
  const origFindOne = PaymentRequest.findOne;
  const origFindById = PaymentRequest.findById;
  const origSave = PaymentRequest.prototype.save;
  const origAuditSave = PaymentAudit.prototype.save;
  const origStartSession = mongoose.startSession;

  // Mock mongoose.startSession to simulate test/dev environment where single-node MongoDB lacks replica sets.
  mongoose.startSession = async () => {
    throw new Error("No replica set in test environment");
  };

  t.afterEach(() => {
    PaymentRequest.find = origFind;
    PaymentRequest.findOne = origFindOne;
    PaymentRequest.findById = origFindById;
    PaymentRequest.prototype.save = origSave;
    PaymentAudit.prototype.save = origAuditSave;
  });

  t.after(() => {
    mongoose.startSession = origStartSession;
  });

  // ==========================================
  // SECTION 1: Config Endpoint
  // ==========================================

  await t.test("1. Authenticated user receives valid UPI configuration & server pricing", async () => {
    const res = await request(appA).get("/api/payment-request/config");
    assert.equal(res.status, 200);
    assert.equal(res.body.upi.vpa, "fintrack.pay@icici");
    assert.equal(res.body.upi.payeeName, "FinTrack Financials");
    assert.equal(res.body.plans.MONTHLY.priceINR, 149);
    assert.equal(res.body.plans.MONTHLY.amount, 14900);
    assert.equal(res.body.plans.YEARLY.priceINR, 999);
    assert.equal(res.body.plans.YEARLY.amount, 99900);
    assert.ok(Array.isArray(res.body.instructions));
  });

  await t.test("2. Missing UPI_PAYEE_VPA fails closed with 503 and no fake fallback", async () => {
    const origVpa = process.env.UPI_PAYEE_VPA;
    delete process.env.UPI_PAYEE_VPA;

    const res = await request(appA).get("/api/payment-request/config");
    assert.equal(res.status, 503);
    assert.equal(res.body.code, "PAYMENT_CONFIG_UNAVAILABLE");

    process.env.UPI_PAYEE_VPA = origVpa;
  });

  // ==========================================
  // SECTION 2: Submission & Server Pricing
  // ==========================================

  await t.test("3. Valid Monthly UPI submission creates PaymentRequest (14900) & PaymentAudit with status UNDER_REVIEW", async () => {
    let savedRequest = null;
    let savedAudit = null;

    PaymentRequest.findOne = async () => null; // No pending request or duplicate UTR
    PaymentRequest.prototype.save = async function () {
      savedRequest = this;
      return this;
    };
    PaymentAudit.prototype.save = async function () {
      savedAudit = this;
      return this;
    };

    const paymentDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("paymentMethod", "UPI_MANUAL")
      .field("utr", "423456789012")
      .field("payerUpiId", "meet@okhdfcbank")
      .field("paidAt", paymentDate)
      .field("userNote", "Test monthly transfer")
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 201);
    assert.equal(res.body.paymentRequest.plan, "MONTHLY");
    assert.equal(res.body.paymentRequest.amount, 14900);
    assert.equal(res.body.paymentRequest.currency, "INR");
    assert.equal(res.body.paymentRequest.status, "UNDER_REVIEW");
    assert.equal(res.body.paymentRequest.utr, "423456789012");

    assert.ok(savedRequest);
    assert.equal(savedRequest.userId.toString(), userA);
    assert.equal(savedRequest.amount, 14900);
    assert.equal(new Date(savedRequest.paidAt).toISOString(), paymentDate);
    assert.ok(savedRequest.submittedAt instanceof Date, "submittedAt must be server generated");

    assert.ok(savedAudit);
    assert.equal(savedAudit.action, "EVIDENCE_SUBMITTED");
    assert.equal(savedAudit.performedByRole, "USER");
    assert.equal(savedAudit.newStatus, "UNDER_REVIEW");

    if (savedRequest.screenshotRef) cleanupReceiptFile(savedRequest.screenshotRef);
  });

  await t.test("4. Valid Yearly UPI submission derives authoritative 99900 paise amount", async () => {
    let savedRequest = null;
    PaymentRequest.findOne = async () => null;
    PaymentRequest.prototype.save = async function () { savedRequest = this; return this; };
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "YEARLY")
      .field("paymentMethod", "UPI_MANUAL")
      .field("utr", "998877665544")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createPngBuffer(), { filename: "receipt.png", contentType: "image/png" });

    assert.equal(res.status, 201);
    assert.equal(res.body.paymentRequest.plan, "YEARLY");
    assert.equal(res.body.paymentRequest.amount, 99900);
    assert.equal(savedRequest.amount, 99900);

    if (savedRequest?.screenshotRef) cleanupReceiptFile(savedRequest.screenshotRef);
  });

  await t.test("5. Client cannot tamper amount or currency via request body", async () => {
    let savedRequest = null;
    PaymentRequest.findOne = async () => null;
    PaymentRequest.prototype.save = async function () { savedRequest = this; return this; };
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "YEARLY")
      .field("amount", "100") // Tampered amount
      .field("currency", "USD") // Tampered currency
      .field("utr", "998877665544")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createPngBuffer(), { filename: "receipt.png", contentType: "image/png" });

    assert.equal(res.status, 201);
    assert.equal(savedRequest.amount, 99900, "Server must enforce 99900 paise");
    assert.equal(savedRequest.currency, "INR", "Server must enforce INR");

    if (savedRequest?.screenshotRef) cleanupReceiptFile(savedRequest.screenshotRef);
  });

  await t.test("6. Invalid plan is rejected with 400 INVALID_PLAN", async () => {
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "LIFETIME_FREE")
      .field("utr", "123456789012")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_PLAN");
  });

  await t.test("7. Invalid paymentMethod is rejected with 400 INVALID_PAYMENT_METHOD", async () => {
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("paymentMethod", "BITCOIN")
      .field("utr", "123456789012")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_PAYMENT_METHOD");
  });

  // ==========================================
  // SECTION 3: PaidAt Date Validation Suite
  // ==========================================

  await t.test("8. Missing paidAt is rejected with 400 PAID_AT_REQUIRED", async () => {
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "123456789012")
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "PAID_AT_REQUIRED");
  });

  await t.test("9. Invalid paidAt format is rejected with 400 INVALID_PAYMENT_DATE", async () => {
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "123456789012")
      .field("paidAt", "not-a-valid-date")
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_PAYMENT_DATE");
  });

  await t.test("10. Future paidAt is rejected with 400 FUTURE_PAYMENT_DATE", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // +1 day in future
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "123456789012")
      .field("paidAt", futureDate)
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "FUTURE_PAYMENT_DATE");
  });

  await t.test("11. Unreasonable historical paidAt (>90 days) is rejected with 400 HISTORICAL_PAYMENT_DATE", async () => {
    const oldDate = new Date(Date.now() - 100 * 86400000).toISOString(); // 100 days ago
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "123456789012")
      .field("paidAt", oldDate)
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "HISTORICAL_PAYMENT_DATE");
  });

  // ==========================================
  // SECTION 4: UTR Validation & Duplicate Protection
  // ==========================================

  await t.test("12. Missing or empty UTR is rejected with 400 UTR_REQUIRED", async () => {
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "   ")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "UTR_REQUIRED");
  });

  await t.test("13. Invalid UTR length (<6 or >30) is rejected with 400 INVALID_UTR_LENGTH", async () => {
    const shortRes = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "12345")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(shortRes.status, 400);
    assert.equal(shortRes.body.code, "INVALID_UTR_LENGTH");
  });

  await t.test("14. UTR is normalized to uppercase without whitespace", async () => {
    let savedRequest = null;
    PaymentRequest.findOne = async () => null;
    PaymentRequest.prototype.save = async function () { savedRequest = this; return this; };
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "  ab 12  34 cd  ")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 201);
    assert.equal(savedRequest.utr, "AB1234CD");

    if (savedRequest?.screenshotRef) cleanupReceiptFile(savedRequest.screenshotRef);
  });

  await t.test("15. Duplicate UTR returns 409 UTR_ALREADY_EXISTS", async () => {
    PaymentRequest.findOne = async (query) => {
      if (query.utr === "DUPLICATE1234") {
        return { _id: "66dd111", utr: "DUPLICATE1234" };
      }
      return null;
    };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "DUPLICATE1234")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 409);
    assert.equal(res.body.code, "UTR_ALREADY_EXISTS");
  });

  // ==========================================
  // SECTION 5: Single Active Request Protection (DB & Logic)
  // ==========================================

  await t.test("16. Database schema contains partial unique index for active requests", async () => {
    const indexes = PaymentRequest.schema.indexes();
    const activeIndex = indexes.find(
      ([fields, options]) => fields.userId === 1 && options?.unique === true && options?.partialFilterExpression?.status
    );

    assert.ok(activeIndex, "Partial unique index on userId for active statuses must exist in schema");
    assert.deepEqual(activeIndex[1].partialFilterExpression.status.$in, ["UNDER_REVIEW", "NEEDS_MORE_INFO"]);
  });

  await t.test("17. User with existing UNDER_REVIEW request is rejected with 409 PENDING_REQUEST_EXISTS", async () => {
    PaymentRequest.findOne = async (query) => {
      if (query.userId === userA) {
        return { _id: "existing_1", status: "UNDER_REVIEW" };
      }
      return null;
    };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "NEWUTR123456")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 409);
    assert.equal(res.body.code, "PENDING_REQUEST_EXISTS");
  });

  await t.test("18. User with existing NEEDS_MORE_INFO request is rejected with 409 PENDING_REQUEST_EXISTS", async () => {
    PaymentRequest.findOne = async (query) => {
      if (query.userId === userA) {
        return { _id: "existing_2", status: "NEEDS_MORE_INFO" };
      }
      return null;
    };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "NEWUTR123456")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 409);
    assert.equal(res.body.code, "PENDING_REQUEST_EXISTS");
  });

  await t.test("19. User with historical REJECTED request CAN submit a new request", async () => {
    PaymentRequest.findOne = async (query) => {
      // User has only REJECTED request in database
      if (query.userId === userA && query.status?.$in) {
        return null; // No active UNDER_REVIEW or NEEDS_MORE_INFO
      }
      return null;
    };
    PaymentRequest.prototype.save = async function () { return this; };
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "FRESHUTR1234")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 201);
  });

  await t.test("20. User with historical APPROVED request CAN submit a new request (e.g. renewal)", async () => {
    PaymentRequest.findOne = async (query) => {
      if (query.userId === userA && query.status?.$in) {
        return null; // No active request
      }
      return null;
    };
    PaymentRequest.prototype.save = async function () { return this; };
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "YEARLY")
      .field("utr", "RENEWALUTR12")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createPngBuffer(), { filename: "receipt.png", contentType: "image/png" });

    assert.equal(res.status, 201);
  });

  await t.test("21. Concurrent/race duplicate active request triggers index error and returns 409 PENDING_REQUEST_EXISTS", async () => {
    PaymentRequest.findOne = async () => null; // Passed pre-flight check due to race condition
    PaymentRequest.prototype.save = async function () {
      const err = new Error("E11000 duplicate key error collection: fintrack.paymentrequests index: userId_1 dup key: { userId: ObjectId('507f1f77bcf86cd799439011') }");
      err.code = 11000;
      err.keyPattern = { userId: 1 };
      throw err;
    };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "RACEUTR12345")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 409);
    assert.equal(res.body.code, "PENDING_REQUEST_EXISTS");
  });

  // ==========================================
  // SECTION 6: File Validation & Security
  // ==========================================

  await t.test("22. Missing screenshot file is rejected with 400 SCREENSHOT_REQUIRED", async () => {
    PaymentRequest.findOne = async () => null;

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "UTR123456789")
      .field("paidAt", new Date().toISOString());

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "SCREENSHOT_REQUIRED");
  });

  await t.test("23. Fake image with disguised executable bytes is rejected with 400 INVALID_FILE_SIGNATURE", async () => {
    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "UTR123456789")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createFakeExeBuffer(), { filename: "malware.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_FILE_SIGNATURE");
  });

  await t.test("24. ScreenshotRef stores only private relative path without absolute filesystem leak", async () => {
    let savedRequest = null;
    PaymentRequest.findOne = async () => null;
    PaymentRequest.prototype.save = async function () { savedRequest = this; return this; };
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "UTR123456789")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createWebpBuffer(), { filename: "receipt.webp", contentType: "image/webp" });

    assert.equal(res.status, 201);
    assert.ok(savedRequest.screenshotRef.startsWith("receipts/"));
    assert.equal(savedRequest.screenshotRef.includes("C:"), false);
    assert.equal(savedRequest.screenshotRef.includes("/uploads/"), false);

    if (savedRequest?.screenshotRef) cleanupReceiptFile(savedRequest.screenshotRef);
  });

  // ==========================================
  // SECTION 7: User History & Access Isolation
  // ==========================================

  await t.test("25. User can retrieve only their own payment requests", async () => {
    PaymentRequest.find = function (query) {
      assert.equal(query.userId, userA, "Query must strictly filter by authenticated user");
      return {
        sort: () => ({
          select: async () => [
            { _id: "req1", plan: "MONTHLY", amount: 14900, status: "UNDER_REVIEW", utr: "UTR1" }
          ]
        })
      };
    };

    const res = await request(appA).get("/api/payment-request/my-requests");
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].utr, "UTR1");
  });

  // ==========================================
  // SECTION 8: Resubmission Flow
  // ==========================================

  await t.test("26. Request in NEEDS_MORE_INFO can be resubmitted with updated evidence", async () => {
    const mockRequest = {
      _id: new mongoose.Types.ObjectId(),
      userId: userA,
      status: "NEEDS_MORE_INFO",
      utr: "OLD_UTR12345",
      screenshotRef: "receipts/old.jpg",
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    PaymentRequest.findOne = async () => null; // No UTR collision
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .put(`/api/payment-request/${mockRequest._id}/resubmit`)
      .field("utr", "CORRECTED_UTR99")
      .field("userNote", "Re-uploaded clear photo")
      .attach("screenshot", createJpegBuffer(), { filename: "new_receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 200);
    assert.equal(mockRequest.status, "UNDER_REVIEW");
    assert.equal(mockRequest.utr, "CORRECTED_UTR99");

    if (mockRequest.screenshotRef) cleanupReceiptFile(mockRequest.screenshotRef);
  });

  await t.test("27. Request in UNDER_REVIEW cannot be resubmitted (400 INVALID_RESUBMIT_STATE)", async () => {
    const mockRequest = {
      _id: new mongoose.Types.ObjectId(),
      userId: userA,
      status: "UNDER_REVIEW"
    };
    PaymentRequest.findById = async () => mockRequest;

    const res = await request(appA)
      .put(`/api/payment-request/${mockRequest._id}/resubmit`)
      .field("utr", "NEW_UTR99999");

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_RESUBMIT_STATE");
  });

  await t.test("28. Unauthorized user cannot resubmit another user's request (403 UNAUTHORIZED_ACCESS)", async () => {
    const mockRequest = {
      _id: new mongoose.Types.ObjectId(),
      userId: userB, // Belongs to User B
      status: "NEEDS_MORE_INFO"
    };
    PaymentRequest.findById = async () => mockRequest;

    // Authenticated as User A
    const res = await request(appA)
      .put(`/api/payment-request/${mockRequest._id}/resubmit`)
      .field("utr", "NEW_UTR99999");

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "UNAUTHORIZED_ACCESS");
  });

  // ==========================================
  // SECTION 9: Pro Safety Invariant
  // ==========================================

  await t.test("29. Invariant: Submitting manual UPI payment DOES NOT modify User entitlement", async () => {
    let userModified = false;
    User.findByIdAndUpdate = async () => { userModified = true; };
    User.prototype.save = async function () { userModified = true; return this; };

    PaymentRequest.findOne = async () => null;
    PaymentRequest.prototype.save = async function () { return this; };
    PaymentAudit.prototype.save = async function () { return this; };

    const res = await request(appA)
      .post("/api/payment-request/submit")
      .field("plan", "MONTHLY")
      .field("utr", "SAFETYCHECK123")
      .field("paidAt", new Date().toISOString())
      .attach("screenshot", createJpegBuffer(), { filename: "receipt.jpg", contentType: "image/jpeg" });

    assert.equal(res.status, 201);
    assert.equal(userModified, false, "User record must never be touched during Step 4 submission");
  });
});
