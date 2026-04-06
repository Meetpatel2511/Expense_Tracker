import React, { useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import PieChartCard from "../components/PieChartCard";
import { FiPlus, FiTrash2, FiEdit2, FiTrendingUp, FiDownload, FiDollarSign, FiFileText } from "react-icons/fi";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePro } from "../context/ProContext";

const SOURCES = [
  "Salary", "Freelance", "Business", "Investment",
  "Gift", "Rental", "Other"
];

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
    if (window.confirm("Are you sure you want to delete this income?")) {
      try {
        await API.delete(`/income/${id}`);
        fetchIncomes();
        toast.success("Income deleted");
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  const exportToCSV = () => {
    if (incomes.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Source", "Amount (Rs)"];
    const csvRows = [headers.join(",")];

    incomes.forEach(inc => {
      const row = [
        new Date(inc.date).toLocaleDateString(),
        `"${inc.source}"`,
        inc.amount
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FinTrack_Incomes_${new Date().toLocaleDateString()}.csv`);
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
    if (incomes.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(124, 58, 237);
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
        headStyles: { fillColor: [124, 58, 237] },
        theme: 'grid'
      });

      doc.save(`FinTrack_Incomes_${new Date().toLocaleDateString()}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  // 📊 Calculate Chart Data
  const incomeSourceData = incomes.reduce((acc, inc) => {
    acc[inc.source] = (acc[inc.source] || 0) + inc.amount;
    return acc;
  }, {});

  const totalIncome = Object.values(incomeSourceData).reduce((sum, val) => sum + val, 0);

  return (
    <div className="animate-fade page-grid">
      
        {/* Left Column: Form (40%) */}
        <div className="income-form-section">
          <div className="card form-card" style={{ width: '100%' }}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiDollarSign style={{ color: 'var(--bg-accent)', fontSize: '1.2rem' }} /> 
                  {editingId ? "Update Record" : "Add Income Source"}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FiTrendingUp style={{ position: 'absolute', left: '16px', color: '#10b981' }} />
                    <input
                        type="number"
                        className="form-input"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                        min="1"
                    />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Source</label>
                <select
                  className="form-input"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="">Select source</option>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
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

              <div style={{ display: "flex", gap: "12px", marginTop: '8px' }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? "Saving..." : editingId ? "Update Record" : "Save Income"}
                </button>

                {editingId && (
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: History & Charts (60%) */}
        <div className="income-data-section">
          {/* Filtering */}
          <FilterBar onFilterChange={handleFilterChange} showCategory={false} />

          {/* List Card */}
          <div className="card" style={{ width: '100%', marginBottom: '24px' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div className="card-title">Income History</div>
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

            {incomes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💰</div>
                <div className="empty-state-text">No records found</div>
                <div className="empty-state-subtext">There are no income records matching your current filter criteria.</div>
              </div>
            ) : (
              <div className="income-list">
                <div className="table-wrapper">
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>SOURCE</th>
                        <th style={{ textAlign: 'center' }}>DATE</th>
                        <th style={{ textAlign: 'right' }}>AMOUNT</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomes.map((inc) => (
                        <tr key={inc._id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{inc.source}</div>
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(inc.date).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                            + ₹{inc.amount.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button onClick={() => handleEdit(inc)} className="btn-icon edit" title="Edit">
                                <FiEdit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(inc._id)} className="btn-icon delete" title="Delete">
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>

          {/* Income Breakdown Pie Chart */}
          <PieChartCard 
            categoryData={incomeSourceData} 
            total={totalIncome} 
            title="Revenue Breakdown" 
            subtitle="Income distribution by source"
          />
        </div>
    </div>
  );
}

export default AddIncome;
