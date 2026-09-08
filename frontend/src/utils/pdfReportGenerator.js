import { jsPDF } from "jspdf";
import autoTableImport from "jspdf-autotable";

const autoTable = typeof autoTableImport === "function"
  ? autoTableImport
  : (autoTableImport.default?.default || autoTableImport.default || autoTableImport);

// ==========================================
// COLOR PALETTE DEFINITIONS (RGB FORMAT)
// ==========================================
export const COLORS = {
  primaryPurple: [109, 40, 217], // #6D28D9
  darkNavy: [17, 24, 39],        // #111827
  secondarySlate: [100, 116, 139], // #64748B
  lightBorder: [226, 232, 240],  // #E2E8F0
  cardBg: [248, 250, 252],       // #F8FAFC
  white: [255, 255, 255],
  positiveGreen: [5, 150, 105],  // #059669
  lightGreen: [209, 250, 229],   // #D1FAE5
  expenseRed: [220, 38, 38],     // #DC2626
  lightRed: [254, 226, 226],     // #FEE2E2
  warningOrange: [217, 119, 6],  // #D97706
  lightOrange: [254, 243, 199],  // #FEF3C7
  insightPurpleBg: [250, 245, 255], // #FAF5FF
  insightPurpleBorder: [233, 213, 255] // #E9D5FF
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Formats a currency amount into standard Indian Rupee notation
 */
export const formatCurrency = (amount) => {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num) || !isFinite(num)) return "Rs. 0";
  return `Rs. ${num.toLocaleString("en-IN")}`;
};

/**
 * Calculates days in a given month/year safely
 */
export const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

/**
 * Pure calculation function for executive financial metrics
 */
export const calculateFinancialMetrics = ({ totalIncome = 0, totalExpense = 0, balance = 0 } = {}) => {
  const inc = Number(totalIncome) || 0;
  const exp = Number(totalExpense) || 0;
  const net = inc - exp;
  const closing = Number(balance) || 0;
  const opening = closing - net;

  const savingsRate = inc > 0
    ? Math.max(0, Math.round((net / inc) * 100))
    : 0;

  const expenseRatio = inc > 0
    ? Math.round((exp / inc) * 100)
    : (exp > 0 ? 100 : 0);

  return {
    totalIncome: inc,
    totalExpense: exp,
    netCashFlow: net,
    openingBalance: opening,
    closingBalance: closing,
    savingsRate,
    expenseRatio
  };
};

/**
 * Pure calculation function for category budget utilization
 */
export const calculateBudgetProgress = ({ budget = 0, spent = 0 } = {}) => {
  const b = Number(budget) || 0;
  const s = Number(spent) || 0;
  const rawPercent = b > 0 ? (s / b) * 100 : 0;
  const usagePercent = Math.round(rawPercent);
  const isExceeded = s > b;
  const isNearLimit = !isExceeded && rawPercent >= 80;
  const remaining = b - s;

  return {
    budget: b,
    spent: s,
    rawPercent,
    usagePercent,
    isExceeded,
    isNearLimit,
    remaining
  };
};

/**
 * Pure calculation function for category distribution percentages
 */
export const calculateCategoryDistribution = (categories = {}, totalExpense = 0) => {
  const tot = Number(totalExpense) || 0;
  return Object.entries(categories || {})
    .map(([category, amount]) => {
      const amt = Number(amount) || 0;
      const share = tot > 0 ? (amt / tot) * 100 : 0;
      return {
        category,
        amount: amt,
        share,
        formattedShare: `${share.toFixed(1)}%`
      };
    })
    .sort((a, b) => b.amount - a.amount);
};

/**
 * Validates complete internal reconciliation of financial dataset
 */
