import React, { useState, useEffect, useCallback } from "react";
import {
  FiShield,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSlash,
  FiChevronRight,
  FiUser,
  FiCreditCard,
  FiRotateCcw
} from "react-icons/fi";
import API from "../utils/api";
import Pagination from "../components/Pagination";
import AdminPaymentDetailModal from "../components/AdminPaymentDetailModal";

function AdminPayments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("ALL"); // 'ALL' | 'UNDER_REVIEW' | 'NEEDS_MORE_INFO' | 'APPROVED' | 'REJECTED'
  const [utrSearch, setUtrSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  // Detail modal state
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit
      };

      if (selectedStatus && selectedStatus !== "ALL") {
        params.status = selectedStatus;
      }
      if (utrSearch.trim()) {
        params.utr = utrSearch.trim();
      }
      if (emailSearch.trim()) {
        params.email = emailSearch.trim();
      }

      const res = await API.get("/admin/payment-requests", { params });

      setRequests(res.data.requests || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching admin payment queue:", err);
      setError(err.response?.data?.message || "Failed to load payment review queue.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedStatus, utrSearch, emailSearch]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedStatus("ALL");
    setUtrSearch("");
    setEmailSearch("");
    setPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          color: "#10b981",
          border: "rgba(16, 185, 129, 0.3)",
          icon: <FiCheckCircle />,
          label: "Approved"
        };
      case "UNDER_REVIEW":
        return {
          bg: "rgba(245, 158, 11, 0.15)",
          color: "#f59e0b",
          border: "rgba(245, 158, 11, 0.3)",
          icon: <FiClock />,
          label: "Under Review"
        };
      case "NEEDS_MORE_INFO":
        return {
          bg: "rgba(124, 58, 237, 0.15)",
          color: "#a78bfa",
          border: "rgba(124, 58, 237, 0.3)",
          icon: <FiAlertCircle />,
          label: "Needs Info"
        };
      case "REJECTED":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          color: "#ef4444",
          border: "rgba(239, 68, 68, 0.3)",
          icon: <FiSlash />,
          label: "Rejected"
        };
      default:
        return {
          bg: "rgba(255, 255, 255, 0.05)",
          color: "var(--text-secondary)",
          border: "var(--border-color)",
          icon: <FiClock />,
          label: status
        };
    }
  };

  const formatCurrency = (amountInPaise) => {
    if (typeof amountInPaise !== "number" || isNaN(amountInPaise)) return "₹0";
    return `₹${(amountInPaise / 100).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="dashboard-content animate-fade pb-8" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "20px",
                background: "rgba(124, 58, 237, 0.15)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "#a78bfa",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              <FiShield /> Admin Portal
            </span>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>
            Manual UPI Payment Review
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Verify submitted UPI transactions, inspect receipt proofs, and activate Pro subscriptions.
          </p>
        </div>

        <button
          onClick={fetchQueue}
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
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search Bar */}
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
        {/* Status Filter Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { key: "ALL", label: "All Requests" },
            { key: "UNDER_REVIEW", label: "Under Review" },
            { key: "NEEDS_MORE_INFO", label: "Needs Info" },
            { key: "APPROVED", label: "Approved" },
            { key: "REJECTED", label: "Rejected" }
          ].map((tab) => {
            const isSelected = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusFilterChange(tab.key)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: isSelected ? "1px solid var(--bg-accent)" : "1px solid rgba(255, 255, 255, 0.06)",
                  background: isSelected ? "rgba(124, 58, 237, 0.15)" : "rgba(255, 255, 255, 0.02)",
                  color: isSelected ? "var(--bg-accent)" : "var(--text-secondary)",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", alignItems: "center" }}>
          {/* UTR Search */}
          <div style={{ position: "relative" }}>
            <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.95rem" }} />
            <input
              type="text"
              placeholder="Search by 12-digit UTR..."
              value={utrSearch}
              onChange={(e) => {
                setUtrSearch(e.target.value);
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

          {/* Email Search */}
          <div style={{ position: "relative" }}>
            <FiUser style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.95rem" }} />
            <input
              type="text"
              placeholder="Search by user email..."
              value={emailSearch}
              onChange={(e) => {
                setEmailSearch(e.target.value);
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

          {/* Reset Filters Button */}
          {(selectedStatus !== "ALL" || utrSearch || emailSearch) && (
            <button
              onClick={handleResetFilters}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#fca5a5",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <FiRotateCcw /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Queue Table */}
      <div
        style={{
          borderRadius: "16px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          overflow: "hidden"
        }}
      >
        {/* Table Header Summary */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)"
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
            Payment Requests <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>({total} total)</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                border: "3px solid rgba(124, 58, 237, 0.2)",
                borderTopColor: "var(--bg-accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }}
            />
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading review queue...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <FiAlertCircle style={{ fontSize: "2.5rem", color: "#ef4444", marginBottom: "12px" }} />
            <h4 style={{ color: "#fff", marginBottom: "6px" }}>Failed to Load Queue</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>{error}</p>
            <button
              onClick={fetchQueue}
              style={{
                padding: "8px 20px",
                borderRadius: "10px",
                border: "none",
                background: "var(--bg-accent)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.85rem"
              }}
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <FiCreditCard style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: "12px" }} />
            <h4 style={{ color: "#fff", marginBottom: "6px" }}>No Payment Requests Found</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              There are no payment requests matching the selected filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(255, 255, 255, 0.01)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "14px 20px" }}>Customer</th>
                  <th style={{ padding: "14px 16px" }}>Plan</th>
                  <th style={{ padding: "14px 16px" }}>Amount</th>
                  <th style={{ padding: "14px 16px" }}>UTR / Ref</th>
                  <th style={{ padding: "14px 16px" }}>Submitted At</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const statusMeta = getStatusBadge(req.status);
                  return (
                    <tr
                      key={req._id}
                      onClick={() => setSelectedRequestId(req._id)}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        cursor: "pointer",
                        transition: "background 0.2s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Customer */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 700, color: "#fff" }}>
                          {req.userId?.name || "Unknown User"}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {req.userId?.email || "No email"}
                        </div>
                      </td>

                      {/* Plan */}
                      <td style={{ padding: "16px 16px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            background: req.plan === "YEARLY" ? "rgba(124, 58, 237, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: req.plan === "YEARLY" ? "#a78bfa" : "#60a5fa",
                            fontWeight: 700,
                            fontSize: "0.75rem"
                          }}
                        >
                          {req.plan}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "16px 16px", fontWeight: 700, color: "#fff" }}>
                        {formatCurrency(req.amount)}
                      </td>

                      {/* UTR */}
                      <td style={{ padding: "16px 16px" }}>
                        <span style={{ fontFamily: "monospace", color: "#e2e8f0", letterSpacing: "0.5px" }}>
                          {req.utr}
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td style={{ padding: "16px 16px" }}>
                        <div style={{ color: "#fff" }}>{formatDate(req.createdAt)}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{formatTime(req.createdAt)}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            background: statusMeta.bg,
                            border: `1px solid ${statusMeta.border}`,
                            color: statusMeta.color,
                            fontSize: "0.75rem",
                            fontWeight: 700
                          }}
                        >
                          {statusMeta.icon} {statusMeta.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(req._id);
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(124, 58, 237, 0.1)",
                            color: "var(--bg-accent)",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          Review <FiChevronRight />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Detail & Review Modal */}
      {selectedRequestId && (
        <AdminPaymentDetailModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onActionCompleted={fetchQueue}
        />
      )}
    </div>
  );
}

export default AdminPayments;
