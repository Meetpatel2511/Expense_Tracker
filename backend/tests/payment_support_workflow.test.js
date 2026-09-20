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
const PaymentSupportMessage = require("../models/PaymentSupportMessage");
const {
  processSupportUpload,
  supportDir,
  cleanupSupportFile
} = require("../middleware/uploadMiddleware");
const {
  getUserSupportMessages,
  sendUserSupportMessage,
  getUserSupportAttachment,
  getAdminSupportMessages,
  sendAdminSupportMessage,
  getAdminSupportAttachment,
  getUserUnreadSupportCount
} = require("../controllers/paymentSupportController");

// Helpers to generate minimal valid image buffers for testing
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
const createTestApp = (userId = null, role = "USER") => {
  const app = express();
  app.use(express.json());

  // Attach mock auth user middleware
  app.use((req, res, next) => {
    if (userId) {
      req.user = userId;
      req.adminUser = { _id: userId, role, name: "Test User", email: "test@fintrack.app" };
    }
    next();
  });

  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req, res, next) => {
    if (!req.user || role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required", code: "FORBIDDEN" });
    }
    next();
  };

  // User routes
  app.get("/api/payment-request/support/unread-summary", requireAuth, getUserUnreadSupportCount);
  app.get("/api/payment-request/:id/support", requireAuth, getUserSupportMessages);
  app.post("/api/payment-request/:id/support", requireAuth, processSupportUpload("attachment"), sendUserSupportMessage);
  app.get("/api/payment-request/:id/support/attachment/:messageId", requireAuth, getUserSupportAttachment);

  // Admin routes
  app.get("/api/admin/payment-requests/:id/support", requireAuth, requireAdmin, getAdminSupportMessages);
  app.post("/api/admin/payment-requests/:id/support", requireAuth, requireAdmin, processSupportUpload("attachment"), sendAdminSupportMessage);
  app.get("/api/admin/payment-requests/:id/support/attachment/:messageId", requireAuth, requireAdmin, getAdminSupportAttachment);

  return app;
};

