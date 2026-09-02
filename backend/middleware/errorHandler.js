/**
 * Sanitizes and sends an error response without leaking internal implementation details in production.
 *
 * @param {import('express').Response} res
 * @param {Error|any} error
 * @param {string} [fallbackMessage="Internal Server Error"]
 * @param {number} [statusCode=500]
 */
const sendErrorResponse = (res, error, fallbackMessage = "Internal Server Error", statusCode = 500) => {
  // Always log full error on server side for observability
  console.error(`[Server Error ${statusCode}]:`, error);

  const isProduction = process.env.NODE_ENV === "production";

  let clientMessage = fallbackMessage;

  if (!isProduction) {
    clientMessage = error?.message || fallbackMessage;
  } else {
    // In production, mask database/internal errors unless it's a known operational client message
    if (statusCode < 500 && error?.message) {
      clientMessage = error.message;
    } else {
      clientMessage = "An unexpected error occurred. Please try again later.";
    }
  }

  return res.status(statusCode).json({
    message: clientMessage,
    ...(isProduction ? {} : { error: error?.message, stack: error?.stack })
  });
};

/**
 * Express 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Centralized global Express error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  sendErrorResponse(res, err, err.message || "Internal Server Error", statusCode);
};

module.exports = {
  sendErrorResponse,
  notFoundHandler,
  globalErrorHandler
};
