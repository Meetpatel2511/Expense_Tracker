const test = require("node:test");
const assert = require("node:assert/strict");
const requirePro = require("../middleware/proMiddleware");
const User = require("../models/User");

test("Pro Middleware Suite", async (t) => {
  await t.test("should return 403 PRO_REQUIRED if user is not Pro", async () => {
    // Mock User.findById
    const originalFindById = User.findById;
    User.findById = (id) => ({
      select: async () => ({ _id: id, isPro: false })
    });

    const req = { user: "507f1f77bcf86cd799439011" };
    let statusCode = null;
    let responseBody = null;
    let nextCalled = false;

    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => {
            responseBody = body;
          }
        };
      }
    };

    const next = () => {
      nextCalled = true;
    };

    await requirePro(req, res, next);

    User.findById = originalFindById;

    assert.equal(statusCode, 403);
    assert.equal(responseBody.code, "PRO_REQUIRED");
    assert.equal(nextCalled, false);
  });

  await t.test("should call next() if user is Pro", async () => {
    const originalFindById = User.findById;
    User.findById = (id) => ({
      select: async () => ({ _id: id, isPro: true })
    });

    const req = { user: "507f1f77bcf86cd799439011" };
    let nextCalled = false;

    const res = {};
    const next = () => {
      nextCalled = true;
    };

    await requirePro(req, res, next);

    User.findById = originalFindById;

    assert.equal(nextCalled, true);
  });

  await t.test("should return 404 if user not found", async () => {
    const originalFindById = User.findById;
    User.findById = () => ({
      select: async () => null
    });

    const req = { user: "507f1f77bcf86cd799439011" };
    let statusCode = null;
    let responseBody = null;

    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => {
            responseBody = body;
          }
        };
      }
    };

    await requirePro(req, res, () => {});

    User.findById = originalFindById;

    assert.equal(statusCode, 404);
    assert.match(responseBody.message, /User not found/);
  });
});
