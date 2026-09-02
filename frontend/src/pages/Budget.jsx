import React, { useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import BudgetProgress from "../components/BudgetProgress";
import MonthSelector from "../components/MonthSelector";
import { FiTarget, FiPlus, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

const OPTIONAL_CATEGORIES = [
  "Global", "Food & Dining", "Shopping", "Transportation", "Entertainment",
  "Bills & Utilities", "Healthcare", "Education", "Travel",
  "Groceries", "Rent", "Other"
];

function Budget() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getUTCFullYear());

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Global");
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const fetchBudgetStatus = useCallback(async () => {
    try {
      setFetchLoading(true);
      const res = await API.get(`/budget?month=${selectedMonth}&year=${selectedYear}`);
      setBudgetStatus(res.data);
    } catch (err) {
      console.error("Fetch budget status error:", err);
    } finally {
      setFetchLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgetStatus();
  }, [fetchBudgetStatus]);

  const handleMonthChange = (m, y) => {
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    setLoading(true);
    try {
      await API.post(`/budget?month=${selectedMonth}&year=${selectedYear}`, { 
        amount: Number(amount),
        category 
      });
      toast.success(`Budget for ${category} updated!`);
      setAmount("");
      fetchBudgetStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '8px' }}>
        <div className="skeleton-card" style={{ minHeight: '300px' }}>
          <div className="skeleton skeleton-line title"></div>
          <div className="skeleton skeleton-line full"></div>
          <div className="skeleton skeleton-line medium"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <MonthSelector 
          selectedMonth={selectedMonth} 
          selectedYear={selectedYear} 
          onChange={handleMonthChange} 
        />
        <div className="badge">
          <FiTarget style={{ marginRight: 8 }} />
          Actively Tracking
        </div>
      </div>

      <div className="page-grid">
        {/* Left: Input Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: 'fit-content' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Manage Monthly Limits</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Set your maximum spending for specific categories or a global limit.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
                <label className="form-label">SELECT CATEGORY</label>
                <select 
                  className="form-input" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {OPTIONAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">BUDGET AMOUNT (₹)</label>
                <input 
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            <button type="submit" className="add-btn" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              <FiPlus size={18} style={{ marginRight: 8 }} />
              {loading ? "Saving..." : `Set ${category} Budget`}
            </button>
          </form>

          {/* Quick Recap of set budgets */}
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Active Budgets</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {budgetStatus?.hasBudget ? [budgetStatus.global, ...(budgetStatus.categories || [])].map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.category || "Global"}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limit: ₹{b.budget.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: b.percentage >= 100 ? 'var(--accent-danger)' : 'var(--accent-green)' }}>
                      {b.percentage}% Used
                    </div>
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No budgets set for this month.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Visual Summary */}
        <div style={{ minHeight: '500px' }}>
           <BudgetProgress budget={budgetStatus} />
        </div>
      </div>
    </div>
  );
}

export default Budget;