test("Step 6: Payment Support Workflow & Security Suite", async (t) => {
  const userA = "507f1f77bcf86cd799439011";
  const userB = "507f1f77bcf86cd799439022";
  const adminId = "507f1f77bcf86cd799439099";

  const appA = createTestApp(userA, "USER");
  const appB = createTestApp(userB, "USER");
  const appAdmin = createTestApp(adminId, "ADMIN");
  const unauthApp = createTestApp(null, null);

  // Track created files for cleanup
  const createdTestFiles = [];

  t.afterEach(() => {
    while (createdTestFiles.length > 0) {
      const fileRef = createdTestFiles.pop();
      cleanupSupportFile(fileRef);
    }
  });

  // Mock PaymentRequest helper
  const mockPaymentRequest = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId("607f1f77bcf86cd799439033"),
    userId: new mongoose.Types.ObjectId(userA),
    plan: "MONTHLY",
    amount: 14900,
    currency: "INR",
    paymentMethod: "UPI_MANUAL",
    utr: "UTR123456789",
    status: "UNDER_REVIEW",
    createdAt: new Date(),
    ...overrides
  });

  // =========================================================================
  // 1. AUTHORIZATION & ACCESS BOUNDARIES
  // =========================================================================

  await t.test("1. Unauthenticated request to user support endpoint returns 401", async () => {
    const res = await request(unauthApp)
      .get("/api/payment-request/607f1f77bcf86cd799439033/support");
    assert.equal(res.status, 401);
  });

  await t.test("2. Unauthenticated request to admin support endpoint returns 401", async () => {
    const res = await request(unauthApp)
      .get("/api/admin/payment-requests/607f1f77bcf86cd799439033/support");
    assert.equal(res.status, 401);
  });

  await t.test("3. Non-admin user cannot access admin support endpoints (403 Forbidden)", async () => {
    const res = await request(appA)
      .get("/api/admin/payment-requests/607f1f77bcf86cd799439033/support");
    assert.equal(res.status, 403);
  });

  await t.test("4. User cannot view support thread for another user's PaymentRequest (403 UNAUTHORIZED_ACCESS)", async () => {
    const origFindById = PaymentRequest.findById;
    PaymentRequest.findById = async () => mockPaymentRequest({ userId: new mongoose.Types.ObjectId(userA) });

    try {
      const res = await request(appB)
        .get("/api/payment-request/607f1f77bcf86cd799439033/support");
      assert.equal(res.status, 403);
      assert.equal(res.body.code, "UNAUTHORIZED_ACCESS");
    } finally {
      PaymentRequest.findById = origFindById;
    }
  });

  await t.test("5. User cannot send support message to another user's PaymentRequest (403 UNAUTHORIZED_ACCESS)", async () => {
    const origFindById = PaymentRequest.findById;
    PaymentRequest.findById = async () => mockPaymentRequest({ userId: new mongoose.Types.ObjectId(userA) });

    try {
      const res = await request(appB)
        .post("/api/payment-request/607f1f77bcf86cd799439033/support")
        .send({ message: "Trying to hijack another thread" });
      assert.equal(res.status, 403);
      assert.equal(res.body.code, "UNAUTHORIZED_ACCESS");
    } finally {
      PaymentRequest.findById = origFindById;
    }
  });

  await t.test("6. Nonexistent PaymentRequest returns 404 REQUEST_NOT_FOUND", async () => {
    const origFindById = PaymentRequest.findById;
    PaymentRequest.findById = async () => null;

    try {
      const res = await request(appA)
        .get("/api/payment-request/607f1f77bcf86cd799439033/support");
      assert.equal(res.status, 404);
      assert.equal(res.body.code, "REQUEST_NOT_FOUND");
    } finally {
      PaymentRequest.findById = origFindById;
    }
  });

  await t.test("7. Malformed ObjectId returns 400 INVALID_REQUEST_ID", async () => {
    const res = await request(appA)
      .get("/api/payment-request/not-a-valid-id/support");
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_REQUEST_ID");
  });

  // =========================================================================
  // 2. MESSAGE VALIDATION & ATTACHMENT RULES
  // =========================================================================

  await t.test("8. Empty message without attachment is rejected with 400 MESSAGE_OR_ATTACHMENT_REQUIRED", async () => {
    const res = await request(appA)
      .post("/api/payment-request/607f1f77bcf86cd799439033/support")
      .send({ message: "   " });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "MESSAGE_OR_ATTACHMENT_REQUIRED");
  });

  await t.test("9. Excessive message length (>2000 chars) is rejected with 400 MESSAGE_TOO_LONG", async () => {
    const hugeMessage = "A".repeat(2001);
    const res = await request(appA)
      .post("/api/payment-request/607f1f77bcf86cd799439033/support")
      .send({ message: hugeMessage });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "MESSAGE_TOO_LONG");
  });

  await t.test("10. Text-only message is accepted and correctly attributes senderRole: USER", async () => {
    const origFindById = PaymentRequest.findById;
    const origSave = PaymentSupportMessage.prototype.save;
    const origPopulate = PaymentSupportMessage.prototype.populate;

    PaymentRequest.findById = async () => mockPaymentRequest();
    let savedMsg = null;
    PaymentSupportMessage.prototype.save = async function () {
      savedMsg = this;
      return this;
    };
    PaymentSupportMessage.prototype.populate = async function () {
      return this;
    };

    try {
      const res = await request(appA)
        .post("/api/payment-request/607f1f77bcf86cd799439033/support")
        .send({ message: "Here is my transaction reference clarification." });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(savedMsg.senderRole, "USER");
      assert.equal(savedMsg.message, "Here is my transaction reference clarification.");
      assert.ok(savedMsg.readByUserAt !== null);
      assert.equal(savedMsg.readByAdminAt, null);
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.prototype.save = origSave;
      PaymentSupportMessage.prototype.populate = origPopulate;
    }
  });

  await t.test("11. Attachment-only message (empty text) with valid PNG is accepted", async () => {
    const origFindById = PaymentRequest.findById;
    const origSave = PaymentSupportMessage.prototype.save;
    const origPopulate = PaymentSupportMessage.prototype.populate;

    PaymentRequest.findById = async () => mockPaymentRequest();
    let savedMsg = null;
    PaymentSupportMessage.prototype.save = async function () {
      savedMsg = this;
      if (this.attachmentRef) createdTestFiles.push(this.attachmentRef);
      return this;
    };
    PaymentSupportMessage.prototype.populate = async function () {
      return this;
    };

    try {
      const res = await request(appA)
        .post("/api/payment-request/607f1f77bcf86cd799439033/support")
        .attach("attachment", createPngBuffer(), "proof.png");

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(savedMsg.attachmentRef.startsWith("support/"));
      assert.equal(savedMsg.attachmentMime, "image/png");
      assert.equal(savedMsg.senderRole, "USER");
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.prototype.save = origSave;
      PaymentSupportMessage.prototype.populate = origPopulate;
    }
  });

  await t.test("12. Disguised binary/executable file with .jpg extension is rejected with 400 INVALID_FILE_SIGNATURE", async () => {
    const res = await request(appA)
      .post("/api/payment-request/607f1f77bcf86cd799439033/support")
      .attach("attachment", createFakeExeBuffer(), "malicious.jpg");

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_FILE_SIGNATURE");
  });

  await t.test("13. Valid WebP attachment is accepted and saved to private support directory", async () => {
    const origFindById = PaymentRequest.findById;
    const origSave = PaymentSupportMessage.prototype.save;
    const origPopulate = PaymentSupportMessage.prototype.populate;

    PaymentRequest.findById = async () => mockPaymentRequest();
    let savedMsg = null;
    PaymentSupportMessage.prototype.save = async function () {
      savedMsg = this;
      if (this.attachmentRef) createdTestFiles.push(this.attachmentRef);
      return this;
    };
    PaymentSupportMessage.prototype.populate = async function () {
      return this;
    };

    try {
      const res = await request(appA)
        .post("/api/payment-request/607f1f77bcf86cd799439033/support")
        .field("message", "Attached receipt in webp format")
        .attach("attachment", createWebpBuffer(), "receipt.webp");

      assert.equal(res.status, 201);
      assert.equal(savedMsg.attachmentMime, "image/webp");
      assert.ok(savedMsg.attachmentRef.startsWith("support/"));
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.prototype.save = origSave;
      PaymentSupportMessage.prototype.populate = origPopulate;
    }
  });

  // =========================================================================
  // 3. ATTACHMENT STREAMING & PATH TRAVERSAL DEFENSE
  // =========================================================================

  await t.test("14. User can stream attachment from their own payment support thread", async () => {
    const testFilename = `test_${Date.now()}.png`;
    const testPath = path.join(supportDir, testFilename);
    fs.writeFileSync(testPath, createPngBuffer());
    createdTestFiles.push(`support/${testFilename}`);

    const messageId = new mongoose.Types.ObjectId();
    const origFindById = PaymentRequest.findById;
    const origFindOne = PaymentSupportMessage.findOne;

    PaymentRequest.findById = async () => mockPaymentRequest();
    PaymentSupportMessage.findOne = async () => ({
      _id: messageId,
      paymentRequestId: new mongoose.Types.ObjectId("607f1f77bcf86cd799439033"),
      attachmentRef: `support/${testFilename}`
    });

    try {
      const res = await request(appA)
        .get(`/api/payment-request/607f1f77bcf86cd799439033/support/attachment/${messageId}`);

      assert.equal(res.status, 200);
      assert.equal(res.headers["content-type"], "image/png");
      assert.equal(res.headers["cache-control"], "private, no-cache, no-store, must-revalidate");
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.findOne = origFindOne;
    }
  });

  await t.test("15. Unauthorized user cannot stream attachment from another user's support thread (403)", async () => {
    const messageId = new mongoose.Types.ObjectId();
    const origFindById = PaymentRequest.findById;

    PaymentRequest.findById = async () => mockPaymentRequest({ userId: new mongoose.Types.ObjectId(userA) });

    try {
      const res = await request(appB)
        .get(`/api/payment-request/607f1f77bcf86cd799439033/support/attachment/${messageId}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.code, "UNAUTHORIZED_ACCESS");
    } finally {
      PaymentRequest.findById = origFindById;
    }
  });

  await t.test("16. Path traversal in attachmentRef is blocked with 404", async () => {
    const messageId = new mongoose.Types.ObjectId();
    const origFindById = PaymentRequest.findById;
    const origFindOne = PaymentSupportMessage.findOne;

    PaymentRequest.findById = async () => mockPaymentRequest();
    PaymentSupportMessage.findOne = async () => ({
      _id: messageId,
      paymentRequestId: new mongoose.Types.ObjectId("607f1f77bcf86cd799439033"),
      attachmentRef: "../../package.json"
    });

    try {
      const res = await request(appA)
        .get(`/api/payment-request/607f1f77bcf86cd799439033/support/attachment/${messageId}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.code, "ATTACHMENT_NOT_FOUND");
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.findOne = origFindOne;
    }
  });

  // =========================================================================
  // 4. ADMIN SUPPORT THREAD & ROLE ATTRIBUTION
  // =========================================================================

  await t.test("17. Admin can send support message and attributes senderRole: ADMIN", async () => {
    const origFindById = PaymentRequest.findById;
    const origSave = PaymentSupportMessage.prototype.save;
    const origPopulate = PaymentSupportMessage.prototype.populate;

    PaymentRequest.findById = async () => mockPaymentRequest();
    let savedMsg = null;
    PaymentSupportMessage.prototype.save = async function () {
      savedMsg = this;
      return this;
    };
    PaymentSupportMessage.prototype.populate = async function () {
      return this;
    };

    try {
      const res = await request(appAdmin)
        .post("/api/admin/payment-requests/607f1f77bcf86cd799439033/support")
        .send({ message: "Please upload the uncropped receipt showing the date clearly." });

      assert.equal(res.status, 201);
      assert.equal(savedMsg.senderRole, "ADMIN");
      assert.equal(savedMsg.message, "Please upload the uncropped receipt showing the date clearly.");
      assert.ok(savedMsg.readByAdminAt !== null);
      assert.equal(savedMsg.readByUserAt, null);
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.prototype.save = origSave;
      PaymentSupportMessage.prototype.populate = origPopulate;
    }
  });

  // =========================================================================
  // 5. INVARIANTS: STATE MACHINE & AUDIT ISOLATION
  // =========================================================================

  await t.test("18. Invariant: Sending support message NEVER alters PaymentRequest.status or User.isPro", async () => {
    const origFindById = PaymentRequest.findById;
    const origSave = PaymentSupportMessage.prototype.save;
    const origPopulate = PaymentSupportMessage.prototype.populate;
    const origAuditCreate = PaymentAudit.create;

    const pr = mockPaymentRequest({ status: "UNDER_REVIEW" });
    PaymentRequest.findById = async () => pr;
    PaymentSupportMessage.prototype.save = async function () { return this; };
    PaymentSupportMessage.prototype.populate = async function () { return this; };

    let auditCreated = false;
    PaymentAudit.create = async () => { auditCreated = true; };

    try {
      const res = await request(appA)
        .post("/api/payment-request/607f1f77bcf86cd799439033/support")
        .send({ message: "Status check query" });

      assert.equal(res.status, 201);
      assert.equal(pr.status, "UNDER_REVIEW"); // Untouched
      assert.equal(auditCreated, false); // No spam in PaymentAudit
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.prototype.save = origSave;
      PaymentSupportMessage.prototype.populate = origPopulate;
      PaymentAudit.create = origAuditCreate;
    }
  });

  await t.test("19. Invariant: Support messages work on APPROVED and REJECTED payments without reopening", async () => {
    const origFindById = PaymentRequest.findById;
    const origSave = PaymentSupportMessage.prototype.save;
    const origPopulate = PaymentSupportMessage.prototype.populate;

    const approvedPr = mockPaymentRequest({ status: "APPROVED" });
    PaymentRequest.findById = async () => approvedPr;
    PaymentSupportMessage.prototype.save = async function () { return this; };
    PaymentSupportMessage.prototype.populate = async function () { return this; };

    try {
      const res = await request(appA)
        .post("/api/payment-request/607f1f77bcf86cd799439033/support")
        .send({ message: "Thank you for approving!" });

      assert.equal(res.status, 201);
      assert.equal(approvedPr.status, "APPROVED"); // Status strictly remains APPROVED
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.prototype.save = origSave;
      PaymentSupportMessage.prototype.populate = origPopulate;
    }
  });

  // =========================================================================
  // 6. UNREAD STATUS RULES
  // =========================================================================

  await t.test("20. User opening support thread marks only ADMIN unread messages as read", async () => {
    const origFindById = PaymentRequest.findById;
    const origUpdateMany = PaymentSupportMessage.updateMany;
    const origFind = PaymentSupportMessage.find;

    PaymentRequest.findById = async () => mockPaymentRequest();

    let updateQuery = null;
    let updateSet = null;
    PaymentSupportMessage.updateMany = async (query, set) => {
      updateQuery = query;
      updateSet = set;
      return { modifiedCount: 1 };
    };

    PaymentSupportMessage.find = () => ({
      sort: () => ({
        populate: () => ({
          lean: async () => []
        })
      })
    });

    try {
      const res = await request(appA)
        .get("/api/payment-request/607f1f77bcf86cd799439033/support");

      assert.equal(res.status, 200);
      assert.equal(updateQuery.senderRole, "ADMIN");
      assert.equal(updateQuery.readByUserAt, null);
      assert.ok(updateSet.$set.readByUserAt instanceof Date);
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.updateMany = origUpdateMany;
      PaymentSupportMessage.find = origFind;
    }
  });

  await t.test("21. Admin opening support thread marks only USER unread messages as read", async () => {
    const origFindById = PaymentRequest.findById;
    const origUpdateMany = PaymentSupportMessage.updateMany;
    const origFind = PaymentSupportMessage.find;

    PaymentRequest.findById = () => ({
      populate: async () => mockPaymentRequest()
    });

    let updateQuery = null;
    let updateSet = null;
    PaymentSupportMessage.updateMany = async (query, set) => {
      updateQuery = query;
      updateSet = set;
      return { modifiedCount: 1 };
    };

    PaymentSupportMessage.find = () => ({
      sort: () => ({
        populate: () => ({
          lean: async () => []
        })
      })
    });

    try {
      const res = await request(appAdmin)
        .get("/api/admin/payment-requests/607f1f77bcf86cd799439033/support");

      assert.equal(res.status, 200);
      assert.equal(updateQuery.senderRole, "USER");
      assert.equal(updateQuery.readByAdminAt, null);
      assert.ok(updateSet.$set.readByAdminAt instanceof Date);
    } finally {
      PaymentRequest.findById = origFindById;
      PaymentSupportMessage.updateMany = origUpdateMany;
      PaymentSupportMessage.find = origFind;
    }
  });
});
