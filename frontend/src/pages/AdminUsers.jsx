import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiSearch,
  FiRotateCcw,
  FiShield,
  FiUser,
  FiAward,
  FiAlertCircle,
  FiRefreshCw
} from "react-icons/fi";
import API from "../utils/api";
import Pagination from "../components/Pagination";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("ALL"); // 'ALL' | 'USER' | 'ADMIN'
  const [proFilter, setProFilter] = useState("ALL"); // 'ALL' | 'PRO' | 'FREE'
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit };
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (proFilter !== "ALL") params.proStatus = proFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/admin/users", { params });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching users directory:", err);
      setError(err.response?.data?.message || "Failed to load users directory.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, proFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleResetFilters = () => {
    setRoleFilter("ALL");
    setProFilter("ALL");
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
            Platform Users Directory
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Application-level directory of registered FinTrack users, platform roles, and membership tier.
          </p>
        </div>

        <button
          onClick={fetchUsers}
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
          Refresh Directory
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
        {/* Role & Pro Status Chips */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {/* Role filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {[
              { key: "ALL", label: "All Roles" },
              { key: "USER", label: "Users" },
              { key: "ADMIN", label: "Admins" }
            ].map((tab) => {
              const isSelected = roleFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setRoleFilter(tab.key);
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

          {/* Pro Status filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {[
              { key: "ALL", label: "All Tiers" },
              { key: "PRO", label: "Pro Members" },
              { key: "FREE", label: "Free Tier" }
            ].map((p) => {
              const isSelected = proFilter === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setProFilter(p.key);
                    setPage(1);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: isSelected ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.06)",
                    background: isSelected ? "rgba(16, 185, 129, 0.15)" : "transparent",
                    color: isSelected ? "#10b981" : "var(--text-muted)",
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
              placeholder="Search user name or email..."
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

          {(roleFilter !== "ALL" || proFilter !== "ALL" || search) && (
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

      {/* Users Table */}
      <div style={{ borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.02)" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
            Registered Users <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>({total} total)</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid rgba(124, 58, 237, 0.2)", borderTopColor: "var(--bg-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading user accounts...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <FiAlertCircle style={{ fontSize: "2.5rem", color: "#ef4444", marginBottom: "12px" }} />
            <h4 style={{ color: "#fff", marginBottom: "6px" }}>Failed to Load Users</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>{error}</p>
            <button onClick={fetchUsers} style={{ padding: "8px 20px", borderRadius: "10px", border: "none", background: "var(--bg-accent)", color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <FiUsers style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: "12px" }} />
            <h4 style={{ color: "#fff", marginBottom: "6px" }}>No Users Found</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No user accounts match the selected filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "rgba(255, 255, 255, 0.01)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "14px 20px" }}>User</th>
                  <th style={{ padding: "14px 16px" }}>Role</th>
                  <th style={{ padding: "14px 16px" }}>Membership</th>
                  <th style={{ padding: "14px 16px" }}>Pro Expiry</th>
                  <th style={{ padding: "14px 20px" }}>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{u.name || "User"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 10px",
                          borderRadius: "8px",
                          background: u.role === "ADMIN" ? "rgba(124, 58, 237, 0.2)" : "rgba(255, 255, 255, 0.05)",
                          border: u.role === "ADMIN" ? "1px solid rgba(124, 58, 237, 0.35)" : "1px solid var(--border-color)",
                          color: u.role === "ADMIN" ? "#c4b5fd" : "var(--text-secondary)",
                          fontSize: "0.75rem",
                          fontWeight: 700
                        }}
                      >
                        {u.role === "ADMIN" ? <FiShield /> : <FiUser />} {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: u.isPro ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.03)",
                          color: u.isPro ? "#10b981" : "var(--text-muted)",
                          fontWeight: 700,
                          fontSize: "0.75rem"
                        }}
                      >
                        {u.isPro ? `PRO (${u.plan || "SUB"})` : "FREE"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 16px", color: u.isPro ? "#fff" : "var(--text-muted)" }}>
                      {formatDate(u.proExpiresAt)}
                    </td>
                    <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>
                      {formatDate(u.createdAt)}
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

export default AdminUsers;
