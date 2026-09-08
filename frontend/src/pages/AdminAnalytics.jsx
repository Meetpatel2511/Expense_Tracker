import React, { useState, useEffect, useCallback } from "react";
import {
  FiTrendingUp,
  FiDollarSign,
  FiPieChart,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiActivity
} from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import API from "../utils/api";

function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/admin/analytics");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.response?.data?.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(124, 58, 237, 0.2)", borderTopColor: "var(--bg-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Computing platform analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
        <FiAlertCircle style={{ fontSize: "3rem", color: "#ef4444", marginBottom: "16px" }} />
        <h3 style={{ color: "#fff", marginBottom: "8px" }}>Failed to Load Analytics</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>{error}</p>
        <button onClick={fetchAnalytics} style={{ padding: "10px 24px", borderRadius: "10px", background: "var(--bg-accent)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
          Try Again
        </button>
      </div>
    );
  }

  const userGrowth = data?.userGrowthTrend || [];
  const revenueTrend = data?.revenueTrend || [];
  const planDist = data?.planDistribution || [];
  const paymentDist = data?.paymentStatusDistribution || [];
  const performance = data?.performance || {};

  return (
    <div className="dashboard-content animate-fade pb-8" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>
            Platform Analytics & Trends
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Historical 6-month growth trajectories, revenue channels, and verification rates.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          <FiRefreshCw style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
          Refresh Trends
        </button>
      </div>

      {/* Top Performance Ribbon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div style={{ padding: "18px 20px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Total Reviews</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{performance.totalRequests || 0}</div>
        </div>
        <div style={{ padding: "18px 20px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.78rem", color: "#6ee7b7", textTransform: "uppercase", fontWeight: 600 }}>Approved Total</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>{performance.approvedCount || 0}</div>
        </div>
        <div style={{ padding: "18px 20px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.78rem", color: "#fca5a5", textTransform: "uppercase", fontWeight: 600 }}>Rejected Total</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>{performance.rejectedCount || 0}</div>
        </div>
        <div style={{ padding: "18px 20px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
          <div style={{ fontSize: "0.78rem", color: "#c4b5fd", textTransform: "uppercase", fontWeight: 600 }}>Approval Rate</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--bg-accent)", marginTop: "4px" }}>{performance.approvalRate || 0}%</div>
        </div>
      </div>

      {/* Revenue Channel Chart (6 Months) */}
      <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiDollarSign style={{ color: "#10b981" }} /> Revenue Trend by Channel (INR)
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Monthly recognized revenue split across Manual UPI approvals and Razorpay gateway.
            </p>
          </div>
        </div>

        <div style={{ width: "100%", height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ background: "#11131f", border: "1px solid var(--border-color)", borderRadius: "10px" }}
                formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: "0.8rem", paddingTop: "10px" }} />
              <Bar dataKey="manualUpi" name="Manual UPI" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="razorpay" name="Razorpay" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: User Registrations & Plan Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
        {/* User Growth Area Chart */}
        <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <FiTrendingUp style={{ color: "#3b82f6" }} /> 6-Month User Growth
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "16px" }}>
            New user registrations per month.
          </p>

          <div style={{ width: "100%", height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#11131f", border: "1px solid var(--border-color)", borderRadius: "10px" }} />
                <Area type="monotone" dataKey="users" name="Registrations" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution Pie Chart */}
        <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <FiPieChart style={{ color: "var(--bg-accent)" }} /> Membership Tier Distribution
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "16px" }}>
            Active Pro plans vs Free Tier users.
          </p>

          <div style={{ width: "100%", height: "220px", display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {planDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#11131f", border: "1px solid var(--border-color)", borderRadius: "10px" }} />
                <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
