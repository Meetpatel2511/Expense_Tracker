const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
process.env.NODE_ENV = "test";
const app = require("../server");

test("Expense Route Authentication & Unauthorized Access Suite", async (t) => {
  const validObjectId = "507f1f77bcf86cd799439011";

  await t.test("1. GET /api/expense should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/expense");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("2. POST /api/expense/add should reject unauthenticated requests with 401", async () => {
    const res = await request(app)
      .post("/api/expense/add")
      .send({ amount: 50, category: "Food & Dining", note: "Lunch" });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("3. GET /api/expense/dashboard should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/expense/dashboard");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("4. POST /api/expense/recurring/add should reject unauthenticated requests with 401", async () => {
    const res = await request(app)
      .post("/api/expense/recurring/add")
      .send({ amount: 100, category: "Bills & Utilities", frequency: "Monthly" });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("5. GET /api/expense/summary should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/expense/summary");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("6. GET /api/expense/categories should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/expense/categories");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("7. GET /api/expense/insights should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/expense/insights");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("8. GET /api/expense/yearly should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/expense/yearly");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("9. GET /api/expense/suggestions should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/expense/suggestions");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("10. PUT /api/expense/:id should reject unauthenticated requests with 401", async () => {
    const res = await request(app)
      .put(`/api/expense/${validObjectId}`)
      .send({ amount: 75, category: "Groceries" });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("11. DELETE /api/expense/:id should reject unauthenticated requests with 401", async () => {
    const res = await request(app).delete(`/api/expense/${validObjectId}`);
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("12. Contrast Test: GET /api/expense/category-list should be publicly accessible without auth (200)", async () => {
    const res = await request(app).get("/api/expense/category-list");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.categories));
    assert.ok(res.body.categories.length > 0);
    assert.ok(res.body.categories.includes("Food & Dining"));
    assert.ok(res.body.categories.includes("Bills & Utilities"));
  });

  await t.test("13. Malformed authorization scheme should return 401 Unauthorized", async () => {
    const res = await request(app)
      .get("/api/expense")
      .set("Authorization", "Basic user:pass");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("14. Missing/empty Bearer token string should return 401 Unauthorized", async () => {
    const res = await request(app)
      .get("/api/expense")
      .set("Authorization", "Bearer ");
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });

  await t.test("15. Invalid token format should return 401 Unauthorized and not throw unhandled 500", async () => {
    const res = await request(app)
      .post("/api/expense/add")
      .set("Authorization", "Bearer invalid.jwt.format")
      .send({ amount: 20, category: "Shopping" });
    assert.equal(res.status, 401);
    assert.notEqual(res.status, 500);
    assert.match(res.body.message, /Authentication required|Unauthorized/);
  });
});
