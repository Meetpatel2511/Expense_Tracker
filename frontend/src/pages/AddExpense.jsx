import React, { useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import ExpenseItem from "../components/ExpenseItem";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { FiPlus, FiDownload, FiFileText, FiClock, FiDollarSign } from "react-icons/fi";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePro } from "../context/ProContext";
import { exportToCSV } from "../utils/exportUtils";

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
    setCurrentPage(1);
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
    setIsRecurring(false);
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

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }

    const success = exportToCSV(expenses, `FinTrack_Expenses_${new Date().toLocaleDateString()}`);
    if (success) {
      toast.success("CSV Exported successfully!");
    } else {
      toast.error("Failed to export CSV");
    }
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
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader 
        title="Expense Tracking" 
        subtitle="Log single transactions or automate scheduled bills"
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary" 
            style={{ fontSize: '0.85rem' }}
          >
            <FiDownload size={14} /> 
            <span>CSV Export</span>
          </button>
          <button 
            type="button"
            onClick={exportToPDF}
            className="btn-secondary" 
            style={{ fontSize: '0.85rem', opacity: isPro ? 1 : 0.85 }}
            title={isPro ? "Export PDF Statement" : "Pro Feature - Upgrade to Export"}
          >
            <FiFileText size={14} /> 
            <span>PDF Statement</span>
          </button>
        </div>
      </PageHeader>

      <div className="page-grid">
        {/* Form Card */}
        <div className="card form-card">
          <div className="card-header" style={{ marginBottom: '18px' }}>
            <div>
              <h3 className="card-title">{editingId ? "Update Expense" : "New Expense"}</h3>
              <p className="card-subtitle">{editingId ? "Modify transaction attributes" : "Enter details for your expenditure"}</p>
            </div>
            {editingId && (
              <span className="badge badge-warning">Editing</span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Note / Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="What was this expenditure for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Recurring Automation Option */}
            {!editingId && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '14px 16px', 
                borderRadius: '12px', 
                background: 'rgba(124, 58, 237, 0.05)', 
                border: '1px solid var(--border-accent)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isRecurring ? '12px' : '0' }}>
                  <label htmlFor="isRecurring" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      id="isRecurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--bg-accent)' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>Recurring Bill Automation</span>
                  </label>
                  {isRecurring && (
                    <span className="badge badge-pro" style={{ fontSize: '0.65rem' }}>Active</span>
                  )}
                </div>

                {isRecurring && (
                  <div className="animate-fade" style={{ paddingTop: '8px' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Repeat Frequency</label>
                    <select 
                      className="form-input"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Automatically logs this {frequency.replace('ly', '')} expenditure on schedule.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="submit" className="add-btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? "Saving..." : (editingId ? "Update Expense" : (isRecurring ? "Set Up Recurring Expense" : "+ Add Expense"))}
              </button>

              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm} style={{ padding: '0 18px' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Expense List Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filtering Toolbar */}
          <FilterBar onFilterChange={handleFilterChange} categories={CATEGORIES} />

          {/* List Container Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title">Expense History</h3>
                <p className="card-subtitle">{totalRecords} total records recorded</p>
              </div>
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                icon={<FiDollarSign size={24} />}
                title="No expenses found"
                description="No records match your active filters. Try adjusting your search parameters."
              />
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
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddExpense;