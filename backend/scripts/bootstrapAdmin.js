#!/usr/bin/env node
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Controlled One-Time Admin Bootstrap Script
 *
 * Usage:
 *   node scripts/bootstrapAdmin.js <admin_email>
 *   or with environment variable:
 *   ADMIN_EMAILS="admin@example.com" node scripts/bootstrapAdmin.js
 *
 * Rules:
 * - Exact, normalized email comparison (trim and lowercase)
 * - Requires an existing user account with a valid clerkId
 * - Does NOT create new accounts
 * - Promotes user to role "ADMIN"
 * - Fails closed if user is not found or email is omitted
 */
const bootstrapAdmin = async (targetEmail) => {
  let email = targetEmail;

  if (!email && process.env.ADMIN_EMAILS) {
    const emails = process.env.ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length > 0) {
      email = emails[0];
    }
  }

  const logError = (...args) => {
    if (process.env.NODE_ENV !== "test") console.error(...args);
  };
  const logInfo = (...args) => {
    if (process.env.NODE_ENV !== "test") console.log(...args);
  };

  if (!email || typeof email !== "string" || !email.trim()) {
    logError("Error: Admin email must be provided as a CLI argument or via ADMIN_EMAILS environment variable.");
    logError("Usage: node scripts/bootstrapAdmin.js <admin_email>");
    return { success: false, reason: "MISSING_EMAIL" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Connect to DB if not already connected and in standalone CLI mode (not in test runner)
  const shouldConnect = mongoose.connection.readyState === 0 && process.env.MONGO_URI && process.env.NODE_ENV !== "test";
  if (shouldConnect) {
    await mongoose.connect(process.env.MONGO_URI);
  } else if (mongoose.connection.readyState === 0 && process.env.NODE_ENV !== "test") {
    console.error("Error: MONGO_URI is not defined in environment.");
    return { success: false, reason: "MISSING_MONGO_URI" };
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      logError(`Error: User with email "${normalizedEmail}" not found in database.`);
      logError("Admin bootstrap requires an existing account. Please sign in once via Clerk first.");
      return { success: false, reason: "USER_NOT_FOUND" };
    }

    if (!user.clerkId) {
      logError(`Error: User "${normalizedEmail}" does not have a linked Clerk ID.`);
      logError("Admin bootstrap requires a verified Clerk-linked account.");
      return { success: false, reason: "MISSING_CLERK_ID" };
    }

    if (user.role === "ADMIN") {
      logInfo(`User "${normalizedEmail}" (ID: ${user._id}) is already an ADMIN.`);
      return { success: true, alreadyAdmin: true, userId: user._id, email: user.email };
    }

    user.role = "ADMIN";
    await user.save();

    logInfo(`✅ Successfully promoted user "${normalizedEmail}" (ID: ${user._id}, ClerkId: ${user.clerkId}) to ADMIN.`);
    return { success: true, promoted: true, userId: user._id, email: user.email };
  } finally {
    if (shouldConnect) {
      await mongoose.disconnect();
    }
  }
};

// If run directly from CLI
if (require.main === module) {
  const cliArg = process.argv[2];
  bootstrapAdmin(cliArg)
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Bootstrap Fatal Error:", err.message);
      process.exit(1);
    });
}

module.exports = bootstrapAdmin;