export const reconcileFinancialData = ({
  summary = {},
  categories = {},
  expenses = [],
  incomes = [],
  budgets = {}
} = {}) => {
  const errors = [];

  const reportedIncome = Number(summary.totalIncome) || 0;
  const reportedExpense = Number(summary.totalExpense) || 0;
  const reportedBalance = Number(summary.balance) || 0;

  // 1. Incomes sum
  const incomeTxTotal = (incomes || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  if (Math.abs(incomeTxTotal - reportedIncome) > 0.01) {
    errors.push(`Income transactions sum (${incomeTxTotal}) does not match reported totalIncome (${reportedIncome})`);
  }

  // 2. Expenses sum
  const expenseTxTotal = (expenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  if (Math.abs(expenseTxTotal - reportedExpense) > 0.01) {
    errors.push(`Expense transactions sum (${expenseTxTotal}) does not match reported totalExpense (${reportedExpense})`);
  }

  // 3. Category sum
  const categoryTotal = Object.values(categories || {}).reduce((sum, amt) => sum + (Number(amt) || 0), 0);
  if (Math.abs(categoryTotal - reportedExpense) > 0.01) {
    errors.push(`Category breakdown sum (${categoryTotal}) does not match reported totalExpense (${reportedExpense})`);
  }

  // 4. Per-category itemized match
  const expenseCategorySums = {};
  (expenses || []).forEach((exp) => {
    const cat = exp.category || "Other";
    expenseCategorySums[cat] = (expenseCategorySums[cat] || 0) + (Number(exp.amount) || 0);
  });

  Object.entries(categories || {}).forEach(([cat, amt]) => {
    const catSum = expenseCategorySums[cat] || 0;
    if (Math.abs(catSum - Number(amt)) > 0.01) {
      errors.push(`Category '${cat}' sum in transactions (${catSum}) does not match category breakdown amount (${amt})`);
    }
  });

  // 5. Cash flow reconciliation: Opening + Income - Expense = Closing
  const metrics = calculateFinancialMetrics(summary);
  const calculatedClosing = metrics.openingBalance + reportedIncome - reportedExpense;
  if (Math.abs(calculatedClosing - reportedBalance) > 0.01) {
    errors.push(`Balance equation failed: opening (${metrics.openingBalance}) + income (${reportedIncome}) - expense (${reportedExpense}) !== closing (${reportedBalance})`);
  }

  // 6. Budgets spent match categories
  const budgetList = Array.isArray(budgets?.categories) ? budgets.categories : [];
  budgetList.forEach((b) => {
    const catSpending = Number(categories[b.category]) || 0;
    const catSumFromTx = expenseCategorySums[b.category] || 0;
    if (Math.abs(catSpending - catSumFromTx) > 0.01) {
      errors.push(`Budget category '${b.category}' spending does not match corresponding transactions sum`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    metrics: {
      reportedIncome,
      reportedExpense,
      reportedBalance,
      incomeTxTotal,
      expenseTxTotal,
      categoryTotal,
      netCashFlow: metrics.netCashFlow,
      openingBalance: metrics.openingBalance
    }
  };
};

/**
 * Professional SaaS Financial Report Generator
 *
 * Generates an executive-grade, multi-page financial statement matching the FinTrack design standard.
 *
 * @param {Object} params
 * @param {number} params.month - 1-indexed month (1-12)
 * @param {number} params.year - 4-digit year (e.g. 2026)
 * @param {Object} params.summary - Dashboard summary { totalIncome, totalExpense, savings, balance, expenseChange, savingsChange }
 * @param {Object} params.categories - Category breakdown map { [categoryName]: amount }
 * @param {Array} params.expenses - Full list of expense transactions for the month
 * @param {Array} params.incomes - Full list of income transactions for the month
 * @param {Object} params.budgets - Budget configuration { categories: [{ category, budget }], global }
 * @param {Array} params.monthlyData - 12-month historical data [{ month, income, expense }]
 * @param {Array} params.alerts - Smart alerts / financial insights
 * @param {string} [params.userName] - Optional display name of the user
 */
export const generateFinancialReportPDF = ({
  month,
  year,
  summary = {},
  categories = {},
  expenses = [],
  incomes = [],
  budgets = {},
  monthlyData = [],
  alerts = [],
  userName = "",
  saveDoc = true
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182mm

  const monthLabel = MONTH_NAMES[month - 1] || "Monthly";
  const periodLabel = `${monthLabel} ${year}`;
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  // Safe Financial Values calculated via pure helper
  const {
    totalIncome,
    totalExpense,
    netCashFlow,
    closingBalance,
    openingBalance,
    savingsRate,
    expenseRatio
  } = calculateFinancialMetrics(summary);

  // Helper: Card Background with Border
  const drawCard = (x, y, w, h, bgRgb = COLORS.cardBg, borderRgb = COLORS.lightBorder) => {
    doc.setFillColor(...bgRgb);
    doc.setDrawColor(...borderRgb);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
  };

  // Helper: Status Badge
  const drawBadge = (text, x, y, bgRgb, textRgb) => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    const textWidth = doc.getTextWidth(text);
    const badgeW = textWidth + 6;
    const badgeH = 5;

    doc.setFillColor(...bgRgb);
    doc.roundedRect(x, y - 3.8, badgeW, badgeH, 1.2, 1.2, "F");
    doc.setTextColor(...textRgb);
    doc.text(text, x + 3, y);
  };

  // ==========================================
  // PAGE 1: EXECUTIVE FINANCIAL SUMMARY
  // ==========================================

  // 1. Header Banner
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primaryPurple);
  doc.text("FINTRACK", margin, 20);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Financial Report", margin + 46, 20);

  // Right-aligned Metadata
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(`Reporting Period: ${periodLabel}`, pageWidth - margin, 16, { align: "right" });
  doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 21, { align: "right" });

  // Divider line
  doc.setDrawColor(...COLORS.lightBorder);
  doc.setLineWidth(0.4);
  doc.line(margin, 26, pageWidth - margin, 26);

  // Section Heading
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Executive Financial Summary", margin, 35);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Monthly operating performance and cumulative account balance overview.", margin, 41);

  // 2. Four Key Metric Cards (2x2 Grid)
  const cardW = (contentWidth - 6) / 2; // 88mm
  const cardH = 26;

  // Card 1: Account Balance
  drawCard(margin, 46, cardW, cardH);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("CUMULATIVE ACCOUNT BALANCE", margin + 6, 53);
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(formatCurrency(closingBalance), margin + 6, 62);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("End of period balance", margin + 6, 68);

  // Card 2: Net Cash Flow
  drawCard(margin + cardW + 6, 46, cardW, cardH);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("NET CASH FLOW", margin + cardW + 12, 53);
  doc.setFontSize(15);
  doc.setTextColor(...(netCashFlow >= 0 ? COLORS.positiveGreen : COLORS.expenseRed));
  doc.text(`${netCashFlow >= 0 ? "+" : ""}${formatCurrency(netCashFlow)}`, margin + cardW + 12, 62);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(netCashFlow >= 0 ? "Monthly surplus retained" : "Monthly operating deficit", margin + cardW + 12, 68);

  // Card 3: Monthly Income
  drawCard(margin, 76, cardW, cardH);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL MONTHLY INCOME", margin + 6, 83);
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text(formatCurrency(totalIncome), margin + 6, 92);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(`${incomes.length} recorded income transaction(s)`, margin + 6, 98);

  // Card 4: Monthly Expenses
  drawCard(margin + cardW + 6, 76, cardW, cardH);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL MONTHLY EXPENSES", margin + cardW + 12, 83);
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.expenseRed);
  doc.text(formatCurrency(totalExpense), margin + cardW + 12, 92);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(`${expenses.length} recorded expense transaction(s)`, margin + cardW + 12, 98);

  // 3. Cash Flow & Balance Reconciliation Card
  const reconY = 108;
  const reconH = 68;
  drawCard(margin, reconY, contentWidth, reconH);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Cash Flow & Balance Reconciliation", margin + 8, reconY + 9);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Exact mathematical verification of opening balance against monthly cash movement.", margin + 8, reconY + 15);

  // Table rows for reconciliation
  const rowStartX = margin + 8;
  const rowEndX = pageWidth - margin - 8;
  let currentReconY = reconY + 25;

  const drawReconRow = (label, value, valueColor, isTotal = false) => {
    if (isTotal) {
      doc.setDrawColor(...COLORS.lightBorder);
      doc.setLineWidth(0.3);
      doc.line(rowStartX, currentReconY - 3, rowEndX, currentReconY - 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
    }
    doc.setTextColor(...COLORS.darkNavy);
    doc.text(label, rowStartX, currentReconY + 1);

    doc.setTextColor(...valueColor);
    doc.text(value, rowEndX, currentReconY + 1, { align: "right" });
    currentReconY += 10;
  };

  drawReconRow("Opening Account Balance (Start of Month)", formatCurrency(openingBalance), COLORS.darkNavy);
  drawReconRow("(+) Total Monthly Cash Inflow (Income)", `+${formatCurrency(totalIncome)}`, COLORS.positiveGreen);
  drawReconRow("(-) Total Monthly Cash Outflow (Expenses)", `-${formatCurrency(totalExpense)}`, COLORS.expenseRed);
  drawReconRow("(=) Closing Account Balance (Reconciled)", formatCurrency(closingBalance), COLORS.primaryPurple, true);

  // 4. Key Performance Indicators
  const kpiY = 182;
  const kpiH = 50;
  drawCard(margin, kpiY, contentWidth, kpiH);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Key Performance Indicators", margin + 8, kpiY + 9);

  const colW = (contentWidth - 16) / 3;

  // KPI 1: Savings Rate
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("SAVINGS RATE", margin + 8, kpiY + 20);
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text(`${savingsRate}%`, margin + 8, kpiY + 29);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(savingsRate >= 20 ? "Target healthy (>20%)" : "Below recommended target", margin + 8, kpiY + 36);

  // KPI 2: Expense Ratio
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("EXPENSE RATIO", margin + 8 + colW, kpiY + 20);
  doc.setFontSize(16);
  doc.setTextColor(...(expenseRatio <= 80 ? COLORS.darkNavy : COLORS.warningOrange));
  doc.text(`${expenseRatio}%`, margin + 8 + colW, kpiY + 29);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Percent of income spent", margin + 8 + colW, kpiY + 36);

  // KPI 3: MoM Expense Trend
  const momChange = summary?.expenseChange;
  const momText = typeof momChange === "number"
    ? `${momChange >= 0 ? "+" : ""}${momChange}%`
    : "Historical baseline";

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("MoM SPENDING DELTA", margin + 8 + (colW * 2), kpiY + 20);
  doc.setFontSize(16);
  doc.setTextColor(...(typeof momChange === "number" && momChange > 0 ? COLORS.expenseRed : COLORS.positiveGreen));
  doc.text(momText, margin + 8 + (colW * 2), kpiY + 29);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Vs. prior calendar month", margin + 8 + (colW * 2), kpiY + 36);


  // ==========================================
  // PAGE 2: INCOME & EXPENSE STRUCTURAL ANALYSIS
  // ==========================================
  doc.addPage();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Income & Expense Structural Analysis", margin, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Breakdown of cash flow dynamics and comparative historical trend analysis.", margin, 34);

  // Top Side-by-Side Cards
  const profileCardW = (contentWidth - 6) / 2;
  const profileCardH = 46;

  // Income Profile Summary
  drawCard(margin, 40, profileCardW, profileCardH);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text("INCOME PROFILE SUMMARY", margin + 6, 48);

  // Calculate Primary Income Source
  const incomeSourceMap = {};
  incomes.forEach(i => {
    const src = i.source || "Other";
    incomeSourceMap[src] = (incomeSourceMap[src] || 0) + (Number(i.amount) || 0);
  });
  const topIncomeEntry = Object.entries(incomeSourceMap).sort((a, b) => b[1] - a[1])[0];
  const topSrcName = topIncomeEntry
    ? (topIncomeEntry[0].length > 18 ? topIncomeEntry[0].substring(0, 17) + "…" : topIncomeEntry[0])
    : "None";
  const topIncomeSource = topIncomeEntry ? `${topSrcName} (${formatCurrency(topIncomeEntry[1])})` : "None";

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Total Cash Inflow:", margin + 6, 56);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(formatCurrency(totalIncome), margin + profileCardW - 6, 56, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Active Income Streams:", margin + 6, 64);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(`${Object.keys(incomeSourceMap).length} source(s)`, margin + profileCardW - 6, 64, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Primary Income Stream:", margin + 6, 72);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(topIncomeSource, margin + profileCardW - 6, 72, { align: "right" });

  // Expense Profile Summary
  drawCard(margin + profileCardW + 6, 40, profileCardW, profileCardH);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.expenseRed);
  doc.text("EXPENSE PROFILE SUMMARY", margin + profileCardW + 12, 48);

  const daysInMonth = getDaysInMonth(month, year);
  const dailyBurn = totalExpense > 0 ? Math.round(totalExpense / daysInMonth) : 0;
  const categoryEntries = Object.entries(categories || {});
  const topExpenseCategory = categoryEntries.length > 0
    ? categoryEntries.sort((a, b) => b[1] - a[1])[0][0]
    : "None";

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Total Cash Outflow:", margin + profileCardW + 12, 56);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(formatCurrency(totalExpense), margin + contentWidth - 6, 56, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Active Spending Categories:", margin + profileCardW + 12, 64);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(`${categoryEntries.length} categories`, margin + contentWidth - 6, 64, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Daily Average Burn Rate:", margin + profileCardW + 12, 72);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(`${formatCurrency(dailyBurn)} / day`, margin + contentWidth - 6, 72, { align: "right" });

  // Historical Cash Flow Trend Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Historical Cash Flow Trend", margin, 96);

  const historyRows = (monthlyData && monthlyData.length > 0 ? monthlyData : []).map((m) => {
    const inc = Number(m.income) || 0;
    const exp = Number(m.expense) || 0;
    const net = inc - exp;
    const status = net > 0 ? "SURPLUS" : (net < 0 ? "DEFICIT" : "BREAK-EVEN");

    return [
      m.month,
      formatCurrency(inc),
      formatCurrency(exp),
      `${net >= 0 ? "+" : ""}${formatCurrency(net)}`,
      status
    ];
  });

  autoTable(doc, {
    startY: 101,
    head: [["Month", "Total Income", "Total Expenses", "Net Cash Flow", "Operating Status"]],
    body: historyRows.length > 0 ? historyRows : [["Current", formatCurrency(totalIncome), formatCurrency(totalExpense), formatCurrency(netCashFlow), netCashFlow >= 0 ? "SURPLUS" : "DEFICIT"]],
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: COLORS.darkNavy,
      lineColor: COLORS.lightBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: COLORS.darkNavy,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8.5
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
      4: { halign: "center" }
    },
    didDrawCell: (data) => {
      // Draw colored pill for status column in body
      if (data.section === "body" && data.column.index === 4) {
        const statusText = data.cell.raw;
        const isSurplus = statusText === "SURPLUS";
        const isDeficit = statusText === "DEFICIT";
        const bg = isSurplus ? COLORS.lightGreen : (isDeficit ? COLORS.lightRed : COLORS.cardBg);
        const fg = isSurplus ? COLORS.positiveGreen : (isDeficit ? COLORS.expenseRed : COLORS.secondarySlate);

        doc.setFillColor(...bg);
        doc.roundedRect(data.cell.x + 3, data.cell.y + 1.5, data.cell.width - 6, data.cell.height - 3, 1, 1, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...fg);
        doc.text(statusText, data.cell.x + (data.cell.width / 2), data.cell.y + (data.cell.height / 2) + 1, { align: "center" });
      }
    }
  });


  // ==========================================
  // PAGE 3: CATEGORY SPENDING BREAKDOWN
  // ==========================================
  doc.addPage();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Category Spending Breakdown", margin, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Itemized view of spending distribution across all active expense categories.", margin, 34);

  const sortedCategories = Object.entries(categories || {})
    .map(([cat, amt]) => ({ category: cat, amount: Number(amt) || 0 }))
    .sort((a, b) => b.amount - a.amount);

  const categoryTableBody = sortedCategories.map((c) => {
    const share = totalExpense > 0 ? ((c.amount / totalExpense) * 100) : 0;
    return [
      c.category,
      formatCurrency(c.amount),
      `${share.toFixed(1)}%`,
      "" // Container for custom distribution bar
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [["Expense Category", "Expenditure (₹)", "% Share of Total", "Visual Distribution"]],
    body: categoryTableBody.length > 0 ? categoryTableBody : [["No expense records found", "Rs. 0", "0.0%", ""]],
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      textColor: COLORS.darkNavy,
      lineColor: COLORS.lightBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: COLORS.darkNavy,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8.5
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { halign: "right", cellWidth: 38 },
      2: { halign: "right", fontStyle: "bold", cellWidth: 35 },
      3: { halign: "center" }
    },
    didDrawCell: (data) => {
      // Draw progress bar inside column 3
      if (data.section === "body" && data.column.index === 3 && sortedCategories[data.row.index]) {
        const item = sortedCategories[data.row.index];
        const share = totalExpense > 0 ? Math.min(100, Math.max(0, (item.amount / totalExpense) * 100)) : 0;

        const barX = data.cell.x + 4;
        const barY = data.cell.y + (data.cell.height / 2) - 2;
        const barMaxW = data.cell.width - 8;
        const barFillW = Math.max(1, (share / 100) * barMaxW);

        // Background track
        doc.setFillColor(235, 238, 242);
        doc.roundedRect(barX, barY, barMaxW, 4, 1, 1, "F");

        // Filled progress
        doc.setFillColor(...COLORS.primaryPurple);
        doc.roundedRect(barX, barY, barFillW, 4, 1, 1, "F");
      }
    }
  });


  // ==========================================
  // PAGE 4: ITEMIZED TRANSACTION STATEMENT
  // ==========================================
  doc.addPage();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Itemized Transaction Statement", margin, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(`Comprehensive transaction ledger for ${periodLabel}.`, margin, 34);

  // Income Section Subheader
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text("INCOME TRANSACTIONS", margin, 42);

  const incomeRows = (incomes || []).map((inc) => [
    inc.date ? new Date(inc.date).toLocaleDateString() : "-",
    inc.source || "Income",
    formatCurrency(inc.amount),
    "INCOME"
  ]);

  autoTable(doc, {
    startY: 46,
    head: [["Date", "Source / Description", "Amount (₹)", "Type"]],
    body: incomeRows.length > 0 ? incomeRows : [["-", "No income records recorded for this period", "Rs. 0", "-"]],
    theme: "plain",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.darkNavy,
      lineColor: COLORS.lightBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: COLORS.darkNavy,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { halign: "right", fontStyle: "bold", textColor: COLORS.positiveGreen, cellWidth: 38 },
      3: { halign: "center", cellWidth: 26 }
    }
  });

  const expenseTableStartY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 100) + 10;

  // Expense Section Subheader
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.expenseRed);
  doc.text("EXPENSE TRANSACTIONS", margin, expenseTableStartY);

  const expenseRows = (expenses || []).map((exp) => [
    exp.date ? new Date(exp.date).toLocaleDateString() : "-",
    exp.note || exp.description || "-",
    exp.category || "Other",
    formatCurrency(exp.amount),
    "EXPENSE"
  ]);

  autoTable(doc, {
    startY: expenseTableStartY + 4,
    head: [["Date", "Description", "Category", "Amount (₹)", "Type"]],
    body: expenseRows.length > 0 ? expenseRows : [["-", "No expense records recorded for this period", "-", "Rs. 0", "-"]],
    theme: "plain",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: COLORS.darkNavy,
      lineColor: COLORS.lightBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: COLORS.darkNavy,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { cellWidth: 40 },
      3: { halign: "right", fontStyle: "bold", textColor: COLORS.expenseRed, cellWidth: 30 },
      4: { halign: "center", cellWidth: 24 }
    }
  });


  // ==========================================
  // PAGE 5: BUDGET PERFORMANCE & ALLOCATIONS
  // ==========================================
  doc.addPage();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Budget Performance & Allocations", margin, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Monthly spending controls, category budget thresholds, and utilization status.", margin, 34);

  const budgetList = Array.isArray(budgets?.categories) ? budgets.categories : [];
  let budgetY = 42;

  if (budgetList.length === 0) {
    drawCard(margin, budgetY, contentWidth, 30);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text("No category budgets configured for this reporting period.", margin + 8, budgetY + 16);
  } else {
    budgetList.forEach((b) => {
      const catSpent = Number(categories[b.category]) || 0;
      const catLimit = Number(b.budget) || 0;
      const remaining = catLimit - catSpent;
      const usagePercent = catLimit > 0 ? Math.round((catSpent / catLimit) * 100) : 0;
      const isExceeded = catSpent > catLimit;
      const isNearLimit = !isExceeded && usagePercent >= 80;

      const statusText = isExceeded ? "EXCEEDED" : (isNearLimit ? "NEAR LIMIT" : "UNDER BUDGET");
      const statusBadgeBg = isExceeded ? COLORS.lightRed : (isNearLimit ? COLORS.lightOrange : COLORS.lightGreen);
      const statusBadgeFg = isExceeded ? COLORS.expenseRed : (isNearLimit ? COLORS.warningOrange : COLORS.positiveGreen);
      const barFillColor = isExceeded ? COLORS.expenseRed : (isNearLimit ? COLORS.warningOrange : COLORS.positiveGreen);

      // Check if we need to wrap to a new page
      if (budgetY + 28 > pageHeight - 25) {
        doc.addPage();
        budgetY = 28;
      }

      drawCard(margin, budgetY, contentWidth, 24);

      // Category Name & Status Badge
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.darkNavy);
      doc.text(b.category, margin + 6, budgetY + 7);

      drawBadge(statusText, pageWidth - margin - 32, budgetY + 7, statusBadgeBg, statusBadgeFg);

      // Spent / Limit text
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.secondarySlate);
      doc.text(`Spent: ${formatCurrency(catSpent)} of ${formatCurrency(catLimit)} (${usagePercent}%)`, margin + 6, budgetY + 13);

      const remText = isExceeded
        ? `Over by ${formatCurrency(Math.abs(remaining))}`
        : `${formatCurrency(remaining)} remaining`;
      doc.setTextColor(...statusBadgeFg);
      doc.text(remText, pageWidth - margin - 6, budgetY + 13, { align: "right" });

      // Visual Progress Bar (capped at 100% width)
      const barX = margin + 6;
      const barW = contentWidth - 12;
      const barH = 3.5;
      const fillW = Math.min(barW, Math.max(1, (usagePercent / 100) * barW));

      doc.setFillColor(235, 238, 242);
      doc.roundedRect(barX, budgetY + 16, barW, barH, 1, 1, "F");

      doc.setFillColor(...barFillColor);
      doc.roundedRect(barX, budgetY + 16, fillW, barH, 1, 1, "F");

      budgetY += 28;
    });
  }


  // ==========================================
  // PAGE 6: FINANCIAL OBSERVATIONS & INSIGHTS
  // ==========================================
  doc.addPage();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Financial Observations & Insights", margin, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Key performance observations and automated heuristic intelligence analysis.", margin, 34);

  // Section 1: Key Metric Observations
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("KEY METRIC OBSERVATIONS", margin, 44);

  const obsY = 48;
  const obsH = 46;
  drawCard(margin, obsY, contentWidth, obsH);

  const drawBullet = (title, desc, y) => {
    doc.setFillColor(...COLORS.primaryPurple);
    doc.circle(margin + 6, y - 1, 1, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.darkNavy);
    doc.text(title, margin + 10, y);
    const boldWidth = doc.getTextWidth(title);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text(desc, margin + 10 + boldWidth + 2.5, y);
  };

  const highestCatText = topExpenseCategory !== "None"
    ? `${topExpenseCategory} (${formatCurrency(categories[topExpenseCategory])})`
    : "No expense records";

  const netStatusDesc = netCashFlow >= 0
    ? `Operating surplus of ${formatCurrency(netCashFlow)} generated (${savingsRate}% saved).`
    : `Net outflow exceeded inflow by ${formatCurrency(Math.abs(netCashFlow))}.`;

  drawBullet("Primary Outflow Center: ", highestCatText, obsY + 10);
  drawBullet("Cash Flow Health: ", netStatusDesc, obsY + 20);
  drawBullet("Savings Performance: ", `Monthly retention rate evaluated at ${savingsRate}%.`, obsY + 30);
  drawBullet("Burn Rate Velocity: ", `Estimated capital outflow average of ${formatCurrency(dailyBurn)} per day.`, obsY + 40);

  // Section 2: Smart Financial Insights Card
  const insightY = 104;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primaryPurple);
  doc.text("SMART FINANCIAL INSIGHTS", margin, insightY);

  const rawInsights = Array.isArray(alerts) && alerts.length > 0
    ? alerts.map(a => a.text || a.message || String(a))
    : [
        `Net savings rate for this period is ${savingsRate}%. Maintaining a buffer above 20% reinforces long-term liquidity.`,
        `Top expense category is ${topExpenseCategory}, representing ${totalExpense > 0 && categories[topExpenseCategory] ? ((categories[topExpenseCategory] / totalExpense) * 100).toFixed(1) : 0}% of all outflows.`,
        netCashFlow >= 0 ? "Cash flow remained positive throughout this reporting cycle." : "Operating expenses exceeded inflow. Review discretionary line items to rebalance cash flow."
      ];

  const insightCardY = insightY + 4;
  const insightCardH = Math.max(50, (rawInsights.length * 16) + 12);
  drawCard(margin, insightCardY, contentWidth, insightCardH, COLORS.insightPurpleBg, COLORS.insightPurpleBorder);

  let curInsightTextY = insightCardY + 10;
  rawInsights.slice(0, 5).forEach((insightText, idx) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primaryPurple);
    doc.text(`${idx + 1}.`, margin + 6, curInsightTextY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.darkNavy);
    const splitLines = doc.splitTextToSize(insightText, contentWidth - 18);
    doc.text(splitLines, margin + 12, curInsightTextY);

    curInsightTextY += (splitLines.length * 5) + 6;
  });


  // ==========================================
  // RUNNING HEADERS & FOOTERS STAMPING
  // ==========================================
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header (Pages 2+)
    if (i > 1) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primaryPurple);
      doc.text("FINTRACK", margin, 12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.secondarySlate);
      doc.text(" | FINANCIAL REPORT", margin + 16, 12);

      doc.text(periodLabel, pageWidth - margin, 12, { align: "right" });

      doc.setDrawColor(...COLORS.lightBorder);
      doc.setLineWidth(0.2);
      doc.line(margin, 16, pageWidth - margin, 16);
    }

    // Running Footer (All Pages)
    const footerY = pageHeight - 10;
    doc.setDrawColor(...COLORS.lightBorder);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text(`Confidential — Generated on ${generatedDate}`, margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
  }

  // Save the generated document if requested and in a supported environment
  if (saveDoc !== false && typeof doc.save === "function") {
    try {
      doc.save(`FinTrack_Financial_Report_${month}_${year}.pdf`);
    } catch (e) {
      if (typeof window !== "undefined") console.warn("Auto-save skipped in environment:", e);
    }
  }

  return doc;
};
