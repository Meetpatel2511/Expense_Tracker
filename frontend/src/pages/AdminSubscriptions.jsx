import React, { useState, useEffect, useCallback } from "react";
import {
  FiAward,
  FiSearch,
  FiRotateCcw,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw
} from "react-icons/fi";
import API from "../utils/api";
import Pagination from "../components/Pagination";

function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'ACTIVE' | 'EXPIRED'
  const [planFilter, setPlanFilter] = useState("ALL"); // 'ALL' | 'MONTHLY' | 'YEARLY'
  const [search, setSearch] = useState("");

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (planFilter !== "ALL") params.plan = planFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/admin/subscriptions", { params });
      setSubscriptions(res.data.subscriptions || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setError(err.response?.data?.message || "Failed to load subscriptions roster.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, planFilter, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setPlanFilter("ALL");
    setSearch("");
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="dashboard-content animate-fade pb-8" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>
            Pro Subscriptions Roster
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Track active Pro members, historical subscribers, plan cycles, and entitlement expiry.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
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
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: "16px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {/* Status & Plan Chips */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {/* Status filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {[
              { key: "ALL", label: "All Records" },
              { key: "ACTIVE", label: "Active Pro" },
              { key: "EXPIRED", label: "Expired" }
            ].map((tab) => {
              const isSelected = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: isSelected ? "1px solid var(--bg-accent)" : "1px solid rgba(255, 255, 255, 0.06)",
                    background: isSelected ? "rgba(124, 58, 237, 0.15)" : "rgba(255, 255, 255, 0.02)",
                    color: isSelected ? "var(--bg-accent)" : "var(--text-secondary)",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Plan filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {[
              { key: "ALL", label: "All Plans" },
              { key: "MONTHLY", label: "Monthly" },
              { key: "YEARLY", label: "Yearly" }
            ].map((p) => {
              const isSelected = planFilter === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setPlanFilter(p.key);
                    setPage(1);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: isSelected ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.06)",
                    background: isSelected ? "rgba(59, 130, 246, 0.15)" : "transparent",
                    color: isSelected ? "#60a5fa" : "var(--text-muted)",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "0.78rem",
                    cursor: "pointer"
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Reset */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
            <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search subscriber name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: "10px",
                background: "#11131f",
                border: "1px solid var(--border-color)",
                color: "#fff",
                fontSize: "0.85rem"
              }}
            />
          </div>

          {(statusFilter !== "ALL" || planFilter !== "ALL" || search) && (
            <button
              onClick={handleResetFilters}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#fca5a5",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <FiRotateCcw /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div style={{ borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.02)" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
            Subscribers <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>({total} total)</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid rgba(124, 58, 237, 0.2)", borderTopColor: "var(--bg-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading subscriptions...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <FiAlertCircle style={{ fontSize: "2.5rem", color: "#ef4444", marginBottom: "12px" }} />
            <h4 style={{ color: "#fff", marginBottom: "6px" }}>Failed to Load Subscriptions</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>{error}</p>
            <button onClick={fetchSubscriptions} style={{ padding: "8px 20px", borderRadius: "10px", border: "none", background: "var(--bg-accent)", color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>
              Try Again
            </button>
          </div>
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <FiAward style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: "12px" }} />
            <h4 style={{ color: "#fff", marginBottom: "6px" }}>No Subscriptions Found</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No subscriber records match the selected filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(255, 255, 255, 0.01)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "14px 20px" }}>Customer</th>
                  <th style={{ padding: "14px 16px" }}>Plan</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px" }}>Starts / Since</th>
                  <th style={{ padding: "14px 16px" }}>Expires At</th>
                  <th style={{ padding: "14px 20px" }}>Payment Ref</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s._id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{s.name || "Customer"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{s.email}</div>
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: s.plan === "YEARLY" ? "rgba(124, 58, 237, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          color: s.plan === "YEARLY" ? "#a78bfa" : "#60a5fa",
                          fontWeight: 700,
                          fontSize: "0.75rem"
                        }}
                      >
                        {s.plan} Pro
                      </span>
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          background: s.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                          border: s.status === "ACTIVE" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-color)",
                          color: s.status === "ACTIVE" ? "#10b981" : "var(--text-muted)",
                          fontSize: "0.75rem",
                          fontWeight: 700
                        }}
                      >
                        {s.status === "ACTIVE" ? <FiCheckCircle /> : <FiClock />} {s.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px 16px", color: "#e2e8f0" }}>
                      {formatDate(s.proStartsAt || s.proSince)}
                    </td>
                    <td style={{ padding: "16px 16px", color: s.status === "ACTIVE" ? "#fff" : "var(--text-muted)", fontWeight: s.status === "ACTIVE" ? 600 : 400 }}>
                      {formatDate(s.proExpiresAt)}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {s.paymentId || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "center" }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSubscriptions;
