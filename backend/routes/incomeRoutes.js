const express = require("express");
const router = express.Router();

const { addIncome, getIncomes, deleteIncome, updateIncome } = require("../controllers/incomeController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, addIncome);
router.get("/", authMiddleware, getIncomes);
router.delete("/:id", authMiddleware, deleteIncome);
router.put("/:id", authMiddleware, updateIncome);

module.exports = router;
