process.env.NODE_ENV = "test";
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const PaymentRequest = require("../models/PaymentRequest");
const PaymentAudit = require("../models/PaymentAudit");
const Order = require("../models/Order");

test("Step 3: Payment Database Architecture Suite", async (t) => {

  // ==========================================
  // SECTION 1: PaymentRequest Model & Schema Validation
  // ==========================================

  await t.test("1. PaymentRequest model can be imported successfully", () => {
    assert.ok(PaymentRequest);
    assert.equal(PaymentRequest.modelName, "PaymentRequest");
  });

  await t.test("2. Valid PaymentRequest can be instantiated with valid fields", () => {
    const validDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "123456789012",
      payerUpiId: "User@Okhdfcbank",
      screenshotRef: "receipts/2026/09/sample_proof.webp",
      userNote: "Paid via GPay",
      status: "UNDER_REVIEW"
    });

    const err = validDoc.validateSync();
    assert.equal(err, undefined, "Valid PaymentRequest should pass synchronous schema validation");
    assert.equal(validDoc.plan, "MONTHLY");
    assert.equal(validDoc.amount, 14900);
    assert.equal(validDoc.currency, "INR");
    assert.equal(validDoc.paymentMethod, "UPI_MANUAL");
    assert.equal(validDoc.utr, "123456789012");
    assert.equal(validDoc.payerUpiId, "user@okhdfcbank"); // lowercased
    assert.equal(validDoc.status, "UNDER_REVIEW");
  });

  await t.test("3. Required fields (userId, plan, amount, currency, paymentMethod, status) are enforced", () => {
    const emptyDoc = new PaymentRequest({});
    const err = emptyDoc.validateSync();
    assert.ok(err, "Empty doc must fail validation");
    assert.ok(err.errors["userId"], "userId must be required");
    assert.ok(err.errors["plan"], "plan must be required");
    assert.ok(err.errors["amount"], "amount must be required");
    assert.ok(err.errors["paymentMethod"], "paymentMethod must be required");
  });

  await t.test("4. Plan enum validation allows MONTHLY and YEARLY and rejects others", () => {
    const monthlyDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL"
    });
    assert.equal(monthlyDoc.validateSync(), undefined);

    const yearlyDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "YEARLY",
      amount: 99900,
      currency: "INR",
      paymentMethod: "UPI_QR"
    });
    assert.equal(yearlyDoc.validateSync(), undefined);

    const invalidDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "LIFETIME_FREE",
      amount: 0,
      currency: "INR",
      paymentMethod: "UPI_MANUAL"
    });
    const err = invalidDoc.validateSync();
    assert.ok(err.errors["plan"], "Invalid plan must fail enum validation");
  });

  await t.test("5. Currency validation requires INR and rejects other currencies", () => {
    const usdDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "USD",
      paymentMethod: "UPI_MANUAL"
    });
    const err = usdDoc.validateSync();
    assert.ok(err.errors["currency"], "Non-INR currency must be rejected");
  });

  await t.test("6. paymentMethod enum validation enforces supported methods", () => {
    const validMethods = ["UPI_MANUAL", "UPI_QR", "BANK_TRANSFER"];
    for (const method of validMethods) {
      const doc = new PaymentRequest({
        userId: new mongoose.Types.ObjectId(),
        plan: "MONTHLY",
        amount: 14900,
        currency: "INR",
        paymentMethod: method
      });
      assert.equal(doc.validateSync(), undefined, `Valid method ${method} must pass`);
    }

    const invalidDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "BITCOIN"
    });
    assert.ok(invalidDoc.validateSync().errors["paymentMethod"]);
  });

  await t.test("7. Amount must be a positive integer in paise", () => {
    const validAmounts = [14900, 99900, 100, 1];
    for (const amt of validAmounts) {
      const doc = new PaymentRequest({
        userId: new mongoose.Types.ObjectId(),
        plan: "MONTHLY",
        amount: amt,
        currency: "INR",
        paymentMethod: "UPI_MANUAL"
      });
      assert.equal(doc.validateSync(), undefined, `Valid integer amount ${amt} must pass`);
    }

    const invalidAmounts = [0, -100, -14900, 149.5, 999.99, NaN, "not_a_number"];
    for (const amt of invalidAmounts) {
      const doc = new PaymentRequest({
        userId: new mongoose.Types.ObjectId(),
        plan: "MONTHLY",
        amount: amt,
        currency: "INR",
        paymentMethod: "UPI_MANUAL"
      });
      const err = doc.validateSync();
      assert.ok(err && err.errors["amount"], `Invalid amount ${amt} must fail validation`);
    }
  });

  await t.test("8. Status enum validation enforces exact Step 3 lifecycle states", () => {
    const validStatuses = ["UNDER_REVIEW", "NEEDS_MORE_INFO", "APPROVED", "REJECTED"];
    for (const status of validStatuses) {
      const doc = new PaymentRequest({
        userId: new mongoose.Types.ObjectId(),
        plan: "MONTHLY",
        amount: 14900,
        currency: "INR",
        paymentMethod: "UPI_MANUAL",
        status
      });
      assert.equal(doc.validateSync(), undefined, `Status ${status} must pass validation`);
    }

    const invalidStatuses = ["PENDING_SUBMISSION", "EXPIRED", "PAID", "FAILED", "CREATED"];
    for (const status of invalidStatuses) {
      const doc = new PaymentRequest({
        userId: new mongoose.Types.ObjectId(),
        plan: "MONTHLY",
        amount: 14900,
        currency: "INR",
        paymentMethod: "UPI_MANUAL",
        status
      });
      const err = doc.validateSync();
      assert.ok(err && err.errors["status"], `Status ${status} must be rejected in Step 3`);
    }
  });

  await t.test("9. Default status is UNDER_REVIEW", () => {
    const doc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL"
    });
    assert.equal(doc.status, "UNDER_REVIEW");
  });

  // ==========================================
  // SECTION 2: UTR Normalization & Length Validation
  // ==========================================

  await t.test("10. UTR normalization trims, removes all whitespace, and converts to uppercase", () => {
    const doc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "  ab 12  34 cd  "
    });
    assert.equal(doc.utr, "AB1234CD");
  });

  await t.test("11. UTR static helper normalizeUtr normalizes strings correctly", () => {
    assert.equal(PaymentRequest.normalizeUtr(" 6789 abcd 1234 "), "6789ABCD1234");
    assert.equal(PaymentRequest.normalizeUtr(""), undefined);
    assert.equal(PaymentRequest.normalizeUtr("   "), undefined);
    assert.equal(PaymentRequest.normalizeUtr(null), null);
    assert.equal(PaymentRequest.normalizeUtr(undefined), undefined);
  });

  await t.test("12. UTR length validation enforces between 6 and 30 characters", () => {
    // 6 chars -> valid
    const minDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "123456"
    });
    assert.equal(minDoc.validateSync(), undefined);

    // 30 chars -> valid
    const maxDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "A".repeat(30)
    });
    assert.equal(maxDoc.validateSync(), undefined);

    // 5 chars -> too short
    const shortDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "12345"
    });
    assert.ok(shortDoc.validateSync().errors["utr"]);

    // 31 chars -> too long
    const longDoc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      utr: "A".repeat(31)
    });
    assert.ok(longDoc.validateSync().errors["utr"]);
  });

  await t.test("13. Missing/undefined UTR is allowed", () => {
    const docWithoutUtr = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL"
    });
    assert.equal(docWithoutUtr.validateSync(), undefined);
    assert.equal(docWithoutUtr.utr, undefined);
  });

  await t.test("14. payerUpiId is normalized to lowercase and trimmed", () => {
    const doc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      payerUpiId: "  Patel.Meet@OKAxis  "
    });
    assert.equal(doc.payerUpiId, "patel.meet@okaxis");
  });

  await t.test("15. Text length bounds are enforced for notes, reasons, and screenshot refs", () => {
    const doc = new PaymentRequest({
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      paymentMethod: "UPI_MANUAL",
      userNote: "X".repeat(501),
      adminNote: "Y".repeat(1001),
      rejectionReason: "Z".repeat(501),
      screenshotRef: "S".repeat(501)
    });
    const err = doc.validateSync();
    assert.ok(err.errors["userNote"]);
    assert.ok(err.errors["adminNote"]);
    assert.ok(err.errors["rejectionReason"]);
    assert.ok(err.errors["screenshotRef"]);
  });

  // ==========================================
  // SECTION 3: PaymentAudit Model & Schema Validation
  // ==========================================

  await t.test("16. PaymentAudit model can be imported successfully", () => {
    assert.ok(PaymentAudit);
    assert.equal(PaymentAudit.modelName, "PaymentAudit");
  });

  await t.test("17. Valid PaymentAudit record can be instantiated", () => {
    const audit = new PaymentAudit({
      paymentRequestId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      action: "STATUS_CHANGED_APPROVED",
      previousStatus: "UNDER_REVIEW",
      newStatus: "APPROVED",
      performedBy: new mongoose.Types.ObjectId(),
      performedByRole: "ADMIN",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 Test Agent",
      note: "UTR verified in bank account",
      metadata: { bankTxnId: "TXN12345" }
    });

    assert.equal(audit.validateSync(), undefined);
    assert.equal(audit.action, "STATUS_CHANGED_APPROVED");
    assert.equal(audit.previousStatus, "UNDER_REVIEW");
    assert.equal(audit.newStatus, "APPROVED");
    assert.equal(audit.performedByRole, "ADMIN");
  });

  await t.test("18. Required fields in PaymentAudit are strictly enforced", () => {
    const emptyAudit = new PaymentAudit({});
    const err = emptyAudit.validateSync();
    assert.ok(err);
    assert.ok(err.errors["paymentRequestId"]);
    assert.ok(err.errors["userId"]);
    assert.ok(err.errors["action"]);
    assert.ok(err.errors["performedByRole"]);
  });

  await t.test("19. Action enum validation allows all 9 approved lifecycle actions", () => {
    const validActions = [
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

    for (const action of validActions) {
      const doc = new PaymentAudit({
        paymentRequestId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        action,
        newStatus: "UNDER_REVIEW",
        performedByRole: "SYSTEM"
      });
      assert.equal(doc.validateSync(), undefined, `Action ${action} must pass validation`);
    }

    const invalidDoc = new PaymentAudit({
      paymentRequestId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      action: "UNAUTHORIZED_REFUND",
      performedByRole: "ADMIN"
    });
    assert.ok(invalidDoc.validateSync().errors["action"]);
  });

  await t.test("20. performedByRole validation enforces USER, ADMIN, or SYSTEM", () => {
    for (const role of ["USER", "ADMIN", "SYSTEM"]) {
      const doc = new PaymentAudit({
        paymentRequestId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        action: "REQUEST_CREATED",
        newStatus: "UNDER_REVIEW",
        performedByRole: role
      });
      assert.equal(doc.validateSync(), undefined, `Role ${role} must pass validation`);
    }

    const invalidRole = new PaymentAudit({
      paymentRequestId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      action: "REQUEST_CREATED",
      performedByRole: "SUPER_HACKER"
    });
    assert.ok(invalidRole.validateSync().errors["performedByRole"]);
  });

  await t.test("21. previousStatus and newStatus must conform to valid workflow statuses", () => {
    const doc = new PaymentAudit({
      paymentRequestId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      action: "STATUS_CHANGED_UNDER_REVIEW",
      previousStatus: "INVALID_STATUS",
      newStatus: "ANOTHER_INVALID",
      performedByRole: "ADMIN"
    });
    const err = doc.validateSync();
    assert.ok(err.errors["previousStatus"]);
    assert.ok(err.errors["newStatus"]);
  });

  await t.test("22. PaymentAudit timestamps only configure createdAt (append-only history)", () => {
    const schemaOptions = PaymentAudit.schema.options.timestamps;
    assert.deepEqual(schemaOptions, { createdAt: true, updatedAt: false });
  });

  // ==========================================
  // SECTION 4: Index Configurations
  // ==========================================

  await t.test("23. PaymentRequest indexes are properly configured on the schema", () => {
    const indexes = PaymentRequest.schema.indexes();

    // Index 1: User payment history { userId: 1, createdAt: -1 }
    const userHistoryIndex = indexes.find(idx => idx[0].userId === 1 && idx[0].createdAt === -1);
    assert.ok(userHistoryIndex, "PaymentRequest must have { userId: 1, createdAt: -1 } index");

    // Index 2: Review queue { status: 1, createdAt: 1 }
    const reviewQueueIndex = indexes.find(idx => idx[0].status === 1 && idx[0].createdAt === 1);
    assert.ok(reviewQueueIndex, "PaymentRequest must have { status: 1, createdAt: 1 } index");

    // Index 3: Globally unique UTR index
    const utrIndex = indexes.find(idx => idx[0].utr === 1);
    assert.ok(utrIndex, "PaymentRequest must have { utr: 1 } index");
    assert.equal(utrIndex[1].unique, true, "UTR index must be unique");
    assert.equal(utrIndex[1].sparse, true, "UTR index must be sparse to allow missing UTRs");
  });

  await t.test("24. PaymentAudit indexes are properly configured on the schema", () => {
    const indexes = PaymentAudit.schema.indexes();

    // Index 1: { paymentRequestId: 1, createdAt: -1 }
    const reqHistoryIndex = indexes.find(idx => idx[0].paymentRequestId === 1 && idx[0].createdAt === -1);
    assert.ok(reqHistoryIndex, "PaymentAudit must have { paymentRequestId: 1, createdAt: -1 } index");

    // Index 2: { userId: 1, createdAt: -1 }
    const userHistoryIndex = indexes.find(idx => idx[0].userId === 1 && idx[0].createdAt === -1);
    assert.ok(userHistoryIndex, "PaymentAudit must have { userId: 1, createdAt: -1 } index");

    // Index 3: { performedBy: 1, createdAt: -1 }
    const actorHistoryIndex = indexes.find(idx => idx[0].performedBy === 1 && idx[0].createdAt === -1);
    assert.ok(actorHistoryIndex, "PaymentAudit must have { performedBy: 1, createdAt: -1 } index");
  });

  // ==========================================
  // SECTION 5: Invariant & Coexistence Checks
  // ==========================================

  await t.test("25. Invariant: Neither PaymentRequest nor PaymentAudit schemas contain trial fields", () => {
    const prPaths = Object.keys(PaymentRequest.schema.paths);
    assert.equal(prPaths.includes("trialStartsAt"), false);
    assert.equal(prPaths.includes("trialExpiresAt"), false);
    assert.equal(prPaths.includes("trialUsed"), false);

    const paPaths = Object.keys(PaymentAudit.schema.paths);
    assert.equal(paPaths.includes("trialStartsAt"), false);
    assert.equal(paPaths.includes("trialExpiresAt"), false);
    assert.equal(paPaths.includes("trialUsed"), false);
  });

  await t.test("26. Coexistence: Order model remains completely functional and untouched", () => {
    assert.ok(Order);
    const orderDoc = new Order({
      orderId: "order_test_coexist_123",
      userId: new mongoose.Types.ObjectId(),
      plan: "MONTHLY",
      amount: 14900,
      currency: "INR",
      status: "created"
    });
    assert.equal(orderDoc.validateSync(), undefined);
    assert.equal(orderDoc.plan, "MONTHLY");
    assert.equal(orderDoc.amount, 14900);
  });
});
