const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

const User = require("../models/User");
const Family = require("../models/Family");
const RecurringExpense = require("../models/RecurringExpense");

const { joinFamily, createFamily, getFamilyStats } = require("../controllers/familyController");
const { addRecurringExpense } = require("../controllers/expenseController");

// Helper to create test app with authenticated user
const createTestApp = (userId = "507f1f77bcf86cd799439011") => {
  const testApp = express();
  testApp.use(express.json());

  testApp.use((req, res, next) => {
    req.user = userId;
    next();
  });

  testApp.post("/api/family/create", createFamily);
  testApp.post("/api/family/join", joinFamily);
  testApp.get("/api/family/stats", getFamilyStats);
  testApp.post("/api/expense/recurring/add", addRecurringExpense);

  return testApp;
};

test("Step 1B: Backend Pro Feature Enforcement (Family & Recurring Limits)", async (t) => {
  const originalUserFindById = User.findById;
  const originalUserExists = User.exists;
  const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
  const originalFamilyFindById = Family.findById;
  const originalRecurringCount = RecurringExpense.countDocuments;
  const originalRecurringSave = RecurringExpense.prototype.save;
  const originalFamilySave = Family.prototype.save;

  t.afterEach(() => {
    User.findById = originalUserFindById;
    User.exists = originalUserExists;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
    Family.findById = originalFamilyFindById;
    RecurringExpense.countDocuments = originalRecurringCount;
    RecurringExpense.prototype.save = originalRecurringSave;
    Family.prototype.save = originalFamilySave;
  });

  // ==========================================
  // FAMILY MEMBER LIMIT TESTS
  // ==========================================

  await t.test("1. Family: Free user can join a family if total members < 2", async () => {
    const testUserId = "507f1f77bcf86cd799439011";
    const targetFamilyId = "507f1f77bcf86cd799439099";
    const app = createTestApp(testUserId);

    User.findById = async (id) => ({
      _id: id,
      name: "User 2",
      isPro: false,
      family: null
    });
    User.findByIdAndUpdate = async () => ({});

    const mockFamily = {
      _id: targetFamilyId,
      name: "Sharma Family",
      members: ["507f1f77bcf86cd799439001"], // 1 existing member
      save: async function () { return this; }
    };
    Family.findById = async () => mockFamily;

    const res = await request(app)
      .post("/api/family/join")
      .send({ familyId: targetFamilyId });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Joined family successfully");
    assert.equal(mockFamily.members.length, 2);
  });

  await t.test("2. Family: Free user is rejected with 403 FAMILY_LIMIT_REACHED when family already has 2 members", async () => {
    const testUserId = "507f1f77bcf86cd799439003";
    const targetFamilyId = "507f1f77bcf86cd799439099";
    const app = createTestApp(testUserId);

    // Joining user is Free
    User.findById = async (id) => ({
      _id: id,
      name: "User 3",
      isPro: false,
      family: null
    });

    // Family already has 2 members, neither is Pro
    const mockFamily = {
      _id: targetFamilyId,
      name: "Sharma Family",
      members: ["507f1f77bcf86cd799439001", "507f1f77bcf86cd799439002"],
      save: async function () { return this; }
    };
    Family.findById = async () => mockFamily;
    User.exists = async () => false; // No Pro member in family

    const res = await request(app)
      .post("/api/family/join")
      .send({ familyId: targetFamilyId });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "FAMILY_LIMIT_REACHED");
    assert.match(res.body.message, /Free accounts can have up to 2 family members/i);
    assert.equal(mockFamily.members.length, 2, "Members array must not be modified");
  });

  await t.test("3. Family: Pro user can join family beyond 2 members", async () => {
    const testUserId = "507f1f77bcf86cd799439003";
    const targetFamilyId = "507f1f77bcf86cd799439099";
    const app = createTestApp(testUserId);

    // Joining user is PRO
    User.findById = async (id) => ({
      _id: id,
      name: "Pro User 3",
      isPro: true,
      family: null
    });
    User.findByIdAndUpdate = async () => ({});

    const mockFamily = {
      _id: targetFamilyId,
      name: "Sharma Family",
      members: ["507f1f77bcf86cd799439001", "507f1f77bcf86cd799439002"],
      save: async function () { return this; }
    };
    Family.findById = async () => mockFamily;

    const res = await request(app)
      .post("/api/family/join")
      .send({ familyId: targetFamilyId });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Joined family successfully");
    assert.equal(mockFamily.members.length, 3);
  });

  await t.test("4. Family: Free user can join if an existing member in the family is Pro", async () => {
    const testUserId = "507f1f77bcf86cd799439003";
    const targetFamilyId = "507f1f77bcf86cd799439099";
    const app = createTestApp(testUserId);

    // Joining user is Free
    User.findById = async (id) => ({
      _id: id,
      name: "User 3",
      isPro: false,
      family: null
    });
    User.findByIdAndUpdate = async () => ({});

    const mockFamily = {
      _id: targetFamilyId,
      name: "Sharma Family",
      members: ["507f1f77bcf86cd799439001", "507f1f77bcf86cd799439002"],
      save: async function () { return this; }
    };
    Family.findById = async () => mockFamily;
    // Family creator is Pro
    User.exists = async () => true;

    const res = await request(app)
      .post("/api/family/join")
      .send({ familyId: targetFamilyId });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Joined family successfully");
    assert.equal(mockFamily.members.length, 3);
  });

  await t.test("5. Family: Direct API call without frontend UI enforces backend limit", async () => {
    const testUserId = "507f1f77bcf86cd799439003";
    const targetFamilyId = "507f1f77bcf86cd799439099";
    const app = createTestApp(testUserId);

    User.findById = async (id) => ({
      _id: id,
      isPro: false,
      family: null
    });

    Family.findById = async () => ({
      _id: targetFamilyId,
      name: "Sharma Family",
      members: ["507f1f77bcf86cd799439001", "507f1f77bcf86cd799439002"],
      save: async function () { return this; }
    });
    User.exists = async () => false;

    // Direct HTTP POST
    const res = await request(app)
      .post("/api/family/join")
      .send({ familyId: targetFamilyId });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "FAMILY_LIMIT_REACHED");
  });

  // ==========================================
  // RECURRING EXPENSE LIMIT TESTS
  // ==========================================

  await t.test("6. Recurring: Free user with 0 recurring bills can create 1st recurring bill", async () => {
    const testUserId = "507f1f77bcf86cd799439011";
    const app = createTestApp(testUserId);

    User.findById = (id) => ({
      select: async () => ({ _id: id, isPro: false })
    });
    RecurringExpense.countDocuments = async () => 0;
    RecurringExpense.prototype.save = async function () { return this; };

    const res = await request(app)
      .post("/api/expense/recurring/add")
      .send({
        amount: 500,
        category: "Bills & Utilities",
        note: "Electricity",
        frequency: "Monthly"
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.message, "Recurring expense set up successfully");
  });

  await t.test("7. Recurring: Free user with 1 recurring bill can create 2nd recurring bill", async () => {
    const testUserId = "507f1f77bcf86cd799439011";
    const app = createTestApp(testUserId);

    User.findById = (id) => ({
      select: async () => ({ _id: id, isPro: false })
    });
    RecurringExpense.countDocuments = async () => 1;
    RecurringExpense.prototype.save = async function () { return this; };

    const res = await request(app)
      .post("/api/expense/recurring/add")
      .send({
        amount: 800,
        category: "Bills & Utilities",
        note: "Water",
        frequency: "Monthly"
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.message, "Recurring expense set up successfully");
  });

  await t.test("8. Recurring: Free user with 2 recurring bills is rejected with 403 RECURRING_LIMIT_REACHED", async () => {
    const testUserId = "507f1f77bcf86cd799439011";
    const app = createTestApp(testUserId);

    User.findById = (id) => ({
      select: async () => ({ _id: id, isPro: false })
    });
    RecurringExpense.countDocuments = async () => 2; // Already has 2 recurring bills

    const res = await request(app)
      .post("/api/expense/recurring/add")
      .send({
        amount: 1500,
        category: "Bills & Utilities",
        note: "Gym",
        frequency: "Monthly"
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "RECURRING_LIMIT_REACHED");
    assert.match(res.body.message, /Free accounts can have up to 2 recurring bills/i);
  });

  await t.test("9. Recurring: Pro user can create recurring bills beyond 2", async () => {
    const testUserId = "507f1f77bcf86cd799439011";
    const app = createTestApp(testUserId);

    User.findById = (id) => ({
      select: async () => ({ _id: id, isPro: true })
    });
    RecurringExpense.countDocuments = async () => 10; // Already has 10 recurring bills
    RecurringExpense.prototype.save = async function () { return this; };

    const res = await request(app)
      .post("/api/expense/recurring/add")
      .send({
        amount: 2500,
        category: "Bills & Utilities",
        note: "Fiber Internet",
        frequency: "Monthly"
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.message, "Recurring expense set up successfully");
  });

  await t.test("10. Recurring: Direct API request cannot bypass recurring bill limit", async () => {
    const testUserId = "507f1f77bcf86cd799439011";
    const app = createTestApp(testUserId);

    User.findById = (id) => ({
      select: async () => ({ _id: id, isPro: false })
    });
    RecurringExpense.countDocuments = async () => 2;

    // Direct HTTP POST attempt
    const res = await request(app)
      .post("/api/expense/recurring/add")
      .send({
        amount: 3000,
        category: "Bills & Utilities",
        note: "Streaming service",
        frequency: "Monthly"
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "RECURRING_LIMIT_REACHED");
  });
});
