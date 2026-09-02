const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
process.env.NODE_ENV = "test";
const app = require("../server");

test("API Security and Route Protection Suite", async (t) => {
  await t.test("GET / should return 200 health check", async () => {
    const res = await request(app).get("/");
    assert.equal(res.status, 200);
    assert.match(res.text, /API is running/);
  });

  await t.test("GET /api/non-existent-route should return 404 with clean JSON message", async () => {
    const res = await request(app).get("/api/non-existent-route");
    assert.equal(res.status, 404);
    assert.equal(typeof res.body.message, "string");
    assert.match(res.body.message, /Route not found/);
  });

  await t.test("Protected endpoints should reject unauthenticated requests (401)", async () => {
    const resExpense = await request(app).get("/api/expense");
    assert.equal(resExpense.status, 401);

    const resIncome = await request(app).get("/api/income");
    assert.equal(resIncome.status, 401);

    const resUser = await request(app).get("/api/user/profile");
    assert.equal(resUser.status, 401);

    const resBudget = await request(app).get("/api/budget");
    assert.equal(resBudget.status, 401);

    const resFamily = await request(app).get("/api/family/stats");
    assert.equal(resFamily.status, 401);
  });

  await t.test("GET /api/expense/category-list should return valid categories without auth", async () => {
    const res = await request(app).get("/api/expense/category-list");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.categories));
    assert.ok(res.body.categories.includes("Food & Dining"));
    assert.ok(res.body.categories.includes("Bills & Utilities"));
  });

  await t.test("CORS should allow configured localhost origins with credentials", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", "http://localhost:5173");
    
    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });

  await t.test("CORS should succeed on OPTIONS preflight request for allowed origin", async () => {
    const res = await request(app)
      .options("/api/user/profile")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    
    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
  });

  await t.test("CORS should not attach allow-origin header for unknown/disallowed origin", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", "https://unauthorized-evil-site.com");
    
    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });
});
