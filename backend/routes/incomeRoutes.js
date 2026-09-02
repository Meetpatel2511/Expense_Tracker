const express = require("express");
const router = express.Router();

const { addIncome, getIncomes, deleteIncome, updateIncome } = require("../controllers/incomeController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/validation");

router.post("/add", authMiddleware, addIncome);
router.get("/", authMiddleware, getIncomes);
router.delete("/:id", authMiddleware, validateObjectIdParam("id"), deleteIncome);
router.put("/:id", authMiddleware, validateObjectIdParam("id"), updateIncome);

module.exports = router;
