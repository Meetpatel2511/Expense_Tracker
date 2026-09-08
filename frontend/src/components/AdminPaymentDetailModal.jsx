import React, { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiCheck,
  FiSlash,
  FiHelpCircle,
  FiUser,
  FiCreditCard,
  FiCalendar,
  FiFileText,
  FiClock,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiExternalLink,
  FiImage,
  FiMessageSquare,
  FiMaximize2
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import API from "../utils/api";

function AdminPaymentDetailModal({ requestId, onClose, onActionCompleted }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Receipt blob state
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [receiptError, setReceiptError] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);

  // Action dialog states
  const [activeAction, setActiveAction] = useState(null); // 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | null
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const receiptBlobUrlRef = useRef(null);

  // Fetch request details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/admin/payment-requests/${requestId}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching payment request details:", err);
      setError(err.response?.data?.message || "Failed to load payment details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch private receipt blob
  const fetchReceipt = async () => {
    try {
      setReceiptLoading(true);
      setReceiptError(null);
      const res = await API.get(`/admin/payment-requests/${requestId}/receipt`, {
        responseType: "blob"
      });

      if (receiptBlobUrlRef.current) {
        URL.revokeObjectURL(receiptBlobUrlRef.current);
      }

      const blobUrl = URL.createObjectURL(res.data);
      receiptBlobUrlRef.current = blobUrl;
      setReceiptUrl(blobUrl);
    } catch (err) {
      setReceiptError(err.response?.status === 404 ? "Receipt proof not found or missing from server storage." : "Failed to load receipt proof.");
      setReceiptUrl(null);
    } finally {
      setReceiptLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchDetails();
      fetchReceipt();
    }

    return () => {
      if (receiptBlobUrlRef.current) {
        URL.revokeObjectURL(receiptBlobUrlRef.current);
      }
    };
  }, [requestId]);

  // Handle Approve
  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const res = await API.post(`/admin/payment-requests/${requestId}/approve`, {
        adminNote: adminNoteInput.trim() || undefined
      });

      toast.success(res.data.message || "Payment approved and Pro entitlement activated!");
      setActiveAction(null);
      if (onActionCompleted) onActionCompleted();
      await fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve payment request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!rejectionReasonInput.trim()) {
      toast.error("Please provide a reason for rejecting this payment request.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await API.post(`/admin/payment-requests/${requestId}/reject`, {
        rejectionReason: rejectionReasonInput.trim(),
        adminNote: adminNoteInput.trim() || undefined
      });

      toast.success(res.data.message || "Payment request rejected.");
      setActiveAction(null);
      if (onActionCompleted) onActionCompleted();
      await fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject payment request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request More Info
  const handleRequestInfo = async () => {
    if (!adminNoteInput.trim()) {
      toast.error("Please enter a note explaining what information or proof is needed.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await API.post(`/admin/payment-requests/${requestId}/request-info`, {
        adminNote: adminNoteInput.trim()
      });

      toast.success(res.data.message || "Updated status to require more information.");
      setActiveAction(null);
      if (onActionCompleted) onActionCompleted();
      await fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update payment request.");
    } finally {
      setActionLoading(false);
    }
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
          label: "Needs More Info"
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const pr = data?.paymentRequest;
  const audits = data?.auditTrail || [];
  const statusMeta = pr ? getStatusBadge(pr.status) : null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000, padding: "16px" }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "880px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(124, 58, 237, 0.15)",
                color: "var(--bg-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem"
              }}
            >
              <FiShield />
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                Payment Request Review
              </h3>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                ID: {requestId}
              </div>
            </div>
          </div>

          <button className="modal-close" onClick={onClose} style={{ position: "static" }}>
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "28px 32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: "12px" }}>
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
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Loading payment details...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "24px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)", textAlign: "center" }}>
              <FiAlertCircle style={{ fontSize: "2rem", color: "#ef4444", marginBottom: "8px" }} />
              <p style={{ color: "#ef4444", fontWeight: 600 }}>{error}</p>
            </div>
          ) : pr ? (
            <>
              {/* Status Header Banner */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: statusMeta.bg,
                  border: `1px solid ${statusMeta.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.2rem", color: statusMeta.color }}>{statusMeta.icon}</span>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: statusMeta.color }}>
                      Status: {statusMeta.label}
                    </div>
                    {pr.reviewedAt && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Reviewed on {formatDateTime(pr.reviewedAt)} by {pr.reviewedBy?.name || pr.reviewedBy?.email || "Admin"}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                  {formatCurrency(pr.amount)}
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginLeft: "6px" }}>
                    ({pr.plan} Pro)
                  </span>
                </div>
              </div>

              {/* Rejection / Note Banner if present */}
              {pr.rejectionReason && (
                <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#fca5a5", fontSize: "0.85rem" }}>
                  <strong>Rejection Reason:</strong> {pr.rejectionReason}
                </div>
              )}

              {pr.adminNote && (
                <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.25)", color: "#c4b5fd", fontSize: "0.85rem" }}>
                  <strong>Admin Note:</strong> {pr.adminNote}
                </div>
              )}

              {/* Grid: Payment Info + User Info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {/* Payment Evidence Card */}
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px"
                  }}
                >
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--bg-accent)", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiCreditCard /> Payment Details
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>UTR / Ref No:</span>
                      <strong style={{ color: "#fff", fontFamily: "monospace", letterSpacing: "1px" }}>{pr.utr}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Payer UPI ID:</span>
                      <span style={{ color: "#fff" }}>{pr.payerUpiId || "Not provided"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Payment Date:</span>
                      <span style={{ color: "#fff" }}>{formatDateTime(pr.paidAt)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Submitted At:</span>
                      <span style={{ color: "#fff" }}>{formatDateTime(pr.createdAt)}</span>
                    </div>
                    {pr.userNote && (
                      <div style={{ marginTop: "4px", padding: "10px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        "{pr.userNote}"
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info Card */}
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px"
                  }}
                >
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "#3b82f6", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiUser /> User Account
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Name:</span>
                      <strong style={{ color: "#fff" }}>{pr.userId?.name || "N/A"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Email:</span>
                      <span style={{ color: "#fff" }}>{pr.userId?.email || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Current Pro:</span>
                      <span style={{ color: pr.userId?.isPro ? "#10b981" : "var(--text-muted)", fontWeight: 600 }}>
                        {pr.userId?.isPro ? `Active (${pr.userId.plan || "PRO"})` : "Free User"}
                      </span>
                    </div>
                    {pr.userId?.proExpiresAt && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)" }}>Pro Expiry:</span>
                        <span style={{ color: "var(--text-secondary)" }}>{formatDateTime(pr.userId.proExpiresAt)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Account Role:</span>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{pr.userId?.role || "USER"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Private Receipt Screenshot Viewer */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "#10b981", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiImage /> Payment Receipt Proof
                  </div>
                  {receiptUrl && (
                    <button
                      onClick={() => setShowFullImage(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--bg-accent)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <FiMaximize2 /> View Full Size
                    </button>
                  )}
                </div>

                <div
                  style={{
                    borderRadius: "12px",
                    background: "#0b0d14",
                    minHeight: "200px",
                    maxHeight: "360px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    position: "relative"
                  }}
                >
                  {receiptLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          border: "2px solid rgba(16, 185, 129, 0.2)",
                          borderTopColor: "#10b981",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite"
                        }}
                      />
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading receipt stream...</span>
                    </div>
                  ) : receiptError ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                      <FiAlertCircle style={{ fontSize: "1.8rem", color: "var(--accent-warning)", marginBottom: "6px" }} />
                      <p style={{ fontSize: "0.85rem" }}>{receiptError}</p>
                    </div>
                  ) : receiptUrl ? (
                    <img
                      src={receiptUrl}
                      alt="UPI Payment Proof"
                      onClick={() => setShowFullImage(true)}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "360px",
                        objectFit: "contain",
                        cursor: "zoom-in",
                        transition: "transform 0.2s ease"
                      }}
                    />
                  ) : null}
                </div>
              </div>

              {/* Complete PaymentAudit Timeline */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiClock /> Audit Trail & History ({audits.length})
                </div>

                {audits.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No audit records found.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {audits.map((audit, index) => (
                      <div
                        key={audit._id || index}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.02)",
                          borderLeft: `3px solid ${
                            audit.action.includes("APPROVED")
                              ? "#10b981"
                              : audit.action.includes("REJECTED")
                              ? "#ef4444"
                              : audit.action.includes("NEEDS_MORE_INFO")
                              ? "#a78bfa"
                              : "#3b82f6"
                          }`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          fontSize: "0.82rem",
                          gap: "12px"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
                            {audit.action}
                          </div>
                          {audit.note && (
                            <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>
                              {audit.note}
                            </div>
                          )}
                          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                            By: {audit.performedBy?.name || audit.performedBy?.email || audit.performedByRole || "System"}
                          </div>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {formatDateTime(audit.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Action Buttons Footer */}
        {pr && (
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid var(--border-color)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              Close
            </button>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Request More Info Button */}
              {pr.status !== "APPROVED" && pr.status !== "REJECTED" && (
                <button
                  onClick={() => {
                    setAdminNoteInput("");
                    setActiveAction("REQUEST_INFO");
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid rgba(124, 58, 237, 0.4)",
                    background: "rgba(124, 58, 237, 0.12)",
                    color: "#c4b5fd",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FiHelpCircle /> Request Info
                </button>
              )}

              {/* Reject Button */}
              {pr.status !== "APPROVED" && pr.status !== "REJECTED" && (
                <button
                  onClick={() => {
                    setRejectionReasonInput("");
                    setAdminNoteInput("");
                    setActiveAction("REJECT");
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#fca5a5",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FiSlash /> Reject
                </button>
              )}

              {/* Approve Button */}
              {pr.status !== "REJECTED" && (
                <button
                  onClick={() => {
                    setAdminNoteInput("");
                    setActiveAction("APPROVE");
                  }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
                  }}
                >
                  <FiCheck /> {pr.status === "APPROVED" ? "Reconcile / Retry" : "Approve Payment"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Sub-Modals (Approve / Reject / Request Info) */}
      {activeAction && (
        <div
          className="modal-overlay"
          onClick={() => !actionLoading && setActiveAction(null)}
          style={{ zIndex: 100010 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", padding: "32px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  background:
                    activeAction === "APPROVE"
                      ? "rgba(16, 185, 129, 0.15)"
                      : activeAction === "REJECT"
                      ? "rgba(239, 68, 68, 0.15)"
                      : "rgba(124, 58, 237, 0.15)",
                  color:
                    activeAction === "APPROVE"
                      ? "#10b981"
                      : activeAction === "REJECT"
                      ? "#ef4444"
                      : "#a78bfa"
                }}
              >
                {activeAction === "APPROVE" && <FiCheck />}
                {activeAction === "REJECT" && <FiSlash />}
                {activeAction === "REQUEST_INFO" && <FiHelpCircle />}
              </div>

              <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
                {activeAction === "APPROVE" && "Approve Payment Request"}
                {activeAction === "REJECT" && "Reject Payment Request"}
                {activeAction === "REQUEST_INFO" && "Request Additional Information"}
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {activeAction === "APPROVE" &&
                  `This will activate ${pr.plan} Pro subscription for ${pr.userId?.name || pr.userId?.email || "this user"} and record an immutable audit entry.`}
                {activeAction === "REJECT" &&
                  "Please provide a reason for rejection. The user will be notified of this reason."}
                {activeAction === "REQUEST_INFO" &&
                  "Explain what additional evidence (e.g. clearer UTR, uncropped screenshot) is needed from the user."}
              </p>
            </div>

            {/* Input fields based on action */}
            {activeAction === "REJECT" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Rejection Reason <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. UTR not found in bank statement, amount mismatch..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#11131f",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    resize: "none"
                  }}
                />
              </div>
            )}

            {activeAction === "REQUEST_INFO" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Note to Customer <span style={{ color: "#a78bfa" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="e.g. Please upload a clear screenshot showing the full 12-digit UTR..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#11131f",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    resize: "none"
                  }}
                />
              </div>
            )}

            {activeAction === "APPROVE" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Internal Admin Note (Optional)
                </label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="e.g. Verified on HDFC corporate netbanking"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#11131f",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    fontSize: "0.85rem"
                  }}
                />
              </div>
            )}

            {/* Action Dialog Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setActiveAction(null)}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: actionLoading ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (activeAction === "APPROVE") handleApprove();
                  if (activeAction === "REJECT") handleReject();
                  if (activeAction === "REQUEST_INFO") handleRequestInfo();
                }}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    activeAction === "APPROVE"
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : activeAction === "REJECT"
                      ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                      : "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Zoom Modal */}
      {showFullImage && receiptUrl && (
        <div
          className="modal-overlay"
          onClick={() => setShowFullImage(false)}
          style={{ zIndex: 100020, background: "rgba(0,0,0,0.95)" }}
        >
          <button
            className="modal-close"
            onClick={() => setShowFullImage(false)}
            style={{ position: "fixed", top: "24px", right: "24px", zIndex: 100021 }}
          >
            <FiX />
          </button>
          <img
            src={receiptUrl}
            alt="Receipt Full Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AdminPaymentDetailModal;
