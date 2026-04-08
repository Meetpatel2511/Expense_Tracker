import React, { useEffect, useState, useCallback } from "react";
import API from "../utils/api";
import { useUser } from "@clerk/clerk-react";
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiPieChart, FiDownload, FiZap, FiLock, FiCalendar } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import StatCard from "../components/StatCard";
import Charts from "../components/Charts";
import MonthlyBudgetCard from "../components/MonthlyBudgetCard";
import TransactionTable from "../components/TransactionTable";
import DashboardAlerts from "../components/DashboardAlerts";
import MonthSelector from "../components/MonthSelector";
import HealthScoreCard from "../components/HealthScoreCard";
import { usePro } from "../context/ProContext";

function Dashboard() {
  const { user } = useUser();
  const { isPro, loading: proLoading } = usePro();
  
  // State for Selection
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getUTCFullYear());

  const [summary, setSummary] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState({});
  const [categories, setCategories] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const CACHE_KEY = `dashboard_cache_${user?.id || 'guest'}`;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const fetchData = useCallback(async (isInitial = true) => {
    try {
      if (isInitial) {
        // 1. Check Cache first for "Instant" feel
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setSummary(data.summary);
            setExpenses(data.recentTransactions);
            setMonthlyData(data.monthlyData);
            setBudget(data.budgets);
            setCategories(data.categories);
            setAlerts(data.alerts);
            setLastUpdated(data.lastUpdated);
            setLoading(false);
            // Even if cache is valid, we'll refresh in background quietly
            setIsRefreshing(true);
          }
        }
      }

      const params = `?month=${selectedMonth}&year=${selectedYear}`;
      const res = await API.get(`/expense/dashboard${params}`);
      const freshData = res.data;

      // 2. Update State
      setSummary(freshData.summary);
      setExpenses(freshData.recentTransactions);
      setMonthlyData(freshData.monthlyData);
      setBudget(freshData.budgets);
      setCategories(freshData.categories);
      setAlerts(freshData.alerts);
      setLastUpdated(freshData.lastUpdated);

      // 3. Update Cache
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      // Only show error if we have no data at all
      if (loading) setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, CACHE_KEY, CACHE_TTL, loading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadReport = () => {
    if (!isPro) {
        alert("Pro Feature 🔒\n\nUpgrade to Pro to download reports 📄");
        return;
    }

    try {
        const doc = new jsPDF();
        
        // Month Names Map
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthLabel = monthNames[selectedMonth - 1] || "Monthly";

        // 1. Title & Header
        doc.setFontSize(22);
        doc.setTextColor(124, 58, 237); // Premium Purple
        doc.text("FinTrack Report", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Month: ${monthLabel} ${selectedYear}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);

        // 2. Financial Summary
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Income: Rs. ${(summary?.totalIncome || 0).toLocaleString()}`, 14, 48);
        doc.text(`Total Expense: Rs. ${(summary?.totalExpense || 0).toLocaleString()}`, 14, 56);
        doc.text(`Savings: Rs. ${(summary?.savings || 0).toLocaleString()}`, 14, 64);

        // 3. Category Breakdown Table
        const categoryList = Object.entries(categories || {}).map(([category, amount]) => ({
            category,
            amount
        }));

        autoTable(doc, {
            startY: 75,
            head: [["Category", "Amount"]],
            body: (categoryList || []).map(c => [
                c.category,
                `Rs. ${(c.amount || 0).toLocaleString()}`
            ]),
            headStyles: { fillColor: [124, 58, 237] },
            theme: 'grid'
        });

        // 4. Detailed Transaction List (if data exists)
        if (expenses && expenses.length > 0) {
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;
            
            doc.text("Detailed Transactions", 14, finalY + 15);
            
            autoTable(doc, {
                startY: finalY + 20,
                head: [['Date', 'Category', 'Note', 'Amount']],
                body: (expenses || []).map(exp => [
                    new Date(exp.date).toLocaleDateString(),
                    exp.category || "Other",
                    exp.note || "-",
                    `Rs. ${(exp.amount || 0).toLocaleString()}`
                ]),
                headStyles: { fillColor: [59, 130, 246] }
            });
        }

        doc.save(`FinTrack_Report_${selectedMonth}_${selectedYear}.pdf`);
    } catch (pdfError) {
        console.error("PDF Final Error:", pdfError);
        alert("❌ PDF Generation Issue.\n\nPlease check your data and try again.");
    }
  };

  const handleMonthChange = (m, y) => {
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  if (loading) {
    return (
      <div className="dashboard-content animate-fade" style={{ 
        display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 32px)', width: '100%', paddingTop: '8px'
      }}>
        {/* Skeleton Stat Cards */}
        <div className="stat-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-line short"></div>
              <div className="skeleton skeleton-line title"></div>
              <div className="skeleton skeleton-line medium"></div>
            </div>
          ))}
        </div>
        {/* Skeleton Chart */}
        <div className="responsive-flex">
          <div style={{ flex: 2 }}>
            <div className="skeleton-chart">
              <div className="skeleton skeleton-line medium" style={{ marginBottom: '16px' }}></div>
              <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="skeleton-card" style={{ minHeight: '300px' }}>
              <div className="skeleton skeleton-line short"></div>
              <div className="skeleton" style={{ height: '160px', width: '160px', borderRadius: '50%', margin: '16px auto' }}></div>
              <div className="skeleton skeleton-line full"></div>
            </div>
          </div>
        </div>
        {/* Skeleton Table */}
        <div className="skeleton-card">
          <div className="skeleton skeleton-line medium"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-table-row">
              <div className="skeleton skeleton-cell" style={{ flex: 0.5 }}></div>
              <div className="skeleton skeleton-cell"></div>
              <div className="skeleton skeleton-cell"></div>
              <div className="skeleton skeleton-cell" style={{ flex: 0.7 }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-fade" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 'clamp(16px, 3vw, 32px)', 
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* Controls Row: Month Selector & Download Report */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        gap: '12px',
        flexWrap: 'wrap',
        paddingTop: '8px'
      }}>
        <MonthSelector 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={handleMonthChange} 
        />
        <button 
            onClick={handleDownloadReport} 
            title={isPro ? "Download PDF Report" : "Pro Feature - Upgrade to Download"}
            className={`btn-primary ${isPro ? "gradient-blue" : ""}`}
            style={{ 
                padding: '10px 20px', 
                borderRadius: '12px',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                opacity: isPro ? 1 : 0.7,
                cursor: 'pointer',
                border: 'none',
                width: 'auto',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease'
            }}
        >
            {isPro ? <FiDownload size={18} /> : "🔒"} 
            <span className="hide-mobile">{isPro ? "Download Report" : "Unlock Pro"}</span>
        </button>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="stat-grid">
        <StatCard 
          title="Total Balance" 
          value={summary?.balance || 0} 
          trend={summary?.savingsChange} 
          icon={<FiDollarSign />} 
          color="#a78bfa" 
        />
        <StatCard 
          title="Total Income" 
          value={summary?.totalIncome || 0} 
          subtext="Main Monthly Salary" 
          icon={<FiTrendingUp />} 
          color="#10b981" 
        />
        <StatCard 
          title="Total Expense" 
          value={summary?.totalExpense || 0} 
          trend={summary?.expenseChange} 
          icon={<FiCreditCard />} 
          color="#ef4444" 
        />
        <StatCard 
          title="Total Savings" 
          value={summary?.savings || 0} 
          subtext="Net Monthly Savings" 
          icon={<FiPieChart />} 
          color="#3b82f6" 
        />
      </div>

      {/* Row 2: Charts + Budget Section */}
      <div className="responsive-flex">
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
            
            {/* AI Insights for PRO users */}
            {isPro ? (
               <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ color: '#a78bfa', fontSize: '1.2rem' }}><FiZap /></div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Smart Alerts</h3>
                    </div>
                  </div>
                  <DashboardAlerts alerts={alerts} />
               </div>
            ) : (
                <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', color: '#a78bfa', marginBottom: '12px' }}><FiLock /></div>
                            <div style={{ fontWeight: 700, marginBottom: '4px' }}>AI Analytics Locked</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Upgrade to Pro to unlock Smart Alerts</div>
                            <button className="upgrade-btn-small" onClick={() => window.location.href='/profile'}>Upgrade to Pro</button>
                        </div>
                    </div>
                    <div style={{ opacity: 0.2 }}>
                        <div style={{ height: '20px', width: '200px', background: '#334155', borderRadius: '4px', marginBottom: '12px' }}></div>
                        <div style={{ height: '14px', width: '100%', background: '#334155', borderRadius: '4px', marginBottom: '8px' }}></div>
                        <div style={{ height: '14px', width: '80%', background: '#334155', borderRadius: '4px' }}></div>
                    </div>
                </div>
            )}

            <div className="card" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Income vs Expense</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trend analysis for {selectedYear}</p>
                    </div>
                    <div style={{ padding: '6px 16px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-light)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700 }}>
                        Yearly View
                    </div>
                </div>
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <Charts monthlyData={monthlyData} hideHeader={true} />
                </div>
            </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <MonthlyBudgetCard 
            budget={budget} 
            categories={categories} 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
          />
          <HealthScoreCard isPro={isPro} />
        </div>
      </div>

      {/* Row 3: Recent Transactions Section */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <TransactionTable expenses={expenses} />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;