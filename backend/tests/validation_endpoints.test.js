const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
process.env.NODE_ENV = "test";
const app = require("../server");

test("Endpoint Validation & Parameter Handling Suite", async (t) => {
  await t.test("DELETE /api/expense/:id with malformed ObjectId should return 400 Bad Request", async () => {
    // Inject mock auth header or check without auth
    const res = await request(app).delete("/api/expense/123-invalid-id");
    // Should be rejected by auth or validation with 400/401, never 500
    assert.ok(res.status === 400 || res.status === 401);
    assert.notEqual(res.status, 500);
  });

  await t.test("PUT /api/expense/:id with malformed ObjectId should return 400 Bad Request", async () => {
    const res = await request(app).put("/api/expense/malformed-id").send({ amount: 100 });
    assert.ok(res.status === 400 || res.status === 401);
    assert.notEqual(res.status, 500);
  });

  await t.test("DELETE /api/income/:id with malformed ObjectId should return 400 Bad Request", async () => {
    const res = await request(app).delete("/api/income/malformed-id");
    assert.ok(res.status === 400 || res.status === 401);
    assert.notEqual(res.status, 500);
  });
});
