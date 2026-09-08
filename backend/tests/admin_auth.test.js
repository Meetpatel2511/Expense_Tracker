process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const User = require("../models/User");
const PaymentAudit = require("../models/PaymentAudit");
const requireAdmin = require("../middleware/requireAdmin");
const bootstrapAdmin = require("../scripts/bootstrapAdmin");

// Shared test express app with dynamic mock user resolution
let currentMockUser = null;
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (currentMockUser) {
    req.user = currentMockUser;
  }
  next();
});

// Admin endpoint exercising requireAdmin middleware
app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({
    isAdmin: true,
    user: {
      _id: req.adminUser._id,
      name: req.adminUser.name,
      email: req.adminUser.email,
      role: req.adminUser.role
    }
  });
});

test("Step 5.1: Backend Role, Bootstrap & Authorization Suite", async (t) => {
  const origFindById = User.findById;
  const origFindOne = User.findOne;

  t.afterEach(() => {
    currentMockUser = null;
    User.findById = origFindById;
    User.findOne = origFindOne;
    delete process.env.ADMIN_EMAILS;
  });

  // ==========================================
  // SECTION 1: User.role Schema Definition
  // ==========================================

  await t.test("1. User.role defaults to 'USER' and has no extra role index", () => {
    const user = new User({ name: "Alice", email: "alice@test.com", clerkId: "user_alice" });
    assert.equal(user.role, "USER");

    // Check enum validity
    const schemaRole = User.schema.path("role");
    assert.ok(schemaRole);
    assert.deepEqual(schemaRole.enumValues, ["USER", "ADMIN"]);

    // Verify no separate role index is added to User schema
    const indexes = User.schema.indexes();
    const hasRoleIndex = indexes.some(([fields]) => fields.role !== undefined);
    assert.equal(hasRoleIndex, false, "User schema must not have an index on role");
  });

  // ==========================================
  // SECTION 2: PaymentAudit Partial Unique Index
  // ==========================================

  await t.test("2. PaymentAudit schema contains partial unique index for terminal approval & activation", () => {
    const indexes = PaymentAudit.schema.indexes();
    const partialAuditIndex = indexes.find(
      ([fields, options]) =>
        fields.paymentRequestId === 1 &&
        fields.action === 1 &&
        options?.unique === true &&
        options?.partialFilterExpression?.action
    );

    assert.ok(partialAuditIndex, "Partial unique index on { paymentRequestId: 1, action: 1 } must exist in schema");
    assert.deepEqual(
      partialAuditIndex[1].partialFilterExpression.action.$in,
      ["STATUS_CHANGED_APPROVED", "PRO_ENTITLEMENT_ACTIVATED"]
    );
  });

  // ==========================================
  // SECTION 3: requireAdmin Middleware
  // ==========================================

  await t.test("3. Unauthenticated request to requireAdmin returns 401 UNAUTHORIZED", async () => {
    currentMockUser = null;
    const res = await request(app).get("/api/admin/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.code, "UNAUTHORIZED");
  });

  await t.test("4. Authenticated non-admin (role 'USER') is rejected with 403 ADMIN_REQUIRED", async () => {
    const regularUserId = new mongoose.Types.ObjectId();
    const regularUser = {
      _id: regularUserId,
      name: "Regular User",
      email: "user@test.com",
      role: "USER"
    };

    User.findById = () => ({
      select: async () => regularUser
    });

    currentMockUser = regularUserId.toString();
    const res = await request(app).get("/api/admin/me");

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
    assert.equal(res.body.message, "Access denied. Administrator privileges required.");
  });

  await t.test("5. Authenticated admin (role 'ADMIN') is granted access with 200 { isAdmin: true }", async () => {
    const adminUserId = new mongoose.Types.ObjectId();
    const adminUser = {
      _id: adminUserId,
      name: "Admin User",
      email: "admin@test.com",
      role: "ADMIN"
    };

    User.findById = () => ({
      select: async () => adminUser
    });

    currentMockUser = adminUserId.toString();
    const res = await request(app).get("/api/admin/me");

    assert.equal(res.status, 200);
    assert.equal(res.body.isAdmin, true);
    assert.equal(res.body.user.email, "admin@test.com");
    assert.equal(res.body.user.role, "ADMIN");
  });

  await t.test("6. requireAdmin never auto-promotes demoted admin matching ADMIN_EMAILS", async () => {
    process.env.ADMIN_EMAILS = "demoted@test.com";

    const demotedUserId = new mongoose.Types.ObjectId();
    let saveCalled = false;
    const demotedUser = {
      _id: demotedUserId,
      name: "Demoted Admin",
      email: "demoted@test.com",
      role: "USER", // Explicitly demoted in DB
      save: async () => { saveCalled = true; }
    };

    User.findById = () => ({
      select: async () => demotedUser
    });

    currentMockUser = demotedUserId.toString();
    const res = await request(app).get("/api/admin/me");

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "ADMIN_REQUIRED");
    assert.equal(saveCalled, false, "requireAdmin must NEVER mutate User.role during API requests");
  });

  // ==========================================
  // SECTION 4: bootstrapAdmin Script Logic
  // ==========================================

  await t.test("7. bootstrapAdmin fails closed when target email is missing", async () => {
    delete process.env.ADMIN_EMAILS;
    const result = await bootstrapAdmin(null);
    assert.equal(result.success, false);
    assert.equal(result.reason, "MISSING_EMAIL");
  });

  await t.test("8. bootstrapAdmin fails closed when target user does not exist in DB", async () => {
    User.findOne = async () => null;
    const result = await bootstrapAdmin("unknown@test.com");
    assert.equal(result.success, false);
    assert.equal(result.reason, "USER_NOT_FOUND");
  });


  await t.test("9. bootstrapAdmin fails closed when target user lacks clerkId", async () => {
    User.findOne = async () => ({
      _id: new mongoose.Types.ObjectId(),
      email: "noclerk@test.com",
      clerkId: null,
      role: "USER"
    });

    const result = await bootstrapAdmin("noclerk@test.com");
    assert.equal(result.success, false);
    assert.equal(result.reason, "MISSING_CLERK_ID");
  });

  await t.test("10. bootstrapAdmin successfully promotes existing verified Clerk user with normalized email", async () => {
    let savedRole = null;
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "target@fintrack.dev",
      clerkId: "user_clerk_verified_123",
      role: "USER",
      save: async function () {
        savedRole = this.role;
        return this;
      }
    };

    User.findOne = async (query) => {
      assert.equal(query.email, "target@fintrack.dev", "Email must be normalized to lowercase & trimmed");
      return mockUser;
    };

    // Pass with whitespace and mixed casing
    const result = await bootstrapAdmin("  Target@FinTrack.DEV  ");
    assert.equal(result.success, true);
    assert.equal(result.promoted, true);
    assert.equal(savedRole, "ADMIN");
  });

  await t.test("11. bootstrapAdmin is idempotent when user is already ADMIN", async () => {
    const mockAdmin = {
      _id: new mongoose.Types.ObjectId(),
      email: "already@admin.com",
      clerkId: "user_admin_999",
      role: "ADMIN"
    };

    User.findOne = async () => mockAdmin;

    const result = await bootstrapAdmin("already@admin.com");
    assert.equal(result.success, true);
    assert.equal(result.alreadyAdmin, true);
  });
});
