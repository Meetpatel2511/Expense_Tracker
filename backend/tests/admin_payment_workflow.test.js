process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const PaymentRequest = require("../models/PaymentRequest");
const PaymentAudit = require("../models/PaymentAudit");
const adminPaymentController = require("../controllers/adminPaymentController");
const { receiptsDir } = require("../middleware/uploadMiddleware");

// Setup minimal test Express app with mocked authentication & admin resolution
let currentMockUserId = null;
let currentMockUserRole = "ADMIN";

const app = express();
app.use(express.json());

// Mock authMiddleware + requireAdmin
app.use(async (req, res, next) => {
  if (!currentMockUserId) {
    return res.status(401).json({ message: "Authentication required.", code: "UNAUTHORIZED" });
  }

  req.user = currentMockUserId;

  if (currentMockUserRole !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied. Administrator privileges required.",
      code: "ADMIN_REQUIRED"
    });
  }

  req.adminUser = {
    _id: currentMockUserId,
    name: "Admin User",
    email: "admin@fintrack.dev",
    role: "ADMIN"
  };

  next();
});

// Mount admin controller routes
app.get("/api/admin/payment-requests", adminPaymentController.getQueue);
app.get("/api/admin/payment-requests/:id", adminPaymentController.getDetail);
app.get("/api/admin/payment-requests/:id/receipt", adminPaymentController.getReceipt);
app.post("/api/admin/payment-requests/:id/approve", adminPaymentController.approve);
app.post("/api/admin/payment-requests/:id/reject", adminPaymentController.reject);
app.post("/api/admin/payment-requests/:id/request-info", adminPaymentController.requestInfo);

