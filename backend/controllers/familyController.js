const Family = require("../models/Family");
const User = require("../models/User");
const Expense = require("../models/Expense");
const { sanitize } = require("../utils/sanitize");
const { isValidObjectId } = require("../middleware/validation");

// CREATE FAMILY
exports.createFamily = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Family name is required" });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ message: "Family name must be between 2 and 50 characters" });
    }

    // Check if user already has a family
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.family) {
      return res.status(400).json({ message: "You already belong to a family" });
    }

    const family = new Family({
      name: sanitize(trimmedName, 50),
      members: [req.user]
    });

    await family.save();

    await User.findByIdAndUpdate(req.user, { family: family._id });

    res.json({ message: "Family created", family });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// JOIN FAMILY
exports.joinFamily = async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId || !isValidObjectId(familyId)) {
      return res.status(400).json({ message: "A valid Family ID is required" });
    }

    // Check if user already has a family
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.family) {
      return res.status(400).json({ message: "You already belong to a family" });
    }

    const family = await Family.findById(familyId);

    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // Check if already a member
    if (family.members.some(m => m.toString() === req.user.toString())) {
      return res.status(400).json({ message: "You are already a member of this family" });
    }

    // Enforce 2-member limit for Free accounts
    if (family.members.length >= 2) {
      const hasProMember = Boolean(user.isPro) || Boolean(await User.exists({ _id: { $in: family.members }, isPro: true }));
      if (!hasProMember) {
        return res.status(403).json({
          message: "Free accounts can have up to 2 family members. Upgrade to Pro for unlimited members.",
          code: "FAMILY_LIMIT_REACHED"
        });
      }
    }

    family.members.push(req.user);
    await family.save();

    await User.findByIdAndUpdate(req.user, { family: familyId });

    res.json({ message: "Joined family successfully", family });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET FAMILY STATS
exports.getFamilyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.family) {
      return res.json({
        hasFamily: false,
        familyName: null,
        totalFamilyExpense: 0,
        members: []
      });
    }

    const family = await Family.findById(user.family);

    const expenses = await Expense.find({ family: user.family }).populate("user", "name");

    let totalFamilyExpense = 0;
    let memberMap = {};

    expenses.forEach(exp => {
      if (!exp.user) return; // skip if user was deleted

      totalFamilyExpense += exp.amount;
      const userName = exp.user.name;

      memberMap[userName] = (memberMap[userName] || 0) + exp.amount;
    });

    const members = Object.keys(memberMap).map(name => ({
      name,
      total: memberMap[name],
      percentage: totalFamilyExpense > 0
        ? Number(((memberMap[name] / totalFamilyExpense) * 100).toFixed(1))
        : 0
    }));

    res.json({
      hasFamily: true,
      familyName: family ? family.name : "Family",
      familyId: user.family,
      totalFamilyExpense,
      members
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};