const express = require("express");
const router = express.Router();

const { createFamily, joinFamily, getFamilyStats } = require("../controllers/familyController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createFamily);
router.post("/join", authMiddleware, joinFamily);
router.get("/stats", authMiddleware, getFamilyStats);

module.exports = router;