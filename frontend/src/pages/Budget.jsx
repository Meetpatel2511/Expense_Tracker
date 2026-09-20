import React, { useState, useEffect, useCallback } from "react";
import API from "../utils/api";
import BudgetProgress from "../components/BudgetProgress";
import MonthSelector from "../components/MonthSelector";
import PageHeader from "../components/PageHeader";
import { FiTarget, FiPlus } from "react-icons/fi";
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
      toast.success(`Budget limit for ${category} saved!`);
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
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader 
        title="Budget Planning" 
        subtitle="Set maximum expenditure targets for specific categories or overall monthly cap"
      >
        <MonthSelector 
          selectedMonth={selectedMonth} 
          selectedYear={selectedYear} 
          onChange={handleMonthChange} 
        />
        <span className="badge badge-success">
          <FiTarget size={13} /> Actively Tracking
        </span>
      </PageHeader>

      <div className="page-grid">
        {/* Left: Input Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: 'fit-content' }}>
          <div className="card-header" style={{ marginBottom: 0 }}>
            <div>
              <h3 className="card-title">Manage Spending Limits</h3>
              <p className="card-subtitle">Select category and configure monthly budget ceiling</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                className="form-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                {OPTIONAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Budget Limit Amount (₹)</label>
              <input 
                type="number"
                className="form-input" 
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>

            <button type="submit" className="add-btn" disabled={loading} style={{ width: '100%', marginTop: '4px' }}>
              <FiPlus size={16} />
              <span>{loading ? "Saving..." : `Set ${category} Budget`}</span>
            </button>
          </form>

          {/* Quick Recap of set budgets */}
          <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
              Active Budgets for Period
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {budgetStatus?.hasBudget ? [budgetStatus.global, ...(budgetStatus.categories || [])].map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{b.category || "Global"}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limit: ₹{b.budget.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span 
                      className={`badge ${b.percentage >= 100 ? "badge-danger" : (b.percentage >= 80 ? "badge-warning" : "badge-success")}`}
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    >
                      {b.percentage}% Used
                    </span>
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No budgets configured for this month.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Visual Summary Progress Card */}
        <div style={{ minHeight: '460px' }}>
          <BudgetProgress budget={budgetStatus} />
        </div>
      </div>
    </div>
  );
}

export default Budget;