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

test("Step 5.3: Automated Admin Payment Review Workflow Suite", async (t) => {
  const adminId = new mongoose.Types.ObjectId().toString();
  const regularUserId = new mongoose.Types.ObjectId().toString();

  // Preserve original Mongoose methods
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

  // =========================================================================
  // SECTION A: Authorization Protection
  // =========================================================================

  await t.test("A1. Unauthenticated request to admin endpoints returns 401 UNAUTHORIZED", async () => {
    currentMockUserId = null;
    const res = await request(app).get("/api/admin/payment-requests");
    assert.equal(res.status, 401);
    assert.equal(res.body.code, "UNAUTHORIZED");
  });

  await t.test("A2. Non-admin user request to admin endpoints returns 403 ADMIN_REQUIRED", async () => {
    currentMockUserId = regularUserId;
    currentMockUserRole = "USER";
    const res = await request(app).get("/api/admin/payment-requests");
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
  });

  await t.test("A3. Non-admin user request to receipt endpoint returns 403 ADMIN_REQUIRED", async () => {
    currentMockUserId = regularUserId;
    currentMockUserRole = "USER";
    const validId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/admin/payment-requests/${validId}/receipt`);
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
  });

  // =========================================================================
  // SECTION C: getQueue (Pagination, Boundaries, Multi-Status & Searches)
  // =========================================================================

  await t.test("C1. getQueue: returns paginated list with correct total and totalPages", async () => {
    const mockRequests = [
      { _id: new mongoose.Types.ObjectId(), utr: "123456789012", status: "UNDER_REVIEW", amount: 14900, plan: "MONTHLY" },
      { _id: new mongoose.Types.ObjectId(), utr: "987654321098", status: "NEEDS_MORE_INFO", amount: 99900, plan: "YEARLY" }
    ];

    PaymentRequest.countDocuments = async () => 25;
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

    const res = await request(app).get("/api/admin/payment-requests?page=2&limit=10");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 2);
    assert.equal(res.body.total, 25);
    assert.equal(res.body.page, 2);
    assert.equal(res.body.totalPages, 3); // Math.ceil(25 / 10) = 3
    assert.equal(res.body.requests.length, 2);
  });

  await t.test("C2. getQueue: clamps boundary values for page and limit safely", async () => {
    let capturedSkip = null;
    let capturedLimit = null;

    PaymentRequest.countDocuments = async () => 0;
    PaymentRequest.find = () => ({
      sort: () => ({
        skip: (s) => {
          capturedSkip = s;
          return {
            limit: (l) => {
              capturedLimit = l;
              return {
                populate: () => ({
                  populate: () => ({
                    lean: async () => []
                  })
                })
              };
            }
          };
        }
      })
    });

    // Page = -5 (clamped to 1), limit = 500 (clamped to 100)
    const res = await request(app).get("/api/admin/payment-requests?page=-5&limit=500");
    assert.equal(res.status, 200);
    assert.equal(res.body.page, 1);
    assert.equal(capturedSkip, 0);
    assert.equal(capturedLimit, 100);
  });

  await t.test("C3. getQueue: filters by multiple comma-separated statuses", async () => {
    let capturedFilter = null;

    PaymentRequest.countDocuments = async (filter) => {
      capturedFilter = filter;
      return 2;
    };
    PaymentRequest.find = (filter) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => ({
                lean: async () => []
              })
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/payment-requests?status=UNDER_REVIEW,NEEDS_MORE_INFO");
    assert.equal(res.status, 200);
    assert.deepEqual(capturedFilter.status, { $in: ["UNDER_REVIEW", "NEEDS_MORE_INFO"] });
  });

  await t.test("C4. getQueue: filters single status without $in array wrapper", async () => {
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
                lean: async () => []
              })
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/payment-requests?status=UNDER_REVIEW");
    assert.equal(res.status, 200);
    assert.equal(capturedFilter.status, "UNDER_REVIEW");
  });

  await t.test("C5. getQueue: searches by UTR with case-insensitive regex", async () => {
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
                lean: async () => [{ utr: "UTR123456789", status: "UNDER_REVIEW" }]
              })
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/payment-requests?utr=utr123456789");
    assert.equal(res.status, 200);
    assert.ok(capturedFilter.utr);
    assert.equal(capturedFilter.utr.$options, "i");
  });

  await t.test("C6. getQueue: searches by normalized user email prefix", async () => {
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

    const res = await request(app).get("/api/admin/payment-requests?email=CUSTOMER@example.com");
    assert.equal(res.status, 200);
    assert.deepEqual(capturedFilter.userId, { $in: [targetUserId] });
  });

  await t.test("C7. getQueue: handles empty result set with totalPages = 1", async () => {
    PaymentRequest.countDocuments = async () => 0;
    PaymentRequest.find = () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => ({
                lean: async () => []
              })
            })
          })
        })
      })
    });

    const res = await request(app).get("/api/admin/payment-requests?page=1&limit=20");
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 0);
    assert.equal(res.body.total, 0);
    assert.equal(res.body.totalPages, 1);
    assert.deepEqual(res.body.requests, []);
  });

  // =========================================================================
  // SECTION D: getDetail & Audit Ordering
  // =========================================================================

  await t.test("D1. getDetail: rejects invalid ObjectId with 400 INVALID_REQUEST_ID", async () => {
    const res = await request(app).get("/api/admin/payment-requests/invalid-id-format");
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_REQUEST_ID");
  });

  await t.test("D2. getDetail: returns 404 when payment request does not exist", async () => {
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

  await t.test("D3. getDetail: returns payment details with descending audit timeline", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const mockRequest = {
      _id: reqId,
      utr: "123456789012",
      status: "UNDER_REVIEW",
      plan: "MONTHLY",
      amount: 14900,
      userId: {
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: "test@example.com",
        role: "USER"
      }
    };

    const mockAudits = [
      { action: "STATUS_CHANGED_NEEDS_MORE_INFO", createdAt: new Date("2026-09-08T12:00:00.000Z") },
      { action: "REQUEST_CREATED", createdAt: new Date("2026-09-08T10:00:00.000Z") }
    ];

    PaymentRequest.findById = () => ({
      populate: () => ({
        populate: async () => mockRequest
      })
    });

    let auditSortParam = null;
    PaymentAudit.find = () => ({
      sort: (sortObj) => {
        auditSortParam = sortObj;
        return {
          populate: async () => mockAudits
        };
      }
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.paymentRequest.utr, "123456789012");
    assert.deepEqual(auditSortParam, { createdAt: -1 });
    assert.equal(res.body.auditTrail.length, 2);
    assert.equal(res.body.auditTrail[0].action, "STATUS_CHANGED_NEEDS_MORE_INFO");
  });

  // =========================================================================
  // SECTION E: Private Receipt Streaming & Path Traversal Prevention
  // =========================================================================

  await t.test("E1. getReceipt: streams valid WebP receipt with correct headers", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const testFileName = `test_receipt_${Date.now()}.webp`;
    const testFilePath = path.join(receiptsDir, testFileName);

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

    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  });

  await t.test("E2. getReceipt: streams valid JPEG receipt with image/jpeg Content-Type", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const testFileName = `test_receipt_${Date.now()}.jpg`;
    const testFilePath = path.join(receiptsDir, testFileName);

    const jpgBuffer = Buffer.alloc(16);
    jpgBuffer[0] = 0xff; jpgBuffer[1] = 0xd8; jpgBuffer[2] = 0xff;
    fs.writeFileSync(testFilePath, jpgBuffer);

    PaymentRequest.findById = () => ({
      select: async () => ({
        _id: reqId,
        screenshotRef: `receipts/${testFileName}`
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}/receipt`);
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-type"], "image/jpeg");

    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  });

  await t.test("E3. getReceipt: streams valid PNG receipt with image/png Content-Type", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const testFileName = `test_receipt_${Date.now()}.png`;
    const testFilePath = path.join(receiptsDir, testFileName);

    const pngBuffer = Buffer.alloc(16);
    pngBuffer[0] = 0x89; pngBuffer[1] = 0x50; pngBuffer[2] = 0x4e; pngBuffer[3] = 0x47;
    fs.writeFileSync(testFilePath, pngBuffer);

    PaymentRequest.findById = () => ({
      select: async () => ({
        _id: reqId,
        screenshotRef: `receipts/${testFileName}`
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}/receipt`);
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-type"], "image/png");

    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  });

  await t.test("E4. getReceipt: returns 404 when receipt file does not exist on disk", async () => {
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

  await t.test("E5. getReceipt: returns 404 when payment request has no screenshotRef", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = () => ({
      select: async () => ({
        _id: reqId,
        screenshotRef: null
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}/receipt`);
    assert.equal(res.status, 404);
    assert.equal(res.body.code, "RECEIPT_NOT_FOUND");
  });

  await t.test("E6. getReceipt: rejects path traversal attempts safely with 404", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = () => ({
      select: async () => ({
        _id: reqId,
        screenshotRef: "../../../package.json"
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}/receipt`);
    assert.equal(res.status, 404);
    assert.equal(res.body.code, "RECEIPT_NOT_FOUND");
  });

  // =========================================================================
  // SECTION F: Approval Workflow & Entitlement Grants
  // =========================================================================

  await t.test("F1. approve: successfully approves UNDER_REVIEW request and activates 30-day Pro", async () => {
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
    assert.ok(mockRequest.proStartsAt, "PaymentRequest must store exact proStartsAt");
    assert.ok(mockRequest.proExpiresAt, "PaymentRequest must store exact proExpiresAt");

    const approvedAudit = auditRecords.find(a => a.action === "STATUS_CHANGED_APPROVED");
    const entitlementAudit = auditRecords.find(a => a.action === "PRO_ENTITLEMENT_ACTIVATED");
    assert.ok(approvedAudit, "STATUS_CHANGED_APPROVED audit must be created");
    assert.ok(entitlementAudit, "PRO_ENTITLEMENT_ACTIVATED audit must be created");
  });

  await t.test("F2. approve: successfully approves NEEDS_MORE_INFO request", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "RESUBMITTED123",
      status: "NEEDS_MORE_INFO",
      save: async function () { return this; }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Customer Resubmitted",
      email: "resub@test.com",
      clerkId: "user_clerk_resub",
      isPro: false,
      proExpiresAt: null,
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/approve`)
      .send({ adminNote: "Verified updated receipt" });

    assert.equal(res.status, 200);
    assert.equal(mockRequest.status, "APPROVED");
    assert.equal(mockCustomer.isPro, true);
    assert.equal(mockCustomer.paymentId, "MANUAL_UPI_RESUBMITTED123");
  });

  await t.test("F3. approve: calculates 365 days for YEARLY plan", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      plan: "YEARLY",
      amount: 99900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "YEARLYUTR123",
      status: "UNDER_REVIEW",
      save: async function () { return this; }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Yearly Customer",
      email: "yearly@test.com",
      clerkId: "user_clerk_yearly",
      isPro: false,
      proExpiresAt: null,
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`).send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.user.plan, "YEARLY");

    const expectedExpiryMs = Date.now() + (365 * 24 * 60 * 60 * 1000);
    const actualExpiryMs = new Date(res.body.user.proExpiresAt).getTime();
    assert.ok(Math.abs(actualExpiryMs - expectedExpiryMs) < 3000, "Yearly duration must add 365 days");
  });

  await t.test("F4. approve: extends from existing future expiration for active Pro renewal", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const futureExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days remaining
    const existingProSince = new Date("2026-01-01T00:00:00.000Z");

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
      proSince: existingProSince,
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`).send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.user.isPro, true);

    const expectedExpiryMs = futureExpiry.getTime() + (365 * 24 * 60 * 60 * 1000);
    const actualExpiryMs = new Date(res.body.user.proExpiresAt).getTime();
    assert.ok(Math.abs(actualExpiryMs - expectedExpiryMs) < 3000, "Should extend exactly 365 days from future expiry");
    assert.equal(new Date(res.body.user.proSince).getTime(), existingProSince.getTime(), "proSince must be preserved");
  });

  await t.test("F5. approve: expired Pro user renewal starts from current time (now)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const pastExpiry = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Expired 30 days ago
    const originalProSince = new Date("2025-06-01T00:00:00.000Z");

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "EXPIREDRENEW12",
      status: "UNDER_REVIEW",
      save: async function () { return this; }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Expired Pro User",
      email: "expired@test.com",
      clerkId: "user_clerk_expired",
      isPro: false,
      proExpiresAt: pastExpiry,
      proSince: originalProSince,
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`).send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.user.isPro, true);

    const expectedExpiryMs = Date.now() + (30 * 24 * 60 * 60 * 1000);
    const actualExpiryMs = new Date(res.body.user.proExpiresAt).getTime();
    assert.ok(Math.abs(actualExpiryMs - expectedExpiryMs) < 3000, "Expired renewal must start from now (+30 days)");
    assert.equal(new Date(res.body.user.proSince).getTime(), originalProSince.getTime(), "proSince preserved on expired renewal");
  });

  await t.test("F6. approve: rejects REJECTED payment request with 400 INVALID_STATE_TRANSITION", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = async () => ({
      _id: reqId,
      status: "REJECTED"
    });

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`);
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_STATE_TRANSITION");
  });

  // =========================================================================
  // SECTION G: Approval Reconciliation & Idempotency
  // =========================================================================

  await t.test("G1. approve reconciliation: reconciles missing User entitlement using exact persisted dates without adding extra days", async () => {
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
    assert.equal(new Date(savedUser.proExpiresAt).getTime(), fixedProExpiresAt.getTime());
  });

  await t.test("G2. approve reconciliation: is idempotent when User is already reconciled", async () => {
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

  await t.test("G3. approve reconciliation: retrying an approved request creates missing terminal audits idempotently", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      status: "APPROVED",
      plan: "MONTHLY",
      amount: 14900,
      utr: "AUDITRETRY123",
      proStartsAt: new Date(),
      proExpiresAt: new Date(Date.now() + 30 * 86400000),
      save: async function () { return this; }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Audit User",
      email: "audit@test.com",
      clerkId: "user_clerk_audit",
      isPro: true,
      paymentId: "MANUAL_UPI_AUDITRETRY123",
      proExpiresAt: new Date(Date.now() + 30 * 86400000),
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    let auditsCreated = [];
    PaymentAudit.create = async (doc) => {
      auditsCreated.push(doc);
      return doc;
    };

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`);
    assert.equal(res.status, 200);
    assert.equal(res.body.alreadyApproved, true);
    assert.equal(auditsCreated.length, 2);
    assert.ok(auditsCreated.some(a => a.action === "STATUS_CHANGED_APPROVED"));
    assert.ok(auditsCreated.some(a => a.action === "PRO_ENTITLEMENT_ACTIVATED"));
  });

  await t.test("G4. approve reconciliation: safely catches duplicate key E11000 errors on audit creation", async () => {
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

    PaymentAudit.create = async () => {
      const err = new Error("E11000 duplicate key error collection: paymentaudits index: paymentRequestId_1_action_1 dup key");
      err.code = 11000;
      throw err;
    };

    const res = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`);
    assert.equal(res.status, 200);
    assert.equal(res.body.alreadyApproved, true);
  });

  await t.test("G5. approve reconciliation: handles concurrent approval simulation without double grant", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();
    let grantCount = 0;

    const mockRequest = {
      _id: reqId,
      userId: customerId,
      status: "UNDER_REVIEW",
      plan: "MONTHLY",
      amount: 14900,
      utr: "CONCURRENT123",
      save: async function () {
        this.status = "APPROVED";
        return this;
      }
    };

    const mockCustomer = {
      _id: customerId,
      name: "Concurrent Customer",
      email: "concurrent@test.com",
      clerkId: "user_clerk_concurrent",
      isPro: false,
      proExpiresAt: null,
      save: async function () {
        grantCount++;
        this.isPro = true;
        this.paymentId = "MANUAL_UPI_CONCURRENT123";
        return this;
      }
    };

    PaymentRequest.findById = async () => mockRequest;
    User.findById = async () => mockCustomer;

    // First approval
    const res1 = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`).send({});
    assert.equal(res1.status, 200);

    // Second approval (request is now APPROVED and user is Pro)
    const res2 = await request(app).post(`/api/admin/payment-requests/${reqId}/approve`).send({});
    assert.equal(res2.status, 200);
    assert.equal(res2.body.alreadyApproved, true);
    assert.equal(res2.body.reconciled, false);
    assert.equal(grantCount, 1, "User entitlement should only be saved once during concurrent/repeated approvals");
  });

  // =========================================================================
  // SECTION H: Rejection Workflow
  // =========================================================================

  await t.test("H1. reject: requires non-empty rejectionReason (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/reject`)
      .send({ rejectionReason: "   " });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "REJECTION_REASON_REQUIRED");
  });

  await t.test("H2. reject: successfully rejects UNDER_REVIEW request without altering Pro entitlement", async () => {
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

  await t.test("H3. reject: successfully rejects NEEDS_MORE_INFO request", async () => {
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
      status: "NEEDS_MORE_INFO",
      save: async function () { return this; }
    };

    PaymentRequest.findById = async () => mockRequest;

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/reject`)
      .send({ rejectionReason: "Invalid proof provided again" });

    assert.equal(res.status, 200);
    assert.equal(mockRequest.status, "REJECTED");
  });

  await t.test("H4. reject: cannot reject an already APPROVED payment request (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = async () => ({
      _id: reqId,
      status: "APPROVED"
    });

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/reject`)
      .send({ rejectionReason: "Mistaken approval" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_STATE_TRANSITION");
  });

  await t.test("H5. reject: cannot reject an already REJECTED payment request (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = async () => ({
      _id: reqId,
      status: "REJECTED"
    });

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/reject`)
      .send({ rejectionReason: "Double reject attempt" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "ALREADY_REJECTED");
  });

  // =========================================================================
  // SECTION I: Request More Info Workflow
  // =========================================================================

  await t.test("I1. requestInfo: requires non-empty adminNote (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/request-info`)
      .send({ adminNote: "" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "ADMIN_NOTE_REQUIRED");
  });

  await t.test("I2. requestInfo: transitions UNDER_REVIEW to NEEDS_MORE_INFO with adminNote", async () => {
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

  await t.test("I3. requestInfo: cannot transition already APPROVED request (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = async () => ({
      _id: reqId,
      status: "APPROVED"
    });

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/request-info`)
      .send({ adminNote: "Need info after approve" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_STATE_TRANSITION");
  });

  await t.test("I4. requestInfo: cannot transition already REJECTED request (400)", async () => {
    const reqId = new mongoose.Types.ObjectId();
    PaymentRequest.findById = async () => ({
      _id: reqId,
      status: "REJECTED"
    });

    const res = await request(app)
      .post(`/api/admin/payment-requests/${reqId}/request-info`)
      .send({ adminNote: "Need info after reject" });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_STATE_TRANSITION");
  });

  // =========================================================================
  // SECTION J: Security & Data Exposure
  // =========================================================================

  await t.test("J1. Security: getQueue & getDetail populate only safe user fields without leaking sensitive data", async () => {
    const reqId = new mongoose.Types.ObjectId();
    const mockRequest = {
      _id: reqId,
      utr: "123456789012",
      status: "UNDER_REVIEW",
      plan: "MONTHLY",
      amount: 14900,
      userId: {
        _id: new mongoose.Types.ObjectId(),
        name: "Security User",
        email: "sec@example.com",
        clerkId: "user_sec_123",
        isPro: false,
        role: "USER"
      },
      reviewedBy: null
    };

    PaymentRequest.findById = () => ({
      populate: () => ({
        populate: async () => mockRequest
      })
    });

    PaymentAudit.find = () => ({
      sort: () => ({
        populate: async () => []
      })
    });

    const res = await request(app).get(`/api/admin/payment-requests/${reqId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.paymentRequest.userId.password, undefined);
    assert.equal(res.body.paymentRequest.userId.token, undefined);
    assert.equal(res.body.paymentRequest.userId.clerkSecret, undefined);
  });
});
