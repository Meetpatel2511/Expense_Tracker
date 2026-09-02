const { clerkClient, ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const User = require("../models/User");

// 1. Clerk verifies the incoming Bearer token natively
const requireAuth = ClerkExpressRequireAuth();

// 2. Custom interop middleware to sync Clerk with MongoDB seamlessly
const syncClerkIdToMongoId = async (req, res, next) => {
  try {
    const clerkId = req.auth?.userId;
    
    if (!clerkId) {
      return res.status(401).json({ message: "Invalid or missing Clerk ID" });
    }

    // Attempt to find the user in DB
    let user = await User.findOne({ clerkId });

    if (!user) {
      // First time this Clerk user has hit the backend API
      try {
        // Send a dummy paymentId for development mode
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const emailRecord = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);
        const email = emailRecord ? emailRecord.emailAddress : "unknown@clerk.dev";
        const name = (clerkUser.firstName || "") + " " + (clerkUser.lastName || "");

        // Check if email already existed from legacy JWT auth
        user = await User.findOne({ email });
        
        if (user) {
          // Link old account securely to Clerk
          user.clerkId = clerkId;
          await user.save();
        } else {
          // Complete new user registration
          user = new User({
            name: name.trim() || 'New User',
            email,
            clerkId,
          });
          await user.save();
        }
      } catch (clerkSyncError) {
        console.error("Clerk Sync Error:", clerkSyncError);
        return res.status(500).json({ message: "Authentication Sync Error" });
      }
    }

    // Attach the MongoDB ObjectID to req.user safely (Legacy interop support)
    req.user = user._id;
    
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Server auth resolution error" });
  }
};

module.exports = [requireAuth, syncClerkIdToMongoId];