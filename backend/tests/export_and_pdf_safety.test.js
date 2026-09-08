import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";

// IMPORT REAL PRODUCTION UTILITIES DIRECTLY — NO DUPLICATED LOGIC
import { sanitizeSpreadsheetValue, fetchAllPeriodTransactions } from "../../frontend/src/utils/exportUtils.js";
import {
  calculateFinancialMetrics,
  calculateBudgetProgress,
  calculateCategoryDistribution,
  reconcileFinancialData,
  formatCurrency,
  getDaysInMonth,
  generateFinancialReportPDF
} from "../../frontend/src/utils/pdfReportGenerator.js";

import Expense from "../models/Expense.js";
import { getExpenses } from "../controllers/expenseController.js";

describe("Step 1E: Production Export Sanitization & PDF Safety Suite", () => {
  describe("Spreadsheet Formula Injection Sanitization (exportUtils.js)", () => {
    it("should escape dangerous formula strings starting with =, +, -, @", () => {
      assert.equal(sanitizeSpreadsheetValue("=SUM(A1:A2)"), "'=SUM(A1:A2)");
      assert.equal(sanitizeSpreadsheetValue("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0");
      assert.equal(sanitizeSpreadsheetValue("@formula"), "'@formula");
      assert.equal(sanitizeSpreadsheetValue("-formula"), "'-formula");
      assert.equal(sanitizeSpreadsheetValue("=1+1"), "'=1+1");
      assert.equal(sanitizeSpreadsheetValue("+12345text"), "'+12345text");
    });

    it("should preserve legitimate numeric values (including negative numbers) as strictly numeric", () => {
      assert.equal(sanitizeSpreadsheetValue(-2500), -2500);
      assert.equal(sanitizeSpreadsheetValue(-2500.5), -2500.5);
      assert.equal(sanitizeSpreadsheetValue(-0.5), -0.5);
      assert.equal(sanitizeSpreadsheetValue("-2500"), -2500);
      assert.equal(sanitizeSpreadsheetValue("-2500.50"), -2500.5);
      assert.equal(sanitizeSpreadsheetValue("-0.5"), -0.5);
      assert.equal(sanitizeSpreadsheetValue("125000"), 125000);
      assert.equal(sanitizeSpreadsheetValue(0), 0);
    });

    it("should preserve normal text strings without formula escaping prefix", () => {
      assert.equal(sanitizeSpreadsheetValue("Consulting Fee - Acme Corp"), "Consulting Fee - Acme Corp");
      assert.equal(sanitizeSpreadsheetValue("Food & Groceries"), "Food & Groceries");
      assert.equal(sanitizeSpreadsheetValue("Monthly Apartment Rent"), "Monthly Apartment Rent");
    });

    it("should handle null and undefined safely", () => {
      assert.equal(sanitizeSpreadsheetValue(null), "");
      assert.equal(sanitizeSpreadsheetValue(undefined), "");
      assert.equal(sanitizeSpreadsheetValue(""), "");
    });
  });

  describe("Production PDF Pure Calculation & Reconciliation Logic (pdfReportGenerator.js)", () => {
    it("should accurately format Indian Rupee currency notation", () => {
      assert.equal(formatCurrency(125000), "Rs. 1,25,000");
      assert.equal(formatCurrency(78500), "Rs. 78,500");
      assert.equal(formatCurrency(0), "Rs. 0");
      assert.equal(formatCurrency(NaN), "Rs. 0");
      assert.equal(formatCurrency(null), "Rs. 0");
    });

    it("should accurately calculate days in month", () => {
      assert.equal(getDaysInMonth(2, 2026), 28); // 2026 is not a leap year
      assert.equal(getDaysInMonth(2, 2024), 29); // 2024 was leap year
      assert.equal(getDaysInMonth(1, 2026), 31);
    });

    it("should accurately calculate financial metrics and balance reconciliation", () => {
      const metrics = calculateFinancialMetrics({
        totalIncome: 125000,
        totalExpense: 78500,
        balance: 245000
      });

      assert.equal(metrics.totalIncome, 125000);
      assert.equal(metrics.totalExpense, 78500);
      assert.equal(metrics.netCashFlow, 46500);
      assert.equal(metrics.closingBalance, 245000);
      assert.equal(metrics.openingBalance, 198500);
      // Mathematical reconciliation: Opening + Income - Expense = Closing
      assert.equal(metrics.openingBalance + metrics.totalIncome - metrics.totalExpense, metrics.closingBalance);
      assert.equal(metrics.savingsRate, 37); // round(46500 / 125000 * 100) = 37%
      assert.equal(metrics.expenseRatio, 63); // round(78500 / 125000 * 100) = 63%
    });

    it("should handle zero income and zero expenses safely without NaN or Infinity", () => {
      const zeroIncome = calculateFinancialMetrics({
        totalIncome: 0,
        totalExpense: 15000,
        balance: 50000
      });
      assert.equal(zeroIncome.savingsRate, 0);
      assert.equal(zeroIncome.expenseRatio, 100);
      assert.equal(Number.isNaN(zeroIncome.savingsRate), false);

      const zeroExpense = calculateFinancialMetrics({
        totalIncome: 50000,
        totalExpense: 0,
        balance: 100000
      });
      assert.equal(zeroExpense.savingsRate, 100);
      assert.equal(zeroExpense.expenseRatio, 0);
    });

    it("should accurately calculate budget utilization and progress", () => {
      const underBudget = calculateBudgetProgress({ budget: 35000, spent: 32000 });
      assert.equal(underBudget.isExceeded, false);
      assert.equal(underBudget.isNearLimit, true); // 32000/35000 = 91.4% >= 80%
      assert.equal(underBudget.remaining, 3000);
      assert.equal(underBudget.usagePercent, 91);

      const overBudget = calculateBudgetProgress({ budget: 15000, spent: 16500 });
      assert.equal(overBudget.isExceeded, true);
      assert.equal(overBudget.remaining, -1500);
      assert.equal(overBudget.usagePercent, 110);
    });

    it("should calculate category distribution sorted descending by expenditure", () => {
      const categories = {
        "Housing & Rent": 32000,
        "Food & Groceries": 16500,
        "Transportation": 8500
      };
      const dist = calculateCategoryDistribution(categories, 57000);
      assert.equal(dist.length, 3);
      assert.equal(dist[0].category, "Housing & Rent");
      assert.equal(dist[0].amount, 32000);
      assert.equal(dist[1].category, "Food & Groceries");
      assert.equal(dist[2].category, "Transportation");
      assert.equal(dist[0].formattedShare, "56.1%");
    });

    it("should validate complete financial reconciliation of consistent test data", () => {
      const testData = {
        summary: {
          totalIncome: 125000,
          totalExpense: 78500,
          balance: 245000
        },
        categories: {
          "Housing & Rent": 32000,
          "Food & Groceries": 16500,
          "Transportation": 8500,
          "Utilities & Internet": 6500,
          "Healthcare & Insurance": 5500,
          "Entertainment & Leisure": 5000,
          "Personal & Miscellaneous": 4500
        },
        incomes: [
          { date: "2026-02-01", source: "Consulting / Freelance Client A", amount: 85000 },
          { date: "2026-02-15", source: "Retainer Fee - Client B", amount: 30000 },
          { date: "2026-02-20", source: "Dividend & Interest", amount: 10000 }
        ],
        expenses: [
          { date: "2026-02-01", category: "Housing & Rent", amount: 28000 },
          { date: "2026-02-05", category: "Housing & Rent", amount: 4000 },
          { date: "2026-02-02", category: "Food & Groceries", amount: 5200 },
          { date: "2026-02-09", category: "Food & Groceries", amount: 3800 },
          { date: "2026-02-14", category: "Food & Groceries", amount: 3500 },
          { date: "2026-02-21", category: "Food & Groceries", amount: 4000 },
          { date: "2026-02-03", category: "Transportation", amount: 4500 },
          { date: "2026-02-12", category: "Transportation", amount: 1800 },
          { date: "2026-02-22", category: "Transportation", amount: 2200 },
          { date: "2026-02-04", category: "Utilities & Internet", amount: 3800 },
          { date: "2026-02-08", category: "Utilities & Internet", amount: 1500 },
          { date: "2026-02-18", category: "Utilities & Internet", amount: 1200 },
          { date: "2026-02-07", category: "Healthcare & Insurance", amount: 4000 },
          { date: "2026-02-19", category: "Healthcare & Insurance", amount: 1500 },
          { date: "2026-02-10", category: "Entertainment & Leisure", amount: 1800 },
          { date: "2026-02-23", category: "Entertainment & Leisure", amount: 3200 },
          { date: "2026-02-11", category: "Personal & Miscellaneous", amount: 2500 },
          { date: "2026-02-25", category: "Personal & Miscellaneous", amount: 2000 }
        ],
        budgets: {
          categories: [
            { category: "Housing & Rent", budget: 35000 },
            { category: "Food & Groceries", budget: 15000 },
            { category: "Transportation", budget: 10000 },
            { category: "Utilities & Internet", budget: 7000 },
            { category: "Healthcare & Insurance", budget: 6000 },
            { category: "Entertainment & Leisure", budget: 5000 },
            { category: "Personal & Miscellaneous", budget: 5000 }
          ]
        }
      };

      const reconciliation = reconcileFinancialData(testData);
      assert.equal(reconciliation.isValid, true, `Reconciliation failed: ${reconciliation.errors.join("; ")}`);
      assert.equal(reconciliation.errors.length, 0);
      assert.equal(reconciliation.metrics.incomeTxTotal, 125000);
      assert.equal(reconciliation.metrics.expenseTxTotal, 78500);
      assert.equal(reconciliation.metrics.categoryTotal, 78500);
      assert.equal(reconciliation.metrics.netCashFlow, 46500);
      assert.equal(reconciliation.metrics.openingBalance, 198500);
      assert.equal(reconciliation.metrics.reportedBalance, 245000);
    });

    it("should detect and report inconsistencies if transaction totals diverge from reported totals", () => {
      const inconsistentData = {
        summary: { totalIncome: 100000, totalExpense: 78500, balance: 200000 },
        categories: { "Food": 50000 },
        incomes: [{ amount: 90000 }],
        expenses: [{ category: "Food", amount: 40000 }]
      };

      const reconciliation = reconcileFinancialData(inconsistentData);
      assert.equal(reconciliation.isValid, false);
      assert.ok(reconciliation.errors.length >= 3);
    });
  });

  describe("Complete Report Data Retrieval & Pagination (fetchAllPeriodTransactions)", () => {
    it("should fetch all 125 records across multiple pages (limit 100) without data loss", async () => {
      const mock100Expenses = Array.from({ length: 100 }, (_, i) => ({
        _id: `exp_p1_${i}`,
        amount: 500,
        category: "Food & Dining",
        date: "2026-02-10"
      }));

      const mock25Expenses = Array.from({ length: 25 }, (_, i) => ({
        _id: `exp_p2_${i}`,
        amount: 500,
        category: "Food & Dining",
        date: "2026-02-20"
      }));

      const mockApiClient = {
        get: async (url) => {
          if (url.includes("page=1")) {
            return { data: { data: mock100Expenses, total: 125, page: 1, pages: 2 } };
          }
          if (url.includes("page=2")) {
            return { data: { data: mock25Expenses, total: 125, page: 2, pages: 2 } };
          }
          return { data: { data: [], total: 0, page: 1, pages: 1 } };
        }
      };

      const result = await fetchAllPeriodTransactions(
        mockApiClient,
        "/expense",
        "2026-02-01T00:00:00.000Z",
        "2026-02-28T23:59:59.999Z"
      );

      assert.equal(result.length, 125, "Expected all 125 records to be retrieved");
      assert.equal(result[0]._id, "exp_p1_0");
      assert.equal(result[124]._id, "exp_p2_24");
    });
  });

  describe("Large-Data Multi-Page PDF Generation & Natural Pagination", () => {
    it("should naturally paginate a large transaction dataset (>100 expenses & >100 incomes) across multiple pages", () => {
      // 125 Income transactions = 125 * 1000 = 125,000
      const largeIncomes = Array.from({ length: 125 }, (_, i) => ({
        date: `2026-02-${String((i % 28) + 1).padStart(2, "0")}`,
        source: `Client Source #${i + 1}`,
        amount: 1000
      }));

      // 125 Expense transactions across 5 categories = 125 * 600 = 75,000
      const categories = {
        "Housing & Rent": 25 * 600,       // 15,000
        "Food & Groceries": 25 * 600,     // 15,000
        "Transportation": 25 * 600,       // 15,000
        "Utilities & Internet": 25 * 600, // 15,000
        "Entertainment & Leisure": 25 * 600 // 15,000
      };

      const catNames = Object.keys(categories);
      const largeExpenses = Array.from({ length: 125 }, (_, i) => {
        const cat = catNames[i % catNames.length];
        return {
          date: `2026-02-${String((i % 28) + 1).padStart(2, "0")}`,
          note: `Operational transaction item #${i + 1}`,
          category: cat,
          amount: 600
        };
      });

      const totalIncome = 125000;
      const totalExpense = 75000;
      const balance = 200000;

      const testData = {
        month: 2,
        year: 2026,
        summary: { totalIncome, totalExpense, balance },
        categories,
        incomes: largeIncomes,
        expenses: largeExpenses,
        budgets: {
          categories: catNames.map(c => ({ category: c, budget: 20000 }))
        },
        monthlyData: [
          { month: "Jan 2026", income: 120000, expense: 70000 },
          { month: "Feb 2026", income: 125000, expense: 75000 }
        ],
        alerts: [{ type: "success", message: "Large dataset parsed smoothly." }],
        userName: "Enterprise User",
        saveDoc: false
      };

      // 1. Programmatic reconciliation verification
      const recon = reconcileFinancialData(testData);
      assert.equal(recon.isValid, true, `Reconciliation errors: ${recon.errors.join("; ")}`);
      assert.equal(recon.metrics.incomeTxTotal, 125000);
      assert.equal(recon.metrics.expenseTxTotal, 75000);
      assert.equal(largeIncomes.length, 125);
      assert.equal(largeExpenses.length, 125);

      // 2. Generate PDF document using production generator
      const doc = generateFinancialReportPDF(testData);
      assert.ok(doc, "Expected valid jsPDF instance");

      const pageCount = doc.internal.getNumberOfPages();
      // With 125 incomes and 125 expenses, itemized transactions naturally span multiple pages (>= 8 pages)
      assert.ok(pageCount >= 8, `Expected naturally paginated multi-page document (>= 8 pages), got ${pageCount}`);
    });
  });

  describe("Backend Isolation & Date-Range Filtering Suite", () => {
    it("should query only authenticated user's records within requested monthly date range", async () => {
      const originalExpenseFind = Expense.find;
      const originalExpenseCount = Expense.countDocuments;

      let capturedQuery = null;

      Expense.find = (query) => {
        capturedQuery = query;
        return {
          sort: () => ({
            skip: () => ({
              limit: () => Promise.resolve([
                { _id: "exp_1", amount: 1000, category: "Food & Dining", date: new Date("2026-02-15") }
              ])
            })
          })
        };
      };

      Expense.countDocuments = () => Promise.resolve(1);

      const app = express();
      app.use((req, res, next) => {
        req.user = "507f1f77bcf86cd799439011";
        next();
      });
      app.get("/api/expense", getExpenses);

      const res = await request(app)
        .get("/api/expense")
        .query({
          startDate: "2026-02-01T00:00:00.000Z",
          endDate: "2026-02-28T23:59:59.999Z",
          limit: 100,
          page: 1
        });

      Expense.find = originalExpenseFind;
      Expense.countDocuments = originalExpenseCount;

      assert.equal(res.status, 200);
      assert.equal(res.body.total, 1);
      assert.equal(capturedQuery.user, "507f1f77bcf86cd799439011", "Must strictly isolate to req.user");
      assert.ok(capturedQuery.date.$gte instanceof Date, "Must filter start date");
      assert.ok(capturedQuery.date.$lte instanceof Date, "Must filter end date");
    });
  });
});
