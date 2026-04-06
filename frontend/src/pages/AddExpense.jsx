import React, { useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import ExpenseItem from "../components/ExpenseItem";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import { FiPlus, FiDownload, FiSearch, FiFilter, FiFileText } from "react-icons/fi";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePro } from "../context/ProContext";

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment",
  "Bills & Utilities", "Healthcare", "Education", "Travel",
  "Groceries", "Rent", "Other"
];

function AddExpense() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filtering & Pagination State
  const [filters, setFilters] = useState({ search: "", category: "", startDate: "", endDate: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const { isPro } = usePro();

  const fetchExpenses = useCallback(async () => {
    try {
      const { search, category, startDate, endDate } = filters;
      let url = `/expense?page=${currentPage}&limit=10`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await API.get(url);
      setExpenses(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      console.error("Fetch expenses error:", err);
      toast.error("Failed to load expenses");
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on new filter
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setNote("");
    setDate("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await API.put(`/expense/${editingId}`, {
          amount: Number(amount),
          category,
          note,
          date: date || undefined
        });
        toast.success("Expense updated successfully");
      } else if (isRecurring) {
        await API.post("/expense/recurring/add", {
          amount: Number(amount),
          category,
          note,
          frequency,
          startDate: date || undefined
        });
        toast.success("Recurring expense scheduled! 🗓️");
      } else {
        await API.post("/expense/add", {
          amount: Number(amount),
          category,
          note,
          date: date || undefined
        });
        toast.success("Expense added successfully");
      }

      resetForm();
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp) => {
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setNote(exp.note || "");
    setDate(exp.date ? new Date(exp.date).toISOString().split("T")[0] : "");
    setEditingId(exp._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportToCSV = () => {
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Category", "Note", "Amount (Rs)"];
    const csvRows = [headers.join(",")];

    expenses.forEach(exp => {
      // M10: Escape potential formula injection (CSV Injection)
      const sanitizeCSV = (val) => {
        const str = String(val);
        if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
          return `'${str}`;
        }
        return str;
      };

      const row = [
        new Date(exp.date).toLocaleDateString(),
        `"${sanitizeCSV(exp.category)}"`,
        `"${sanitizeCSV(exp.note || "-")}"`,
        exp.amount
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FinTrack_Expenses_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully!");
  };

  const exportToPDF = () => {
    if (!isPro) {
      toast.error("Pro Feature 🔒\n\nUpgrade to Pro to download PDF reports");
      return;
    }
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(124, 58, 237);
      doc.text("FinTrack Expense Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Records: ${totalRecords}`, 14, 36);

      autoTable(doc, {
        startY: 45,
        head: [['Date', 'Category', 'Note', 'Amount']],
        body: expenses.map(exp => [
          new Date(exp.date).toLocaleDateString(),
          exp.category || "Other",
          exp.note || "-",
          `Rs. ${(exp.amount || 0).toLocaleString()}`
        ]),
        headStyles: { fillColor: [124, 58, 237] },
        theme: 'grid'
      });

      doc.save(`FinTrack_Expenses_${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '24px' }}></div>

      <div className="page-grid">
        {/* Form */}
        <div className="card form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="What was this expense for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Recurring Options */}
            {!editingId && (
              <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.05)', border: '1px dashed var(--bg-accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isRecurring ? '16px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="isRecurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--bg-accent)' }}
                    />
                    <label htmlFor="isRecurring" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Make this a recurring expense</label>
                  </div>
                  {isRecurring && <span style={{ fontSize: '0.7rem', color: 'var(--bg-accent)', fontWeight: 700, textTransform: 'uppercase' }}>Automation Active</span>}
                </div>

                {isRecurring && (
                  <div className="animate-fade">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FREQUENCY</label>
                    <select 
                      className="form-input"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      style={{ marginTop: '4px' }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      * Automatically log this {frequency.replace('ly', '')} expenditure.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button type="submit" className="add-btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? "Saving..." : (editingId ? "Update Expense" : (isRecurring ? "Set Up Recurring Expense" : "+ Add Expense"))}
              </button>

              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm} style={{ padding: '0 20px', borderRadius: '12px' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Expense List Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Filtering */}
          <FilterBar onFilterChange={handleFilterChange} categories={CATEGORIES} />

          {/* List Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div className="card-title">Recent Expenses</div>
                <div className="card-subtitle">{totalRecords} total records found</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={exportToCSV}
                  className="btn-secondary" 
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiDownload /> CSV
                </button>
                <button 
                  onClick={exportToPDF}
                  className="btn-secondary" 
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiFileText /> PDF
                </button>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💸</div>
                <div className="empty-state-text">No expenses found matching filters</div>
                <div className="empty-state-subtext">Try adjusting your filters or search terms.</div>
              </div>
            ) : (
              <div className="expense-list">
                {expenses.map((exp) => (
                  <ExpenseItem
                    key={exp._id}
                    exp={exp}
                    refresh={fetchExpenses}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddExpense;