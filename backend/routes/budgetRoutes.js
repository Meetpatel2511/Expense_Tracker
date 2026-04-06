const express = require("express");
const router = express.Router();

const { setBudget, getBudgetStatus } = require("../controllers/budgetController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, setBudget);
router.get("/", authMiddleware, getBudgetStatus);

module.exports = router;