const Family = require("../models/Family");
const User = require("../models/User");
const Expense = require("../models/Expense");
const { sanitize } = require("../utils/sanitize");

// CREATE FAMILY
exports.createFamily = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Family name is required" });
    }

    // Check if user already has a family
    const user = await User.findById(req.user);
    if (user.family) {
      return res.status(400).json({ message: "You already belong to a family" });
    }

    const family = new Family({
      name: sanitize(name, 50),
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

    if (!familyId) {
      return res.status(400).json({ message: "Family ID is required" });
    }

    // Check if user already has a family
    const user = await User.findById(req.user);
    if (user.family) {
      return res.status(400).json({ message: "You already belong to a family" });
    }

    const family = await Family.findById(familyId);

    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // Check if already a member
    if (family.members.includes(req.user)) {
      return res.status(400).json({ message: "You are already a member of this family" });
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