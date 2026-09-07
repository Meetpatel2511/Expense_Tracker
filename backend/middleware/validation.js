const mongoose = require("mongoose");

/**
 * Validates if a string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
};

/**
 * Express middleware to validate ObjectId in route parameters.
 * @param {string} paramName - Parameter name (defaults to 'id')
 */
const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: `Invalid ID format for parameter '${paramName}'. Expected a 24-character hexadecimal ObjectId.`
      });
    }
    next();
  };
};

/**
 * Checks if a value is a valid positive finite number.
 * @param {any} val
 * @returns {boolean}
 */
const isValidAmount = (val) => {
  if (val === null || val === undefined || typeof val === "boolean" || val === "") return false;
  const num = Number(val);
  return !isNaN(num) && isFinite(num) && num > 0 && num <= 1000000000;
};

/**
 * Checks if a string represents a valid date.
 * @param {any} val
 * @returns {boolean}
 */
const isValidDate = (val) => {
  if (!val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

/**
 * Sanitizes and clamps pagination query parameters.
 * @param {Object} query
 * @param {number} [defaultLimit=10]
 * @param {number} [maxLimit=100]
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const parsedLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, parsedLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Validates and parses month (1-12) and year (1970-2100).
 * @param {any} monthVal
 * @param {any} yearVal
 * @returns {{ month: number, year: number, isValid: boolean }}
 */
const parseMonthYear = (monthVal, yearVal) => {
  const now = new Date();
  let month = monthVal !== undefined ? parseInt(monthVal, 10) : now.getUTCMonth() + 1;
  let year = yearVal !== undefined ? parseInt(yearVal, 10) : now.getUTCFullYear();

  if (isNaN(month) || month < 1 || month > 12) {
    return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear(), isValid: false };
  }

  if (isNaN(year) || year < 1970 || year > 2100) {
    return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear(), isValid: false };
  }

  return { month, year, isValid: true };
};

// Centralized list of valid expense categories
const VALID_CATEGORIES = Object.freeze([
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Groceries",
  "Rent",
  "Other"
]);

// Valid budget categories include all standard categories plus 'Global'
const VALID_BUDGET_CATEGORIES = Object.freeze([...VALID_CATEGORIES, "Global"]);

/**
 * Validates that minAmount is less than or equal to maxAmount when both are provided.
 * @param {any} minAmount
 * @param {any} maxAmount
 * @returns {boolean}
 */
const isValidAmountRange = (minAmount, maxAmount) => {
  if (minAmount === undefined || minAmount === "" || maxAmount === undefined || maxAmount === "") {
    return true;
  }
  const min = Number(minAmount);
  const max = Number(maxAmount);
  if (isNaN(min) || isNaN(max)) return false;
  return min <= max;
};

/**
 * Validates that startDate is before or equal to endDate when both are provided.
 * @param {any} startDate
 * @param {any} endDate
 * @returns {boolean}
 */
const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
  return new Date(startDate).getTime() <= new Date(endDate).getTime();
};

module.exports = {
  VALID_CATEGORIES,
  VALID_BUDGET_CATEGORIES,
  isValidObjectId,
  validateObjectIdParam,
  isValidAmount,
  isValidDate,
  isValidAmountRange,
  isValidDateRange,
  parsePagination,
  parseMonthYear
};

