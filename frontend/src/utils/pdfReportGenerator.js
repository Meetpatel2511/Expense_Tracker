import { jsPDF } from "jspdf";
import autoTableImport from "jspdf-autotable";

const autoTable = typeof autoTableImport === "function"
  ? autoTableImport
  : (autoTableImport.default?.default || autoTableImport.default || autoTableImport);

// ==========================================
// COLOR PALETTE DEFINITIONS (RGB FORMAT)
// ==========================================
export const COLORS = {
  coverBg: [11, 15, 25],              // #0B0F19 Deep Dark Navy Cover
  coverCardBg: [17, 24, 39],          // #111827 Dark Card
  coverCardBorder: [30, 41, 59],      // #1E293B
  coverPillBg: [30, 27, 75],          // #1E1B4B
  coverPillBorder: [109, 40, 217],    // #6D28D9
  coverPillFg: [196, 181, 253],       // #C4B5FD
  coverWaveFill: [24, 21, 56],        // Wave shadow fill
  coverWaveLine: [124, 58, 237],      // #7C3AED
  coverWaveDashed: [99, 102, 241],    // #6366F1

  primaryPurple: [109, 40, 217],      // #6D28D9
  accentPurple: [124, 58, 237],       // #7C3AED
  darkNavy: [15, 23, 42],             // #0F172A Slate 900
  secondarySlate: [100, 116, 139],    // #64748B Slate 500
  subduedSlate: [148, 163, 184],      // #94A3B8 Slate 400
  lightBorder: [226, 232, 240],       // #E2E8F0 Slate 200
  cardBg: [248, 250, 252],            // #F8FAFC Slate 50
  white: [255, 255, 255],

  positiveGreen: [5, 150, 105],       // #059669
  lightGreen: [209, 250, 229],        // #D1FAE5
  expenseRed: [220, 38, 38],          // #DC2626
  lightRed: [254, 226, 226],          // #FEE2E2
  warningOrange: [217, 119, 6],       // #D97706
  lightOrange: [254, 243, 199],       // #FEF3C7

  donutColors: [
    [109, 40, 217], // Purple
    [59, 130, 246],  // Blue
    [14, 165, 233],  // Sky
    [245, 158, 11],  // Amber
    [236, 72, 153],  // Pink
    [16, 185, 129],  // Emerald
    [139, 92, 246],  // Violet
    [100, 116, 139]  // Slate
  ]
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

  // 5. Cash flow reconciliation
  const metrics = calculateFinancialMetrics(summary);
  const calculatedClosing = metrics.openingBalance + reportedIncome - reportedExpense;
  if (Math.abs(calculatedClosing - reportedBalance) > 0.01) {
    errors.push(`Balance equation failed: opening (${metrics.openingBalance}) + income (${reportedIncome}) - expense (${reportedExpense}) !== closing (${reportedBalance})`);
  }

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
 * 11-Page Executive Financial Report Generator
 *
 * Implements the approved FinTrack Executive Financial Report design specification.
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
  healthScore = null,
  recurringExpenses = [],
  familyData = null,
  userName = "",
  currency = "INR",
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

  // Derived Financial Values
  const {
    totalIncome,
    totalExpense,
    netCashFlow,
    closingBalance,
    openingBalance,
    savingsRate,
    expenseRatio
  } = calculateFinancialMetrics(summary);

  const sortedCategories = calculateCategoryDistribution(categories, totalExpense);
  const topSpendingCategory = sortedCategories.length > 0 ? sortedCategories[0].category : "None";
  const topSpendingAmount = sortedCategories.length > 0 ? sortedCategories[0].amount : 0;

  // Month-over-Month Comparative Values
  const incomeChangeVal = summary?.incomeChange;
  const incomeChangeText = typeof incomeChangeVal === "number"
    ? `${incomeChangeVal >= 0 ? "+" : ""}${incomeChangeVal}% vs last period`
    : "Baseline period";

  const expenseChangeVal = summary?.expenseChange;
  const expenseChangeText = typeof expenseChangeVal === "number"
    ? `${expenseChangeVal >= 0 ? "+" : ""}${expenseChangeVal}% vs last period`
    : "Baseline period";

  // Health Score Determination
  const healthScoreNum = typeof healthScore?.score === "number" ? healthScore.score : (savingsRate >= 20 ? 82 : (savingsRate > 0 ? 68 : 45));
  const healthStatusText = healthScore?.status || (healthScoreNum >= 85 ? "Excellent" : (healthScoreNum >= 70 ? "Strong Position" : (healthScoreNum >= 50 ? "Fair" : "Needs Attention")));
  const healthSummaryText = healthScore?.tips && healthScore.tips.length > 0
    ? healthScore.tips[0]
    : (netCashFlow >= 0
        ? "Your spending remained within your income during the selected period, leading to positive net savings accumulation."
        : "Operating expenses exceeded monthly income during this period. Review discretionary line items to rebalance cash flow.");

  // Reusable Layout Primitives
  const drawCard = (x, y, w, h, bgRgb = COLORS.cardBg, borderRgb = COLORS.lightBorder, radius = 2) => {
    doc.setFillColor(...bgRgb);
    doc.setDrawColor(...borderRgb);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, radius, radius, "FD");
  };

  const drawPill = (text, x, y, bgRgb, fgRgb, fontSize = 7) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    const textWidth = doc.getTextWidth(text);
    const badgeW = textWidth + 6;
    const badgeH = 5;

    doc.setFillColor(...bgRgb);
    doc.roundedRect(x, y - 3.8, badgeW, badgeH, 1.2, 1.2, "F");
    doc.setTextColor(...fgRgb);
    doc.text(text, x + 3, y);
    return badgeW;
  };

  const drawPageHeader = (title, subtitle) => {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.darkNavy);
    doc.text(title, margin, 28);

    if (subtitle) {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.secondarySlate);
      doc.text(subtitle, margin, 34);
    }
  };

  // ==========================================
  // PAGE 1: COVER (Dark Navy #0B0F19)
  // ==========================================
  doc.setFillColor(...COLORS.coverBg);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // FinTrack Logo & Brand
  doc.setFillColor(...COLORS.primaryPurple);
  doc.roundedRect(margin, 20, 9, 9, 2, 2, "F");
  doc.setFillColor(...COLORS.white);
  doc.rect(margin + 2.2, 23.5, 1.2, 4, "F");
  doc.rect(margin + 3.9, 22, 1.2, 5.5, "F");
  doc.rect(margin + 5.6, 24.5, 1.2, 3, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("FinTrack", margin + 12, 26.5);

  // Executive Financial Report Pill
  drawPill("EXECUTIVE FINANCIAL REPORT", pageWidth - margin - 58, 26, COLORS.coverPillBg, COLORS.coverPillFg, 7);

  // Cover Main Title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("Your Financial", margin, 105);
  doc.text("Overview", margin, 117);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("Personal finance summary and insights", margin, 126);

  // Wave Chart Hero Box
  const waveBoxY = 138;
  const waveBoxH = 68;
  doc.setFillColor(...COLORS.coverCardBg);
  doc.setDrawColor(...COLORS.coverCardBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, waveBoxY, contentWidth, waveBoxH, 3, 3, "FD");

  // Dynamic vector wave lines
  const waveStartX = margin + 8;
  const waveEndX = pageWidth - margin - 8;
  const waveWidth = waveEndX - waveStartX;
  const waveBaseY = waveBoxY + waveBoxH - 12;

  // Wave 1: Filled Area / Translucent base
  doc.setFillColor(...COLORS.coverWaveFill);
  const wavePoints = [
    [waveStartX, waveBaseY],
    [waveStartX + (waveWidth * 0.25), waveBaseY - 14],
    [waveStartX + (waveWidth * 0.5), waveBaseY - 6],
    [waveStartX + (waveWidth * 0.75), waveBaseY - 22],
    [waveEndX, waveBaseY - 12],
    [waveEndX, waveBaseY],
    [waveStartX, waveBaseY]
  ];
  doc.lines(
    wavePoints.slice(1).map((pt, idx) => [pt[0] - wavePoints[idx][0], pt[1] - wavePoints[idx][1]]),
    waveStartX,
    waveBaseY,
    [1, 1],
    "F"
  );

  // Wave 2: Solid Accent Curve
  doc.setDrawColor(...COLORS.coverWaveLine);
  doc.setLineWidth(0.8);
  doc.line(waveStartX, waveBaseY - 2, waveStartX + (waveWidth * 0.25), waveBaseY - 14);
  doc.line(waveStartX + (waveWidth * 0.25), waveBaseY - 14, waveStartX + (waveWidth * 0.5), waveBaseY - 6);
  doc.line(waveStartX + (waveWidth * 0.5), waveBaseY - 6, waveStartX + (waveWidth * 0.75), waveBaseY - 22);
  doc.line(waveStartX + (waveWidth * 0.75), waveBaseY - 22, waveEndX, waveBaseY - 12);

  // Highlight points
  doc.setFillColor(...COLORS.white);
  doc.circle(waveStartX + (waveWidth * 0.75), waveBaseY - 22, 1.2, "F");
  doc.circle(waveStartX + (waveWidth * 0.25), waveBaseY - 14, 1, "F");

  // Bottom Info Cards on Cover
  const coverCardW = (contentWidth - 8) / 2;
  const coverCardY = 232;
  const coverCardH = 28;

  // Report Period Card
  doc.setFillColor(...COLORS.coverCardBg);
  doc.setDrawColor(...COLORS.coverCardBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, coverCardY, coverCardW, coverCardH, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("REPORT PERIOD", margin + 6, coverCardY + 8);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(periodLabel, margin + 6, coverCardY + 16);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text(`Synchronized Ledger`, margin + 6, coverCardY + 22);

  // Prepared For Card
  doc.roundedRect(margin + coverCardW + 8, coverCardY, coverCardW, coverCardH, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("PREPARED FOR", margin + coverCardW + 14, coverCardY + 8);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(userName || "Account Holder", margin + coverCardW + 14, coverCardY + 16);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("Account Holder", margin + coverCardW + 14, coverCardY + 22);

  // Cover Footer
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("Generated by FinTrack", margin, pageHeight - 12);
  doc.text("Confidential Executive Report", pageWidth / 2, pageHeight - 12, { align: "center" });
  doc.text("Page 1 of 11", pageWidth - margin, pageHeight - 12, { align: "right" });


  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ==========================================
  doc.addPage();
  drawPageHeader("Executive Summary", "A concise overview of your financial activity.");

  // Top 3 Metric Cards
  const summaryCardW = (contentWidth - 8) / 3;
  const summaryCardH = 30;
  const summaryCardY = 44;

  // 1. Total Income
  drawCard(margin, summaryCardY, summaryCardW, summaryCardH);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL INCOME", margin + 6, summaryCardY + 8);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(formatCurrency(totalIncome), margin + 6, summaryCardY + 17);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text(incomeChangeText, margin + 6, summaryCardY + 24);

  // 2. Total Expenses
  drawCard(margin + summaryCardW + 4, summaryCardY, summaryCardW, summaryCardH);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL EXPENSES", margin + summaryCardW + 10, summaryCardY + 8);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(formatCurrency(totalExpense), margin + summaryCardW + 10, summaryCardY + 17);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...(expenseChangeVal > 0 ? COLORS.expenseRed : COLORS.positiveGreen));
  doc.text(expenseChangeText, margin + summaryCardW + 10, summaryCardY + 24);

  // 3. Net Savings
  drawCard(margin + (summaryCardW * 2) + 8, summaryCardY, summaryCardW, summaryCardH);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("NET SAVINGS", margin + (summaryCardW * 2) + 14, summaryCardY + 8);
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primaryPurple);
  doc.text(formatCurrency(netCashFlow), margin + (summaryCardW * 2) + 14, summaryCardY + 17);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...(netCashFlow >= 0 ? COLORS.positiveGreen : COLORS.expenseRed));
  doc.text(netCashFlow >= 0 ? "Positive Cashflow" : "Deficit Cashflow", margin + (summaryCardW * 2) + 14, summaryCardY + 24);

  // Financial Health Assessment Card
  const healthY = 82;
  const healthH = 78;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Financial Health Assessment", margin, healthY - 3);

  drawCard(margin, healthY, contentWidth, healthH);

  // Circular Score Ring Gauge
  const gaugeCenterX = margin + 36;
  const gaugeCenterY = healthY + 39;
  const gaugeRadius = 22;

  // Background ring
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(4);
  doc.circle(gaugeCenterX, gaugeCenterY, gaugeRadius, "S");

  // Filled arc representing score
  doc.setDrawColor(...COLORS.accentPurple);
  doc.setLineWidth(4);
  const arcAngle = (healthScoreNum / 100) * 2 * Math.PI;
  // Draw arc approximation
  const arcSegments = 24;
  for (let s = 0; s < arcSegments; s++) {
    const startA = -Math.PI / 2 + (s * (arcAngle / arcSegments));
    const endA = -Math.PI / 2 + ((s + 1) * (arcAngle / arcSegments));
    doc.line(
      gaugeCenterX + (gaugeRadius * Math.cos(startA)),
      gaugeCenterY + (gaugeRadius * Math.sin(startA)),
      gaugeCenterX + (gaugeRadius * Math.cos(endA)),
      gaugeCenterY + (gaugeRadius * Math.sin(endA))
    );
  }

  // Inner Score Text
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(String(healthScoreNum), gaugeCenterX, gaugeCenterY + 2, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("OUT OF 100", gaugeCenterX, gaugeCenterY + 8, { align: "center" });

  // Right Details Column
  const detailX = margin + 74;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Status: ", detailX, healthY + 22);
  doc.setTextColor(...COLORS.accentPurple);
  doc.text(healthStatusText, detailX + 16, healthY + 22);

  drawPill(healthStatusText, detailX + 16 + doc.getTextWidth(healthStatusText) + 4, healthY + 22, COLORS.lightGreen, COLORS.positiveGreen, 7);

  // Vertical decorative separator
  doc.setDrawColor(...COLORS.primaryPurple);
  doc.setLineWidth(1.5);
  doc.line(detailX, healthY + 30, detailX, healthY + 62);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  const splitSummary = doc.splitTextToSize(healthSummaryText, contentWidth - 84);
  doc.text(splitSummary, detailX + 5, healthY + 36);

  // Executive Note Box
  const noteY = 170;
  const noteH = 26;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, noteY, contentWidth, noteH, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primaryPurple);
  doc.text("EXECUTIVE NOTE", margin + 6, noteY + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.darkNavy);
  const noteBody = `This report compiles real-time ledger entries for period ${periodLabel}. All dynamic figures are computed using verified transaction events.`;
  const splitNote = doc.splitTextToSize(noteBody, contentWidth - 12);
  doc.text(splitNote, margin + 6, noteY + 15);


  // ==========================================
  // PAGE 3: INCOME & EXPENSE OVERVIEW
  // ==========================================
  doc.addPage();
  drawPageHeader("Income & Expense Overview", "Cash flow trends across the selected period.");

  // Cash Flow Trends Chart Card
  const chartCardY = 44;
  const chartCardH = 135;
  drawCard(margin, chartCardY, contentWidth, chartCardH);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("Monthly Cash Flow Trends", margin + 8, chartCardY + 10);

  // Legend
  const legendY = chartCardY + 10;
  const legendRightX = pageWidth - margin - 8;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");

  // Legend Item 3: Net Savings
  doc.setFillColor(...COLORS.primaryPurple);
  doc.rect(legendRightX - 22, legendY - 3, 3, 3, "F");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Net Savings", legendRightX - 17, legendY);

  // Legend Item 2: Expenses
  doc.setFillColor(...COLORS.expenseRed);
  doc.rect(legendRightX - 48, legendY - 3, 3, 3, "F");
  doc.text("Expenses", legendRightX - 43, legendY);

  // Legend Item 1: Income
  doc.setFillColor(...COLORS.positiveGreen);
  doc.rect(legendRightX - 72, legendY - 3, 3, 3, "F");
  doc.text("Income", legendRightX - 67, legendY);

  // Vector Chart Plot Area
  const plotX = margin + 20;
  const plotY = chartCardY + 22;
  const plotW = contentWidth - 28;
  const plotH = 88;

  // Prepare monthly trend data (up to last 6 months or fallback)
  const trendsToRender = Array.isArray(monthlyData) && monthlyData.length > 0
    ? monthlyData.slice(-6)
    : [
        { month: monthLabel, income: totalIncome, expense: totalExpense }
      ];

  const maxVal = Math.max(
    ...trendsToRender.map(t => Math.max(Number(t.income) || 0, Number(t.expense) || 0)),
    10000
  );
  const chartMax = Math.ceil(maxVal / 25000) * 25000 || 50000;

  // Grid lines & Y-Axis Labels
  const gridSteps = 4;
  doc.setDrawColor(...COLORS.lightBorder);
  doc.setLineWidth(0.2);

  for (let g = 0; g <= gridSteps; g++) {
    const stepY = plotY + (plotH * (1 - (g / gridSteps)));
    const stepVal = (chartMax / gridSteps) * g;
    const formattedVal = stepVal >= 1000 ? `₹${Math.round(stepVal / 1000)}k` : `₹${stepVal}`;

    doc.line(plotX, stepY, plotX + plotW, stepY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.subduedSlate);
    doc.text(formattedVal, plotX - 3, stepY + 1, { align: "right" });
  }

  // Draw Bars & Line
  const groupCount = trendsToRender.length;
  const groupWidth = plotW / groupCount;
  const barWidth = Math.min(10, (groupWidth * 0.35));
  const linePoints = [];

  trendsToRender.forEach((m, idx) => {
    const groupCenterX = plotX + (idx * groupWidth) + (groupWidth / 2);
    const incVal = Number(m.income) || 0;
    const expVal = Number(m.expense) || 0;
    const netVal = incVal - expVal;

    const incBarH = Math.max(1, (incVal / chartMax) * plotH);
    const expBarH = Math.max(1, (expVal / chartMax) * plotH);

    const incBarX = groupCenterX - barWidth - 1;
    const expBarX = groupCenterX + 1;

    // Income Bar (Green)
    doc.setFillColor(...COLORS.positiveGreen);
    doc.roundedRect(incBarX, plotY + plotH - incBarH, barWidth, incBarH, 0.8, 0.8, "F");

    // Expense Bar (Red)
    doc.setFillColor(...COLORS.expenseRed);
    doc.roundedRect(expBarX, plotY + plotH - expBarH, barWidth, expBarH, 0.8, 0.8, "F");

    // Net Savings Node Point
    const netY = plotY + plotH - Math.max(0, Math.min(plotH, (netVal / chartMax) * plotH));
    linePoints.push([groupCenterX, netY]);

    // X-Axis Month Label
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text(m.month || `M${idx + 1}`, groupCenterX, plotY + plotH + 6, { align: "center" });
  });

  // Connect Net Savings Line Points
  if (linePoints.length > 1) {
    doc.setDrawColor(...COLORS.primaryPurple);
    doc.setLineWidth(0.8);
    for (let p = 0; p < linePoints.length - 1; p++) {
      doc.line(linePoints[p][0], linePoints[p][1], linePoints[p + 1][0], linePoints[p + 1][1]);
    }
  }
  // Draw Line Nodes
  linePoints.forEach(pt => {
    doc.setFillColor(...COLORS.primaryPurple);
    doc.circle(pt[0], pt[1], 1.2, "F");
  });

  // 3 Bottom Average Cards
  const avgPeriodMonths = trendsToRender.length || 1;
  const avgIncomeVal = Math.round(trendsToRender.reduce((s, m) => s + (Number(m.income) || 0), 0) / avgPeriodMonths);
  const avgExpenseVal = Math.round(trendsToRender.reduce((s, m) => s + (Number(m.expense) || 0), 0) / avgPeriodMonths);
  const avgSavingsVal = avgIncomeVal - avgExpenseVal;

  const avgCardY = 188;
  const avgCardW = (contentWidth - 8) / 3;
  const avgCardH = 28;

  // Avg Monthly Income
  drawCard(margin, avgCardY, avgCardW, avgCardH);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("AVG MONTHLY INCOME", margin + 6, avgCardY + 8);
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text(formatCurrency(avgIncomeVal), margin + 6, avgCardY + 16);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(`Period: ${avgPeriodMonths} Months`, margin + 6, avgCardY + 22);

  // Avg Monthly Expenses
  drawCard(margin + avgCardW + 4, avgCardY, avgCardW, avgCardH);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("AVG MONTHLY EXPENSES", margin + avgCardW + 10, avgCardY + 8);
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.expenseRed);
  doc.text(formatCurrency(avgExpenseVal), margin + avgCardW + 10, avgCardY + 16);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(`Period: ${avgPeriodMonths} Months`, margin + avgCardW + 10, avgCardY + 22);

  // Avg Monthly Savings
  drawCard(margin + (avgCardW * 2) + 8, avgCardY, avgCardW, avgCardH);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("AVG MONTHLY SAVINGS", margin + (avgCardW * 2) + 14, avgCardY + 8);
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.primaryPurple);
  doc.text(formatCurrency(avgSavingsVal), margin + (avgCardW * 2) + 14, avgCardY + 16);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text(`Period: ${avgPeriodMonths} Months`, margin + (avgCardW * 2) + 14, avgCardY + 22);


  // ==========================================
  // PAGE 4: SPENDING BREAKDOWN
  // ==========================================
  doc.addPage();
  drawPageHeader("Spending Breakdown", "Where your money went during this period.");

  const spendSectionY = 44;
  const spendCardW = (contentWidth - 8) / 2;
  const spendCardH = 120;

  // Left Card: Expense Allocation Donut Chart
  drawCard(margin, spendSectionY, spendCardW, spendCardH);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("EXPENSE ALLOCATION", margin + 8, spendSectionY + 10);

  // Draw Vector Donut Chart
  const donutCenterX = margin + (spendCardW / 2);
  const donutCenterY = spendSectionY + 62;
  const outerR = 32;
  const innerR = 19;

  let startAngle = -Math.PI / 2;

  if (sortedCategories.length > 0 && totalExpense > 0) {
    sortedCategories.forEach((cat, idx) => {
      const sliceAngle = (cat.amount / totalExpense) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const color = COLORS.donutColors[idx % COLORS.donutColors.length];

      doc.setFillColor(...color);

      // Render arc slice
      const arcSteps = 16;
      for (let st = 0; st < arcSteps; st++) {
        const a1 = startAngle + (st * (sliceAngle / arcSteps));
        const a2 = startAngle + ((st + 1) * (sliceAngle / arcSteps));

        doc.lines([
          [outerR * Math.cos(a1), outerR * Math.sin(a1)],
          [(outerR * Math.cos(a2)) - (outerR * Math.cos(a1)), (outerR * Math.sin(a2)) - (outerR * Math.sin(a1))],
          [(innerR * Math.cos(a2)) - (outerR * Math.cos(a2)), (innerR * Math.sin(a2)) - (outerR * Math.sin(a2))],
          [(innerR * Math.cos(a1)) - (innerR * Math.cos(a2)), (innerR * Math.sin(a1)) - (innerR * Math.sin(a2))]
        ], donutCenterX, donutCenterY, [1, 1], "F");
      }
      startAngle = endAngle;
    });
  } else {
    doc.setFillColor(241, 245, 249);
    doc.circle(donutCenterX, donutCenterY, outerR, "F");
  }

  // Inner White Cutout Mask
  doc.setFillColor(...COLORS.white);
  doc.circle(donutCenterX, donutCenterY, innerR, "F");

  // Center Donut Text
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL SPENT", donutCenterX, donutCenterY - 2, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(formatCurrency(totalExpense), donutCenterX, donutCenterY + 4, { align: "center" });

  // Right Card: Categories Breakdown List
  drawCard(margin + spendCardW + 8, spendSectionY, spendCardW, spendCardH);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("CATEGORIES BREAKDOWN", margin + spendCardW + 16, spendSectionY + 10);

  let catListY = spendSectionY + 22;
  const categoriesToRender = sortedCategories.slice(0, 6);

  if (categoriesToRender.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text("No expense transactions recorded.", margin + spendCardW + 16, catListY + 8);
  } else {
    categoriesToRender.forEach((c, idx) => {
      const color = COLORS.donutColors[idx % COLORS.donutColors.length];

      // Bullet dot
      doc.setFillColor(...color);
      doc.circle(margin + spendCardW + 16, catListY - 1, 1.6, "F");

      // Category Name
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.darkNavy);
      const catDisplayName = c.category.length > 15 ? c.category.substring(0, 14) + "…" : c.category;
      doc.text(catDisplayName, margin + spendCardW + 22, catListY);

      // Amount & Percentage
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.secondarySlate);
      doc.text(`${formatCurrency(c.amount)} (${c.formattedShare})`, margin + contentWidth - 4, catListY, { align: "right" });

      catListY += 15;
    });
  }

  // Bottom Top Spending Category Card
  const topCardY = 174;
  const topCardH = 34;
  drawCard(margin, topCardY, contentWidth, topCardH);

  // Purple Left Accent Bar
  doc.setFillColor(...COLORS.primaryPurple);
  doc.roundedRect(margin + 2, topCardY + 2, 3, topCardH - 4, 1, 1, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOP SPENDING CATEGORY", margin + 12, topCardY + 9);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(topSpendingCategory, margin + 12, topCardY + 18);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Accounted for the largest share of your total outgoing funds.", margin + 12, topCardY + 26);

  drawPill("Highest Volume", pageWidth - margin - 32, topCardY + 14, COLORS.lightGreen, COLORS.positiveGreen, 7);


  // ==========================================
  // PAGE 5: BUDGET PERFORMANCE
  // ==========================================
  doc.addPage();
  drawPageHeader("Budget Performance", "Track planned spending against actual spending.");

  const budgetList = Array.isArray(budgets?.categories) ? budgets.categories : [];
  const budgetTableBody = budgetList.map(b => {
    const spent = Number(categories[b.category]) || 0;
    const limit = Number(b.budget) || 0;
    const { isExceeded, isNearLimit, remaining } = calculateBudgetProgress({ budget: limit, spent });

    const statusText = isExceeded ? "Over Budget" : (isNearLimit ? "Near Limit" : "On Track");
    const remFormatted = isExceeded ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining);

    return [
      b.category,
      formatCurrency(limit),
      formatCurrency(spent),
      remFormatted,
      "", // Container for progress bar
      statusText
    ];
  });

  if (budgetTableBody.length > 0) {
    autoTable(doc, {
      startY: 44,
      head: [["CATEGORY", "BUDGET", "SPENT", "REMAINING", "PROGRESS", "STATUS"]],
      body: budgetTableBody,
      theme: "plain",
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3.5,
        textColor: COLORS.darkNavy,
        lineColor: COLORS.lightBorder,
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: COLORS.cardBg,
        textColor: COLORS.secondarySlate,
        fontStyle: "bold",
        fontSize: 7.5
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 42 },
        1: { halign: "right", cellWidth: 26 },
        2: { halign: "right", cellWidth: 26 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 26 },
        4: { cellWidth: 32 },
        5: { halign: "center", cellWidth: 30 }
      },
      didDrawCell: (data) => {
        if (data.section === "body" && budgetList[data.row.index]) {
          const item = budgetList[data.row.index];
          const spent = Number(categories[item.category]) || 0;
          const limit = Number(item.budget) || 0;
          const { isExceeded, isNearLimit, rawPercent } = calculateBudgetProgress({ budget: limit, spent });

          // Draw Progress Bar in Column 4
          if (data.column.index === 4) {
            const barX = data.cell.x + 2;
            const barY = data.cell.y + (data.cell.height / 2) - 1.5;
            const barW = data.cell.width - 4;
            const fillW = Math.min(barW, Math.max(1, (rawPercent / 100) * barW));
            const barColor = isExceeded ? COLORS.expenseRed : (isNearLimit ? COLORS.warningOrange : COLORS.positiveGreen);

            doc.setFillColor(241, 245, 249);
            doc.roundedRect(barX, barY, barW, 3, 0.8, 0.8, "F");
            doc.setFillColor(...barColor);
            doc.roundedRect(barX, barY, fillW, 3, 0.8, 0.8, "F");
          }

          // Draw Status Pill in Column 5
          if (data.column.index === 5) {
            const statusText = data.cell.raw;
            const bg = isExceeded ? COLORS.lightRed : (isNearLimit ? COLORS.lightOrange : COLORS.lightGreen);
            const fg = isExceeded ? COLORS.expenseRed : (isNearLimit ? COLORS.warningOrange : COLORS.positiveGreen);

            drawPill(statusText, data.cell.x + 4, data.cell.y + (data.cell.height / 2) + 1.5, bg, fg, 6.5);
          }
        }
      }
    });
  } else {
    drawCard(margin, 44, contentWidth, 34);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text("No category budgets configured for this reporting period.", margin + 8, 62);
  }

  // Overall Budget Summary Card
  const totalBudgetVal = budgetList.reduce((sum, b) => sum + (Number(b.budget) || 0), 0);
  const totalBudgetSpent = budgetList.reduce((sum, b) => sum + (Number(categories[b.category]) || 0), 0);
  const totalBudgetRemaining = totalBudgetVal - totalBudgetSpent;

  const budgetSummaryY = doc.lastAutoTable ? Math.max(140, doc.lastAutoTable.finalY + 12) : 90;
  const budgetSummaryH = 28;

  doc.setFillColor(...COLORS.darkNavy);
  doc.roundedRect(margin, budgetSummaryY, contentWidth, budgetSummaryH, 2, 2, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("OVERALL BUDGET SUMMARY", margin + 8, budgetSummaryY + 8);

  const bColW = (contentWidth - 16) / 3;

  // Total Budget
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("TOTAL BUDGET", margin + 8, budgetSummaryY + 15);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.text(formatCurrency(totalBudgetVal), margin + 8, budgetSummaryY + 22);

  // Total Spent
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("TOTAL SPENT", margin + 8 + bColW, budgetSummaryY + 15);
  doc.setFontSize(11);
  doc.setTextColor(...(totalBudgetSpent > totalBudgetVal ? COLORS.lightRed : COLORS.white));
  doc.text(formatCurrency(totalBudgetSpent), margin + 8 + bColW, budgetSummaryY + 22);

  // Remaining
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.subduedSlate);
  doc.text("REMAINING", margin + 8 + (bColW * 2), budgetSummaryY + 15);
  doc.setFontSize(11);
  doc.setTextColor(...(totalBudgetRemaining >= 0 ? COLORS.lightGreen : COLORS.lightRed));
  doc.text(totalBudgetRemaining >= 0 ? formatCurrency(totalBudgetRemaining) : `-${formatCurrency(Math.abs(totalBudgetRemaining))}`, margin + 8 + (bColW * 2), budgetSummaryY + 22);


  // ==========================================
  // PAGE 6: SMART FINANCIAL INSIGHTS
  // ==========================================
  doc.addPage();
  drawPageHeader("Smart Financial Insights", "Highlights generated from your financial activity.");

  let insightCardY = 44;
  const singleInsightH = 34;

  // 1. SPENDING ALERT Card
  drawCard(margin, insightCardY, contentWidth, singleInsightH);
  doc.setFillColor(...COLORS.expenseRed);
  doc.roundedRect(margin + 2, insightCardY + 2, 3, singleInsightH - 4, 1, 1, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.expenseRed);
  doc.text("SPENDING ALERT", margin + 10, insightCardY + 8);

  drawPill("High Priority", pageWidth - margin - 28, insightCardY + 8, COLORS.lightRed, COLORS.expenseRed, 6.5);

  const spendingAlertHeading = expenseChangeVal > 0
    ? `${topSpendingCategory} expenses increased compared with the previous period.`
    : `Total monthly expenditures remained disciplined.`;
  const spendingAlertBody = expenseChangeVal > 0
    ? `${topSpendingCategory} was your highest outflow at ${formatCurrency(topSpendingAmount)}. Consider reviewing non-essential discretionary items.`
    : `Your spending declined by ${Math.abs(expenseChangeVal || 0)}% vs the previous tracking cycle, preserving capital reserves.`;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(spendingAlertHeading, margin + 10, insightCardY + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  const splitAlertBody = doc.splitTextToSize(spendingAlertBody, contentWidth - 16);
  doc.text(splitAlertBody, margin + 10, insightCardY + 23);

  // 2. BUDGET GUIDANCE Card
  insightCardY += singleInsightH + 10;
  drawCard(margin, insightCardY, contentWidth, singleInsightH);
  doc.setFillColor(...COLORS.warningOrange);
  doc.roundedRect(margin + 2, insightCardY + 2, 3, singleInsightH - 4, 1, 1, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.warningOrange);
  doc.text("BUDGET GUIDANCE", margin + 10, insightCardY + 8);

  drawPill("Action Suggested", pageWidth - margin - 34, insightCardY + 8, COLORS.lightOrange, COLORS.warningOrange, 6.5);

  const nearLimitBudget = budgetList.find(b => {
    const s = Number(categories[b.category]) || 0;
    const l = Number(b.budget) || 0;
    return l > 0 && ((s / l) >= 0.8);
  });

  const budgetGuidanceHeading = nearLimitBudget
    ? `Your ${nearLimitBudget.category} category is approaching its monthly budget limit.`
    : `All active category allocations remained within target thresholds.`;
  const budgetGuidanceBody = nearLimitBudget
    ? `You have utilized over 80% of your ${nearLimitBudget.category} allocation for the active period. Monitor upcoming disbursements.`
    : `Budget utilization across all spending categories maintained safe headroom throughout this period.`;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(budgetGuidanceHeading, margin + 10, insightCardY + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  const splitBudgetBody = doc.splitTextToSize(budgetGuidanceBody, contentWidth - 16);
  doc.text(splitBudgetBody, margin + 10, insightCardY + 23);

  // 3. FINANCIAL HEALTH INSIGHT Card
  insightCardY += singleInsightH + 10;
  drawCard(margin, insightCardY, contentWidth, singleInsightH);
  doc.setFillColor(...COLORS.positiveGreen);
  doc.roundedRect(margin + 2, insightCardY + 2, 3, singleInsightH - 4, 1, 1, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text("FINANCIAL HEALTH INSIGHT", margin + 10, insightCardY + 8);

  drawPill("Positive Trend", pageWidth - margin - 28, insightCardY + 8, COLORS.lightGreen, COLORS.positiveGreen, 6.5);

  const healthInsightHeading = `Your savings rate was evaluated at ${savingsRate}% for the selected period.`;
  const healthInsightBody = netCashFlow >= 0
    ? `Total savings contributions aligned with planned monthly wealth accumulation targets.`
    : `Operating expenses exceeded cash inflow. Review discretionary line items to re-establish a positive savings buffer.`;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(healthInsightHeading, margin + 10, insightCardY + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  const splitHealthBody = doc.splitTextToSize(healthInsightBody, contentWidth - 16);
  doc.text(splitHealthBody, margin + 10, insightCardY + 23);


  // ==========================================
  // PAGE 7: RECURRING EXPENSES
  // ==========================================
  doc.addPage();
  drawPageHeader("Recurring Expenses", "Regular financial commitments during the reporting period.");

  const recurringList = Array.isArray(recurringExpenses) ? recurringExpenses : [];
  const recurringTableBody = recurringList.map(r => [
    r.note || r.category || "Recurring Obligation",
    r.category || "General",
    formatCurrency(r.amount),
    r.frequency || "Monthly",
    r.nextDate ? new Date(r.nextDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"
  ]);

  if (recurringTableBody.length > 0) {
    autoTable(doc, {
      startY: 44,
      head: [["EXPENSE", "CATEGORY", "AMOUNT", "FREQUENCY", "NEXT DUE"]],
      body: recurringTableBody,
      theme: "plain",
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3.5,
        textColor: COLORS.darkNavy,
        lineColor: COLORS.lightBorder,
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: COLORS.cardBg,
        textColor: COLORS.secondarySlate,
        fontStyle: "bold",
        fontSize: 7.5
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { halign: "right", fontStyle: "bold", cellWidth: 32 },
        3: { halign: "center", cellWidth: 30 },
        4: { halign: "right", cellWidth: 30 }
      }
    });
  } else {
    drawCard(margin, 44, contentWidth, 34);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text("No active recurring commitments recorded.", margin + 8, 62);
  }

  // Total Recurring Commitment Card
  const totalRecurringMonthly = recurringList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const recSummaryY = doc.lastAutoTable ? Math.max(140, doc.lastAutoTable.finalY + 12) : 90;

  drawCard(margin, recSummaryY, contentWidth, 26, COLORS.white, COLORS.primaryPurple);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primaryPurple);
  doc.text("TOTAL RECURRING COMMITMENT", margin + 8, recSummaryY + 8);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("Fixed ongoing obligations per month", margin + 8, recSummaryY + 16);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(`${formatCurrency(totalRecurringMonthly)} / mo`, pageWidth - margin - 8, recSummaryY + 15, { align: "right" });


  // ==========================================
  // PAGE 8: FAMILY FINANCE OVERVIEW
  // ==========================================
  doc.addPage();
  drawPageHeader("Family Finance Overview", "Shared financial activity and contribution overview.");

  const hasFamilyData = Boolean(
    familyData &&
    familyData.hasFamily &&
    Array.isArray(familyData.members) &&
    familyData.members.length > 0
  );

  if (hasFamilyData) {
    // OPTION A: Shared Member Contributions Table
    const familyMembers = familyData.members;
    const familyTableBody = familyMembers.map(m => [
      m.name || "Member",
      formatCurrency(m.total || 0),
      `${m.percentage || 0}%`
    ]);

    autoTable(doc, {
      startY: 44,
      head: [["MEMBER", "SHARED EXPENDITURE", "CONTRIBUTION SHARE"]],
      body: familyTableBody,
      theme: "plain",
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3.5,
        textColor: COLORS.darkNavy,
        lineColor: COLORS.lightBorder,
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: COLORS.cardBg,
        textColor: COLORS.secondarySlate,
        fontStyle: "bold",
        fontSize: 7.5
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70 },
        1: { halign: "right", fontStyle: "bold", cellWidth: 55 },
        2: { halign: "center", cellWidth: 57 }
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          drawPill(data.cell.raw, data.cell.x + 18, data.cell.y + (data.cell.height / 2) + 1.5, COLORS.lightGreen, COLORS.positiveGreen, 7);
        }
      }
    });

    // Family Total Summary Card
    const famSummaryY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 120;
    drawCard(margin, famSummaryY, contentWidth, 24);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text(`FAMILY WORKSPACE: ${familyData.familyName || "Household"}`, margin + 8, famSummaryY + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.darkNavy);
    doc.text(`Total Shared Outflow: ${formatCurrency(familyData.totalFamilyExpense || 0)}`, margin + 8, famSummaryY + 17);

  } else {
    // OPTION B: Dedicated Empty State Card
    const emptyY = 44;
    const emptyH = 55;
    drawCard(margin, emptyY, contentWidth, emptyH);

    doc.setFillColor(241, 245, 249);
    doc.circle(pageWidth / 2, emptyY + 18, 7, "F");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text("👥", pageWidth / 2, emptyY + 21, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.darkNavy);
    doc.text("No family finance data available for this report.", pageWidth / 2, emptyY + 34, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.secondarySlate);
    doc.text("Create or join a family workspace in FinTrack to track shared household budgets and group contributions.", pageWidth / 2, emptyY + 42, { align: "center" });
  }


  // ==========================================
  // PAGE 9+: TRANSACTION SUMMARY (With multi-page overflow)
  // ==========================================
  doc.addPage();
  drawPageHeader("Transaction Summary", "Detailed activity during the selected reporting period.");

  // Combine and sort all transactions by date descending
  const allTx = [
    ...(expenses || []).map(e => ({
      date: e.date ? new Date(e.date) : new Date(0),
      desc: e.note || e.description || e.category || "Expense",
      category: e.category || "General",
      type: "Expense",
      amount: -(Number(e.amount) || 0)
    })),
    ...(incomes || []).map(i => ({
      date: i.date ? new Date(i.date) : new Date(0),
      desc: i.source || "Income",
      category: i.category || "Income",
      type: "Income",
      amount: Number(i.amount) || 0
    }))
  ].sort((a, b) => b.date - a.date);

  const txTableBody = allTx.map(t => [
    t.date.getTime() > 0 ? t.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-",
    t.desc,
    t.category,
    t.type,
    t.amount >= 0 ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(Math.abs(t.amount))}`
  ]);

  autoTable(doc, {
    startY: 44,
    head: [["DATE", "DESCRIPTION", "CATEGORY", "TYPE", "AMOUNT"]],
    body: txTableBody.length > 0 ? txTableBody : [["-", "No transactions recorded for this period", "-", "-", "Rs. 0"]],
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: COLORS.darkNavy,
      lineColor: COLORS.lightBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: COLORS.cardBg,
      textColor: COLORS.secondarySlate,
      fontStyle: "bold",
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { fontStyle: "bold", cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { halign: "center", cellWidth: 28 },
      4: { halign: "right", fontStyle: "bold", cellWidth: 33 }
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 3 && txTableBody[data.row.index]) {
        const typeText = data.cell.raw;
        const isIncome = typeText === "Income";
        const bg = isIncome ? COLORS.lightGreen : COLORS.lightRed;
        const fg = isIncome ? COLORS.positiveGreen : COLORS.expenseRed;

        drawPill(typeText, data.cell.x + 4, data.cell.y + (data.cell.height / 2) + 1.5, bg, fg, 6.5);
      }
      if (data.section === "body" && data.column.index === 4 && txTableBody[data.row.index]) {
        const amtStr = data.cell.raw;
        const isPositive = amtStr.startsWith("+");
        doc.setTextColor(...(isPositive ? COLORS.positiveGreen : COLORS.expenseRed));
      }
    }
  });


  // ==========================================
  // PAGE 10: FINANCIAL SUMMARY & TAKEAWAYS
  // ==========================================
  doc.addPage();
  drawPageHeader("Financial Summary", "Final period roll-up and key executive takeaways.");

  // Top 6 Metric Cards (3x2 Grid)
  const fGridCardW = (contentWidth - 8) / 3;
  const fGridCardH = 24;
  let fGridY = 44;

  const totalBudgetSetting = budgetList.reduce((sum, b) => sum + (Number(b.budget) || 0), 0);
  const budgetUtilPercent = totalBudgetSetting > 0 ? Math.round((totalExpense / totalBudgetSetting) * 100) : 0;

  // Row 1
  drawCard(margin, fGridY, fGridCardW, fGridCardH);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL INCOME", margin + 6, fGridY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.positiveGreen);
  doc.text(formatCurrency(totalIncome), margin + 6, fGridY + 16);

  drawCard(margin + fGridCardW + 4, fGridY, fGridCardW, fGridCardH);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL EXPENSES", margin + fGridCardW + 10, fGridY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.expenseRed);
  doc.text(formatCurrency(totalExpense), margin + fGridCardW + 10, fGridY + 16);

  drawCard(margin + (fGridCardW * 2) + 8, fGridY, fGridCardW, fGridCardH);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("NET SAVINGS", margin + (fGridCardW * 2) + 14, fGridY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primaryPurple);
  doc.text(formatCurrency(netCashFlow), margin + (fGridCardW * 2) + 14, fGridY + 16);

  // Row 2
  fGridY += fGridCardH + 4;
  drawCard(margin, fGridY, fGridCardW, fGridCardH);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("SAVINGS RATE", margin + 6, fGridY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(`${savingsRate}%`, margin + 6, fGridY + 16);

  drawCard(margin + fGridCardW + 4, fGridY, fGridCardW, fGridCardH);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("TOTAL BUDGET", margin + fGridCardW + 10, fGridY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(formatCurrency(totalBudgetSetting), margin + fGridCardW + 10, fGridY + 16);

  drawCard(margin + (fGridCardW * 2) + 8, fGridY, fGridCardW, fGridCardH);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("BUDGET UTILIZATION", margin + (fGridCardW * 2) + 14, fGridY + 7);
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(`${budgetUtilPercent}%`, margin + (fGridCardW * 2) + 14, fGridY + 16);

  // Dynamic Key Takeaways Card
  const takeawayY = fGridY + fGridCardH + 12;
  const takeawayH = 68;
  drawCard(margin, takeawayY, contentWidth, takeawayH);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primaryPurple);
  doc.circle(margin + 8, takeawayY + 10, 1.4, "F");
  doc.text("Key Takeaways", margin + 12, takeawayY + 11);

  const budgetTakeaway = totalBudgetSetting > 0
    ? (totalExpense <= totalBudgetSetting
        ? "Spending remained within the overall monthly budget envelope across all core categories."
        : `Overall expenditures exceeded combined budget limits by ${formatCurrency(totalExpense - totalBudgetSetting)}.`)
    : "No monthly budget limits were configured for this tracking cycle.";

  const costTakeaway = sortedCategories.length > 0
    ? `${topSpendingCategory} represented the highest individual spending category for the current period.`
    : "No itemized expenses were recorded during this reporting cycle.";

  const savingsTakeaway = netCashFlow >= 0
    ? `Overall net savings accumulated at a rate of ${savingsRate}%, increasing capital buffers by target margins.`
    : `Net outflow exceeded income by ${formatCurrency(Math.abs(netCashFlow))}, resulting in a capital drawdown for the cycle.`;

  const bullets = [budgetTakeaway, costTakeaway, savingsTakeaway];
  let curBulletY = takeawayY + 22;

  bullets.forEach((bText) => {
    doc.setFillColor(...COLORS.secondarySlate);
    doc.circle(margin + 8, curBulletY - 1, 0.8, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.darkNavy);
    const splitB = doc.splitTextToSize(bText, contentWidth - 20);
    doc.text(splitB, margin + 12, curBulletY);

    curBulletY += (splitB.length * 4.5) + 6;
  });


  // ==========================================
  // PAGE 11: NOTES & DISCLAIMER
  // ==========================================
  doc.addPage();
  drawPageHeader("Notes & Disclaimer", "Report parameters and system audit trail.");

  // Audit Parameters Card (2x2 Grid)
  const auditY = 44;
  const auditH = 46;
  drawCard(margin, auditY, contentWidth, auditH);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("AUDIT PARAMETERS", margin + 8, auditY + 8);

  const auditColW = (contentWidth - 16) / 2;

  // Row 1: Report Period & Generation Date
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("REPORT PERIOD", margin + 8, auditY + 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(periodLabel, margin + 8, auditY + 22);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("GENERATION DATE", margin + 8 + auditColW, auditY + 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(generatedDate, margin + 8 + auditColW, auditY + 22);

  // Row 2: Currency & Data Source
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("CURRENCY", margin + 8, auditY + 31);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text(`${currency} (INR)`, margin + 8, auditY + 37);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  doc.text("DATA SOURCE", margin + 8 + auditColW, auditY + 31);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkNavy);
  doc.text("FinTrack Synchronized Ledger", margin + 8 + auditColW, auditY + 37);

  // Formal Disclaimer Card
  const discY = 100;
  const discH = 32;
  drawCard(margin, discY, contentWidth, discH);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.secondarySlate);
  const disclaimerText = "Disclaimer: This report is generated from financial information recorded in FinTrack during the selected reporting period. Figures may vary if transactions are added, edited, or removed after report generation. This report is intended for personal financial tracking and informational purposes only.";
  const splitDisc = doc.splitTextToSize(disclaimerText, contentWidth - 16);
  doc.text(splitDisc, margin + 8, discY + 12);


  // ==========================================
  // RUNNING HEADERS & FOOTERS STAMPING (Two-Pass)
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
      doc.text(" | EXECUTIVE FINANCIAL REPORT", margin + 16, 12);

      doc.text(periodLabel, pageWidth - margin, 12, { align: "right" });

      doc.setDrawColor(...COLORS.lightBorder);
      doc.setLineWidth(0.2);
      doc.line(margin, 16, pageWidth - margin, 16);
    }

    // Running Footer (Pages 2+)
    if (i > 1) {
      const footerY = pageHeight - 10;
      doc.setDrawColor(...COLORS.lightBorder);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.secondarySlate);
      doc.text("FinTrack", margin, footerY);
      doc.text("Executive Financial Report", pageWidth / 2, footerY, { align: "center" });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
    }
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
