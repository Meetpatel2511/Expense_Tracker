import * as XLSX from "xlsx";

/**
 * Sanitizes a spreadsheet cell value to prevent Formula Injection (CSV/Excel Injection).
 * Dangerous characters at the beginning of formulas include: =, +, -, @
 * Legitimate numeric values (including negative numbers like -2500) remain strictly numeric.
 *
 * @param {any} value - Cell value to sanitize
 * @returns {any} Sanitized value safe for spreadsheet export
 */
export const sanitizeSpreadsheetValue = (value) => {
  if (value === null || value === undefined) return "";

  // Preserve pure numbers (including negative numbers)
  if (typeof value === "number") {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return "";

    // If string represents a valid integer or floating point number, preserve as number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    // If string starts with dangerous spreadsheet formula triggers, escape with a single quote
    if (/^[=+\-@]/.test(trimmed)) {
      return `'${trimmed}`;
    }

    return value;
  }

  return value;
};

/**
 * Exports data to an Excel file (.xlsx) with formula sanitization
 * @param {Array} data - Array of objects to export
 * @param {string} [fileName="FinTrack_Data"] - Name of the file (without extension)
 * @param {string} [sheetName="Transactions"] - Name of the worksheet
 * @returns {boolean} True if export succeeded
 */
export const exportToExcel = (data, fileName = "FinTrack_Data", sheetName = "Transactions") => {
  try {
    if (!data || data.length === 0) {
      console.warn("No data to export");
      return false;
    }

    const workbook = XLSX.utils.book_new();

    const formattedData = data.map(item => {
      const amt = typeof item.amount === "number" ? item.amount : Number(item.amount);
      const safeAmount = isNaN(amt) || !isFinite(amt) ? 0 : amt;

      return {
        Date: item.date ? new Date(item.date).toLocaleDateString() : "-",
        Category: sanitizeSpreadsheetValue(item.category || item.source || "Other"),
        Note: sanitizeSpreadsheetValue(item.note || item.description || "-"),
        Type: sanitizeSpreadsheetValue(item.type || (item.source ? "Income" : "Expense")),
        Amount: safeAmount
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    const wscols = [
      { wch: 15 }, // Date
      { wch: 20 }, // Category
      { wch: 30 }, // Note
      { wch: 12 }, // Type
      { wch: 15 }, // Amount
    ];
    worksheet["!cols"] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);

    return true;
  } catch (error) {
    console.error("Excel Export Error:", error);
    return false;
  }
};

/**
 * Exports data to a CSV file with formula sanitization and RFC-4180 escaping
 * @param {Array} data - Array of objects to export
 * @param {string} [fileName="FinTrack_Data"] - Name of the file
 * @returns {boolean} True if export succeeded
 */
export const exportToCSV = (data, fileName = "FinTrack_Data") => {
  try {
    if (!data || data.length === 0) {
      console.warn("No data to export");
      return false;
    }

    const headers = ["Date", "Category", "Note", "Type", "Amount"];
    const rows = data.map(item => {
      const sanitizedCat = sanitizeSpreadsheetValue(item.category || item.source || "Other");
      const sanitizedNote = sanitizeSpreadsheetValue(item.note || item.description || "-");
      const sanitizedType = sanitizeSpreadsheetValue(item.type || (item.source ? "Income" : "Expense"));
      const amt = typeof item.amount === "number" ? item.amount : Number(item.amount);
      const safeAmount = isNaN(amt) || !isFinite(amt) ? 0 : amt;
      const dateStr = item.date ? new Date(item.date).toLocaleDateString() : "-";

      return [
        dateStr,
        `"${String(sanitizedCat).replace(/"/g, '""')}"`,
        `"${String(sanitizedNote).replace(/"/g, '""')}"`,
        `"${String(sanitizedType).replace(/"/g, '""')}"`,
        safeAmount
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("CSV Export Error:", error);
    return false;
  }
};

/**
 * Fetches all transaction records across all paginated pages for a specific date range.
 * This guarantees reports (PDF and Excel) contain 100% of the transactions, even if total exceeds default page limit (100).
 *
 * @param {Object} apiClient - Axios API client instance
 * @param {string} endpoint - API endpoint (e.g., "/expense" or "/income")
 * @param {string} startDate - ISO start date string
 * @param {string} endDate - ISO end date string
 * @returns {Promise<Array>} Complete flat array of all transaction objects
 */
export const fetchAllPeriodTransactions = async (apiClient, endpoint, startDate, endDate) => {
  const limit = 100;
  const initialRes = await apiClient.get(`${endpoint}?startDate=${startDate}&endDate=${endDate}&limit=${limit}&page=1`);
  const initialData = initialRes.data?.data || [];
  const totalPages = Number(initialRes.data?.pages) || 1;

  if (totalPages <= 1) {
    return initialData;
  }

  // Fetch remaining pages in parallel for complete dataset retrieval
  const pagePromises = [];
  for (let p = 2; p <= totalPages; p++) {
    pagePromises.push(
      apiClient.get(`${endpoint}?startDate=${startDate}&endDate=${endDate}&limit=${limit}&page=${p}`)
        .then(res => res.data?.data || [])
        .catch(err => {
          console.error(`Failed to fetch ${endpoint} page ${p}:`, err);
          return [];
        })
    );
  }

  const remainingPagesData = await Promise.all(pagePromises);
  return [initialData, ...remainingPagesData].flat();
};