test("Step 5.2: Admin Payment Controller & Review Queue Suite", async (t) => {
  const adminId = new mongoose.Types.ObjectId().toString();
  const regularUserId = new mongoose.Types.ObjectId().toString();

  // Preserve original methods
  const origFind = PaymentRequest.find;
  const origFindById = PaymentRequest.findById;
  const origCountDocuments = PaymentRequest.countDocuments;
  const origSave = PaymentRequest.prototype.save;
  const origUserFind = User.find;
  const origUserFindById = User.findById;
  const origUserSave = User.prototype.save;
  const origAuditFind = PaymentAudit.find;
  const origAuditCreate = PaymentAudit.create;

  t.beforeEach(() => {
    currentMockUserId = adminId;
    currentMockUserRole = "ADMIN";
    PaymentRequest.prototype.save = async function () { return this; };
    User.prototype.save = async function () { return this; };
    PaymentAudit.prototype.save = async function () { return this; };
    PaymentAudit.create = async function (doc) { return doc; };
  });

  t.afterEach(() => {
    PaymentRequest.find = origFind;
    PaymentRequest.findById = origFindById;
    PaymentRequest.countDocuments = origCountDocuments;
    PaymentRequest.prototype.save = origSave;
    User.find = origUserFind;
    User.findById = origUserFindById;
    User.prototype.save = origUserSave;
    PaymentAudit.find = origAuditFind;
    PaymentAudit.create = origAuditCreate;
  });

  // ==========================================
  // SECTION 1: Authorization Protection
  // ==========================================

  await t.test("1. Unauthenticated request to admin endpoints returns 401 UNAUTHORIZED", async () => {
    currentMockUserId = null;
    const res = await request(app).get("/api/admin/payment-requests");
    assert.equal(res.status, 401);
    assert.equal(res.body.code, "UNAUTHORIZED");
  });

  await t.test("2. Non-admin user request to admin endpoints returns 403 ADMIN_REQUIRED", async () => {
    currentMockUserId = regularUserId;
    currentMockUserRole = "USER";
    const res = await request(app).get("/api/admin/payment-requests");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
  });

  // ==========================================
  // SECTION 2: getQueue (Review Queue & Search)
  // ==========================================

  await t.test("3. getQueue: returns paginated list of payment requests", async () => {
    const mockRequests = [
      { _id: new mongoose.Types.ObjectId(), utr: "123456789012", status: "UNDER_REVIEW", amount: 14900, plan: "MONTHLY" },
      { _id: new mongoose.Types.ObjectId(), utr: "987654321098", status: "NEEDS_MORE_INFO", amount: 99900, plan: "YEARLY" }
    ];

    PaymentRequest.countDocuments = async () => 2;
    PaymentRequest.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => ({
                lean: async () => mockRequests
              })
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/payment-requests?page=1&limit=10");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 2);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.page, 1);
    assert.equal(res.body.totalPages, 1);
    assert.equal(res.body.requests.length, 2);
  });

  await t.test("4. getQueue: filters by status and UTR properly", async () => {
    let capturedFilter = null;

    PaymentRequest.countDocuments = async (filter) => {
      capturedFilter = filter;
      return 1;
    };
    PaymentRequest.find = (filter) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => ({
                lean: async () => [{ utr: "ABC123456789", status: "UNDER_REVIEW" }]
              })
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/payment-requests?status=UNDER_REVIEW&utr=ABC123456789");
    assert.equal(res.status, 200);
    assert.equal(capturedFilter.status, "UNDER_REVIEW");
    assert.ok(capturedFilter.utr);
  });

  await t.test("5. getQueue: searches by normalized user email prefix", async () => {
    let capturedFilter = null;
    const targetUserId = new mongoose.Types.ObjectId();

    User.find = (filter) => ({
      select: async () => [{ _id: targetUserId }]
    });

    PaymentRequest.countDocuments = async (filter) => {
      capturedFilter = filter;
      return 1;
    };
    PaymentRequest.find = (filter) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => ({
                lean: async () => [{ _id: new mongoose.Types.ObjectId(), userId: targetUserId }]
              })
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/payment-requests?email=customer@example.com");
    assert.equal(res.status, 200);
    assert.deepEqual(capturedFilter.userId, { $in: [targetUserId] });
  });

  // ==========================================
  // SECTION 3: getDetail & Audit Timeline
  // ==========================================

  await t.test("6. getDetail: rejects invalid ObjectId with 400", async () => {
    const res = await request(app).get("/api/admin/payment-requests/invalid-id-format");
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_REQUEST_ID");
  });

  await t.test("7. getDetail: returns 404 when payment request does not exist", async () => {
    PaymentRequest.findById = () => ({
      populate: () => ({
        populate: async () => null
      })
    });

    const validId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/admin/payment-requests/${validId}`);
    assert.equal(res.status, 404);
    assert.equal(res.body.code, "REQUEST_NOT_FOUND");
  });

  await t.test("8. getDetail: returns payment details with populated audit timeline", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const mockRequest = {
      _id: reqId,
      utr: "123456789012",
      status: "UNDER_REVIEW",
      plan: "MONTHLY",
      amount: 14900
    };

    const mockAudits = [
      { action: "REQUEST_CREATED", previousStatus: null, newStatus: "UNDER_REVIEW", createdAt: new Date() }
    ];

    PaymentRequest.findById = () => ({
      populate: () => ({
        populate: async () => mockRequest
      })
    });

    PaymentAudit.find = () => ({
      sort: () => ({
        populate: async () => mockAudits
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.paymentRequest.utr, "123456789012");
    assert.equal(res.body.auditTrail.length, 1);
    assert.equal(res.body.auditTrail[0].action, "REQUEST_CREATED");
  });

  // ==========================================
  // SECTION 4: getReceipt (Private File Streaming)
  // ==========================================

  await t.test("9. getReceipt: streams valid WebP receipt with correct Content-Type", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const testFileName = `test_receipt_${Date.now()}.webp`;
    const testFilePath = path.join(receiptsDir, testFileName);

    // Create a temporary minimal test image
    const webpBuffer = Buffer.alloc(16);
    webpBuffer[0] = 0x52; webpBuffer[1] = 0x49; webpBuffer[2] = 0x46; webpBuffer[3] = 0x46;
    webpBuffer[8] = 0x57; webpBuffer[9] = 0x45; webpBuffer[10] = 0x42; webpBuffer[11] = 0x50;
    fs.writeFileSync(testFilePath, webpBuffer);

    PaymentRequest.findById = () => ({
      select: async () => ({
        _id: reqId,
        screenshotRef: `receipts/${testFileName}`
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}/receipt`);
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-type"], "image/webp");
    assert.equal(res.headers["cache-control"], "private, no-cache, no-store, must-revalidate");

    // Clean up test file
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  });

  await t.test("10. getReceipt: returns 404 when receipt file does not exist on disk", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = () => ({
      select: async () => ({
        _id: reqId,
        screenshotRef: "receipts/non_existent_file.png"
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}/receipt`);
    assert.equal(res.status, 404);
    assert.equal(res.body.code, "RECEIPT_NOT_FOUND");
  });

  // ==========================================
  // SECTION 5: approve (Entitlement & Standalone Reconciliation)
  // ==========================================

  await t.test("11a. approve: reconciles missing User entitlement for already APPROVED PaymentRequest without adding extra duration", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();
    const fixedProStartsAt = new Date("2026-09-01T12:00:00.000Z");
    const fixedProExpiresAt = new Date("2026-10-01T12:00:00.000Z");

    const mockApprovedRequest = {
      _id: reqId,
      userId: customerId,
      status: "APPROVED",
      plan: "MONTHLY",
      amount: 14900,
      utr: "RECONCILE1234",
      proStartsAt: fixedProStartsAt,
      proExpiresAt: fixedProExpiresAt,
      adminNote: "Original admin approval note",
      save: async function () { return this; }
    };

    // User missing entitlement (e.g. crash before user save)
    let savedUser = null;
    const mockCustomer = {
      _id: customerId,
      name: "Interrupted Customer",
      email: "interrupted@test.com",
      clerkId: "user_clerk_interrupted",
      isPro: false,
      proExpiresAt: null,
      save: async function () {
        savedUser = this;
        return this;
      }
    };

    PaymentRequest.findById = async () => mockApprovedRequest;
    User.findById = async () => mockCustomer;

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`);
    assert.equal(res.status, 200);
    assert.equal(res.body.alreadyApproved, true);
    assert.equal(res.body.reconciled, true);
    assert.equal(savedUser.isPro, true);
    assert.equal(savedUser.paymentId, "MANUAL_UPI_RECONCILE1234");
    // Ensure exact persisted dates were used without adding extra days
    assert.equal(new Date(savedUser.proExpiresAt).getTime(), fixedProExpiresAt.getTime());
  });

  await t.test("11b. approve: is idempotent when PaymentRequest is already APPROVED and User entitlement is active", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();
    const fixedProExpiresAt = new Date("2026-10-01T12:00:00.000Z");

    const mockApprovedRequest = {
      _id: reqId,
      userId: customerId,
      status: "APPROVED",
      plan: "MONTHLY",
      amount: 14900,
      utr: "IDEMPOTENT999",
      proStartsAt: new Date("2026-09-01T12:00:00.000Z"),
      proExpiresAt: fixedProExpiresAt,
      save: async function () { return this; }
    };

    let userSaveCalled = false;
    const mockCustomer = {
      _id: customerId,
      name: "Reconciled Customer",
      email: "reconciled@test.com",
      clerkId: "user_clerk_reconciled",
      isPro: true,
      paymentId: "MANUAL_UPI_IDEMPOTENT999",
      proExpiresAt: fixedProExpiresAt,
      save: async function () {
        userSaveCalled = true;
        return this;
      }
    };

    PaymentRequest.findById = async () => mockApprovedRequest;
    User.findById = async () => mockCustomer;

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`);
    assert.equal(res.status, 200);
    assert.equal(res.body.alreadyApproved, true);
    assert.equal(res.body.reconciled, false);
    assert.equal(userSaveCalled, false, "Should not mutate user when entitlement already applied");
    assert.equal(new Date(res.body.user.proExpiresAt).getTime(), fixedProExpiresAt.getTime());
  });

  await t.test("11c. approve: safely handles duplicate key E11000 errors on audit creation", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      status: "APPROVED",
      plan: "MONTHLY",
      amount: 14900,
      utr: "AUDITRACE123",
      proStartsAt: new Date(),
      proExpiresAt: new Date(Date.now() + 30 * 86400000),
      save: async function () { return this; }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Audit Race User",
      email: "audit@test.com",
      clerkId: "user_clerk_audit",
      isPro: true,
      paymentId: "MANUAL_UPI_AUDITRACE123",
      proExpiresAt: new Date(Date.now() + 30 * 86400000),
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    // Simulate duplicate key on audit creation
    PaymentAudit.create = async () => {
      const err = new Error("E11000 duplicate key error collection: paymentaudits index: paymentRequestId_1_action_1 dup key");
      err.code = 11000;
      throw err;
    };

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`);
    assert.equal(res.status, 200);
    assert.equal(res.body.alreadyApproved, true);
  });

  await t.test("12. approve: rejects REJECTED payment request with 400 INVALID_STATE_TRANSITION", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = async () => ({
      _id: reqId,
      status: "REJECTED"
    });

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`);
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_STATE_TRANSITION");
  });

  await t.test("13. approve: successfully approves UNDER_REVIEW request and activates 30-day Pro for new user", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "123456789012",
      status: "UNDER_REVIEW",
      save: async function () { return this; }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Customer One",
      email: "customer1@test.com",
      clerkId: "user_clerk_customer1",
      isPro: false,
      proExpiresAt: null,
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    let auditRecords = [];
    PaymentAudit.create = async (records) => {
      auditRecords.push(...(Array.isArray(records) ? records : [records]));
      return records;
    };

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/approve`)
      .send({ adminNote: "Verified against HDFC statement" });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.isPro, true);
    assert.equal(res.body.user.plan, "MONTHLY");
    assert.ok(res.body.user.proExpiresAt);
    assert.equal(mockRequest.status, "APPROVED");
    assert.equal(mockRequest.adminNote, "Verified against HDFC statement");
    assert.equal(mockCustomer.paymentId, "MANUAL_UPI_123456789012");

    // Verify 2 audits were created: STATUS_CHANGED_APPROVED and PRO_ENTITLEMENT_ACTIVATED
    const approvedAudit = auditRecords.find(a => a.action === "STATUS_CHANGED_APPROVED");
    const entitlementAudit = auditRecords.find(a => a.action === "PRO_ENTITLEMENT_ACTIVATED");
    assert.ok(approvedAudit, "STATUS_CHANGED_APPROVED audit must be created");
    assert.ok(entitlementAudit, "PRO_ENTITLEMENT_ACTIVATED audit must be created");
  });

  await t.test("14. approve: extends from existing future expiration for active Pro renewal", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const futureExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days remaining

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      plan: "YEARLY",
      amount: 99900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "999888777666",
      status: "UNDER_REVIEW",
      save: async function () { return this; }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Customer Pro",
      email: "pro@test.com",
      clerkId: "user_clerk_pro",
      isPro: true,
      proExpiresAt: futureExpiry,
      proSince: new Date("2026-01-01"),
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    PaymentAudit.create = async () => {};

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/approve`)
      .send({});

    assert.equal(res.status, 200);
    assert.equal(res.body.user.isPro, true);
    assert.equal(res.body.user.plan, "YEARLY");

    const expectedExpiryMs = futureExpiry.getTime() + (365 * 24 * 60 * 60 * 1000);
    const actualExpiryMs = new Date(res.body.user.proExpiresAt).getTime();
    assert.ok(Math.abs(actualExpiryMs - expectedExpiryMs) < 2000, "Should extend exactly 365 days from future expiry");
  });

  // ==========================================
  // SECTION 6: reject (State & Rejection Reason)
  // ==========================================

  await t.test("15. reject: requires non-empty rejectionReason (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/reject`)
      .send({ rejectionReason: "   " });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "REJECTION_REASON_REQUIRED");
  });

  await t.test("16. reject: successfully rejects UNDER_REVIEW request without altering Pro entitlement", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "123456789012",
      status: "UNDER_REVIEW",
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;

    let auditCreated = null;
    PaymentAudit.create = async (audit) => {
      auditCreated = audit;
      return audit;
    };

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/reject`)
      .send({ rejectionReason: "UTR not found in bank statement" });

    assert.equal(res.status, 200);
    assert.equal(mockRequest.status, "REJECTED");
    assert.equal(mockRequest.rejectionReason, "UTR not found in bank statement");
    assert.ok(auditCreated);
    assert.equal(auditCreated.action, "STATUS_CHANGED_REJECTED");
    assert.equal(auditCreated.note, "UTR not found in bank statement");
  });

  // ==========================================
  // SECTION 7: requestInfo (State Transition to NEEDS_MORE_INFO)
  // ==========================================

  await t.test("17. requestInfo: requires non-empty adminNote (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/request-info`)
      .send({ adminNote: "" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "ADMIN_NOTE_REQUIRED");
  });

  await t.test("18. requestInfo: transitions UNDER_REVIEW to NEEDS_MORE_INFO with adminNote", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "123456789012",
      status: "UNDER_REVIEW",
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;

    let auditCreated = null;
    PaymentAudit.create = async (audit) => {
      auditCreated = audit;
      return audit;
    };

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/request-info`)
      .send({ adminNote: "Please upload a clearer screenshot showing the complete UTR number." });

    assert.equal(res.status, 200);
    assert.equal(mockRequest.status, "NEEDS_MORE_INFO");
    assert.equal(mockRequest.adminNote, "Please upload a clearer screenshot showing the complete UTR number.");
    assert.ok(auditCreated);
    assert.equal(auditCreated.action, "STATUS_CHANGED_NEEDS_MORE_INFO");
  });
});
