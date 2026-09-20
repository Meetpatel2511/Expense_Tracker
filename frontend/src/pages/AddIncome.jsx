import React, { useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { FiPlus, FiTrash2, FiEdit2, FiTrendingUp, FiDownload, FiDollarSign, FiFileText } from "react-icons/fi";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePro } from "../context/ProContext";
import { exportToCSV } from "../utils/exportUtils";

const SOURCES = [
  "Salary", "Freelance", "Business", "Investment",
  "Gift", "Rental", "Other"
];

const SOURCE_ICONS = {
  "Salary": "💼",
  "Freelance": "💻",
  "Business": "🏢",
  "Investment": "📈",
  "Gift": "🎁",
  "Rental": "🏠",
  "Other": "💰"
};

function AddIncome() {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filtering & Pagination State
  const [filters, setFilters] = useState({ search: "", startDate: "", endDate: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const { isPro } = usePro();

  const fetchIncomes = useCallback(async () => {
    try {
      const { search, startDate, endDate } = filters;
      let url = `/income?page=${currentPage}&limit=10`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await API.get(url);
      setIncomes(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      console.error("Fetch incomes error:", err);
      toast.error("Failed to load incomes");
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

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
    setSource("");
    setDate("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!source) {
      toast.error("Please select a source");
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await API.put(`/income/${editingId}`, {
          amount: Number(amount),
          source,
          date: date || undefined
        });
        toast.success("Income updated successfully");
      } else {
        await API.post("/income/add", {
          amount: Number(amount),
          source,
          date: date || undefined
        });
        toast.success("Income added successfully");
      }

      resetForm();
      fetchIncomes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (inc) => {
    setAmount(inc.amount.toString());
    setSource(inc.source);
    setDate(inc.date ? new Date(inc.date).toISOString().split("T")[0] : "");
    setEditingId(inc._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
        <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>Delete this income deposit?</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await API.delete(`/income/${id}`);
                fetchIncomes();
                toast.success("Income deleted");
              } catch (err) {
                toast.error("Failed to delete");
              }
            }}
            style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'var(--accent-danger)', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000, position: "top-center" });
  };

  const handleExportCSV = () => {
    if (incomes.length === 0) {
      toast.error("No data to export");
      return;
    }

    const success = exportToCSV(incomes, `FinTrack_Incomes_${new Date().toLocaleDateString()}`);
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
    if (incomes.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129);
      doc.text("FinTrack Income Report", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Records: ${totalRecords}`, 14, 36);

      autoTable(doc, {
        startY: 45,
        head: [['Date', 'Source', 'Amount']],
        body: incomes.map(inc => [
          new Date(inc.date).toLocaleDateString(),
          inc.source || "Other",
          `Rs. ${(inc.amount || 0).toLocaleString()}`
        ]),
        headStyles: { fillColor: [16, 185, 129] },
        theme: 'grid'
      });

      doc.save(`FinTrack_Income_${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader 
        title="Income Streams" 
        subtitle="Manage regular salary, freelancing, dividends, and other earnings"
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
              <h3 className="card-title">{editingId ? "Update Income" : "New Income Deposit"}</h3>
              <p className="card-subtitle">{editingId ? "Modify income stream details" : "Record your earnings or deposits"}</p>
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
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Income Source *</label>
                <select
                  className="form-input"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                >
                  <option value="">Select source</option>
                  {SOURCES.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Deposit Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button 
                type="submit" 
                className="add-btn" 
                disabled={loading} 
                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                {loading ? "Saving..." : (editingId ? "Update Income" : "+ Add Income Deposit")}
              </button>

              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm} style={{ padding: '0 18px' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Income List Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filtering Toolbar */}
          <FilterBar onFilterChange={handleFilterChange} showCategory={false} />

          {/* List Container Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title">Income History</h3>
                <p className="card-subtitle">{totalRecords} total deposits recorded</p>
              </div>
            </div>

            {incomes.length === 0 ? (
              <EmptyState
                icon={<FiTrendingUp size={24} />}
                title="No income records found"
                description="No records match your active search filters."
              />
            ) : (
              <div className="expense-list">
                {incomes.map((inc) => (
                  <div key={inc._id} className="expense-item">
                    <div className="expense-item-icon" style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}>
                      {SOURCE_ICONS[inc.source] || "💰"}
                    </div>

                    <div className="expense-item-details">
                      <div className="expense-item-category">{inc.source || "Income"}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Deposit received
                      </div>
                    </div>

                    <div className="expense-item-date hide-mobile" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {inc.date ? new Date(inc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </div>

                    <div className="expense-item-amount income">
                      + ₹{Number(inc.amount || 0).toLocaleString("en-IN")}
                    </div>

                    <div className="expense-item-actions">
                      <button className="btn-icon edit" onClick={() => handleEdit(inc)} title="Edit income" aria-label="Edit income">
                        <FiEdit2 size={13} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(inc._id)} title="Delete income" aria-label="Delete income">
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
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
      
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

export default AddIncome;
