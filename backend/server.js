const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { notFoundHandler, globalErrorHandler } = require("./middleware/errorHandler");

const app = express();

// Trust the first reverse proxy hop (Render, Vercel, Heroku load balancers)
// Allows express-rate-limit to extract the real client IP from X-Forwarded-For securely
app.set("trust proxy", 1);

// Import routes
const expenseRoutes = require("./routes/expenseRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const familyRoutes = require("./routes/familyRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRequestRoutes = require("./routes/paymentRequestRoutes");

// CORS Configuration
const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(origin => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests with no origin (like mobile apps, server-to-server, or curl)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/+$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Disallow unapproved origins without throwing an unhandled exception
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// Rate limiter for AI suggestions endpoint (10 requests per minute per IP)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: "Too many AI requests. Please wait a minute before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to AI suggestion route
app.use("/api/expense/suggestions", aiLimiter);

// Routes
app.use("/api/expense", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment-request", paymentRequestRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

// Connect DB & Start server if running directly
if (process.env.NODE_ENV !== "test") {
  if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log("MongoDB Connected"))
      .catch(err => console.error("MongoDB Connection Error:", err.message));
  } else {
    console.warn("MONGO_URI is not defined. Database operations may fail.");
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;