import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiAward,
  FiCreditCard,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRight,
  FiChevronRight,
  FiShield
} from "react-icons/fi";
import API from "../utils/api";
import AdminPaymentDetailModal from "../components/AdminPaymentDetailModal";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/admin/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching admin dashboard:", err);
      setError(err.response?.data?.message || "Failed to load admin dashboard overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  };

  if (loading && !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(124, 58, 237, 0.2)",
            borderTopColor: "var(--bg-accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }}
        />
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Loading SaaS platform metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
        <FiAlertCircle style={{ fontSize: "3rem", color: "#ef4444", marginBottom: "16px" }} />
        <h3 style={{ color: "#fff", marginBottom: "8px" }}>Failed to Load Dashboard Overview</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>{error}</p>
        <button
          onClick={fetchDashboard}
          style={{
            padding: "10px 24px",
            borderRadius: "10px",
            background: "var(--bg-accent)",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const statusBreakdown = data?.paymentStatusBreakdown || {};
  const recentPayments = data?.recentPayments || [];
  const recentRegistrations = data?.recentRegistrations || [];

  return (
    <div className="dashboard-content animate-fade pb-8" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Banner & Refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>
            Platform Overview
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Real-time business health, active subscriptions, and revenue metrics.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
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
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <FiRefreshCw style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {/* Total Users */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Users
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              <FiUsers />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>
            {Number(metrics.totalUsers || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {metrics.freeUsers || 0} on Free Tier
          </div>
        </div>

        {/* Active Pro Subscribers */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Active Pro Users
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(124, 58, 237, 0.15)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              <FiAward />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>
            {Number(metrics.activeProSubscribers || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {metrics.monthlyProSubscribers || 0} Monthly • {metrics.yearlyProSubscribers || 0} Yearly
          </div>
        </div>

        {/* Pending Reviews */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pending Payments
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: metrics.pendingPaymentReviews > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)", color: metrics.pendingPaymentReviews > 0 ? "#f59e0b" : "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              <FiClock />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: metrics.pendingPaymentReviews > 0 ? "#f59e0b" : "#fff" }}>
            {Number(metrics.pendingPaymentReviews || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {metrics.pendingPaymentReviews > 0 ? "Requires admin review" : "All queues cleared"}
          </div>
        </div>

        {/* Total Revenue */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Revenue
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              <FiDollarSign />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>
            {formatCurrency(metrics.revenue?.totalRecognizedRevenue)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "6px" }}>
            <span>UPI: {formatCurrency(metrics.revenue?.manualUpiRevenue)}</span>
            <span>•</span>
            <span>Razorpay: {formatCurrency(metrics.revenue?.razorpayRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Payment Status Summary Bar */}
      <div style={{ padding: "20px 24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Payment Requests Breakdown</h3>
          <Link to="/admin/payments" style={{ color: "var(--bg-accent)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            View Full Queue <FiArrowRight />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
          <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div style={{ fontSize: "0.72rem", color: "#6ee7b7", fontWeight: 600, textTransform: "uppercase" }}>Approved</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>{statusBreakdown.approved || 0}</div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <div style={{ fontSize: "0.72rem", color: "#fcd34d", fontWeight: 600, textTransform: "uppercase" }}>Under Review</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f59e0b", marginTop: "2px" }}>{statusBreakdown.underReview || 0}</div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
            <div style={{ fontSize: "0.72rem", color: "#d8b4fe", fontWeight: 600, textTransform: "uppercase" }}>Needs Info</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#a855f7", marginTop: "2px" }}>{statusBreakdown.needsInfo || 0}</div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <div style={{ fontSize: "0.72rem", color: "#fca5a5", fontWeight: 600, textTransform: "uppercase" }}>Rejected</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ef4444", marginTop: "2px" }}>{statusBreakdown.rejected || 0}</div>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Payments & Recent Registrations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {/* Recent Payment Requests */}
        <div style={{ padding: "20px 24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiCreditCard style={{ color: "var(--bg-accent)" }} /> Recent Payment Requests
            </h3>
            <Link to="/admin/payments" style={{ color: "var(--bg-accent)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>
              View All
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>No payment requests recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentPayments.map((p) => (
                <div
                  key={p._id}
                  onClick={() => setSelectedPaymentId(p._id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                      {p.userId?.name || "Customer"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      UTR: <span style={{ fontFamily: "monospace", color: "#e2e8f0" }}>{p.utr}</span> • {formatDate(p.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
                      ₹{(p.amount / 100).toLocaleString("en-IN")}
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: 700,
                        background:
                          p.status === "APPROVED"
                            ? "rgba(16, 185, 129, 0.15)"
                            : p.status === "UNDER_REVIEW"
                            ? "rgba(245, 158, 11, 0.15)"
                            : p.status === "NEEDS_MORE_INFO"
                            ? "rgba(168, 85, 247, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        color:
                          p.status === "APPROVED"
                            ? "#10b981"
                            : p.status === "UNDER_REVIEW"
                            ? "#f59e0b"
                            : p.status === "NEEDS_MORE_INFO"
                            ? "#a855f7"
                            : "#ef4444"
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div style={{ padding: "20px 24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiUsers style={{ color: "#3b82f6" }} /> Recent Registrations
            </h3>
            <Link to="/admin/users" style={{ color: "var(--bg-accent)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>
              View All
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>No user accounts recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentRegistrations.map((u) => (
                <div
                  key={u._id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ overflow: "hidden", paddingRight: "10px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {u.name || "Unnamed User"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {u.email}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "3px 8px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        background: u.role === "ADMIN" ? "rgba(124, 58, 237, 0.2)" : u.isPro ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        color: u.role === "ADMIN" ? "#a78bfa" : u.isPro ? "#10b981" : "var(--text-muted)",
                        border: u.role === "ADMIN" ? "1px solid rgba(124, 58, 237, 0.3)" : "none"
                      }}
                    >
                      {u.role === "ADMIN" ? "ADMIN" : u.isPro ? `PRO (${u.plan || "SUB"})` : "FREE"}
                    </span>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      {formatDate(u.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal for Quick Inspection */}
      {selectedPaymentId && (
        <AdminPaymentDetailModal
          requestId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
          onActionCompleted={fetchDashboard}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
