/**
 * Sanitizes input strings to prevent XSS and other injection attacks.
 * Strips HTML tags and trims whitespace.
 * @param {any} input - The input to sanitize
 * @param {number} maxLen - Maximum allowed length
 * @returns {string} - The sanitized string
 */
const sanitize = (input, maxLen = 500) => {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/[<>]/g, "") // Strip < and >
    .trim()
    .substring(0, maxLen);
};

module.exports = { sanitize };
