import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiSend,
  FiPaperclip,
  FiImage,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiSlash,
  FiShield,
  FiMaximize2,
  FiCheckCircle,
  FiMessageSquare
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import API from "../utils/api";

function PaymentSupportModal({ requestId, paymentRequest: initialPr, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(initialPr || null);

  // Composer state
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  // Image zoom preview state
  const [activeZoomUrl, setActiveZoomUrl] = useState(null);
  const [attachmentBlobs, setAttachmentBlobs] = useState({});

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch thread messages
  const fetchMessages = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/payment-request/${requestId}/support`);
      setMessages(res.data.messages || []);
      if (res.data.status && paymentRequest) {
        setPaymentRequest((prev) => ({ ...prev, status: res.data.status }));
      }
    } catch (err) {
      console.error("Error fetching support messages:", err);
      setError(err.response?.data?.message || "Failed to load support thread.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  // Handle file select
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setSendError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSendError("Attachment must not exceed 5 MB.");
      return;
    }

    setAttachment(file);
    setSendError(null);

    const reader = new FileReader();
    reader.onload = (ev) => setAttachmentPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Load authenticated attachment blob for display
  const loadAttachmentBlob = async (messageId) => {
    if (attachmentBlobs[messageId]) {
      setActiveZoomUrl(attachmentBlobs[messageId]);
      return;
    }

    try {
      const res = await API.get(`/payment-request/${requestId}/support/attachment/${messageId}`, {
        responseType: "blob"
      });
      const blobUrl = URL.createObjectURL(res.data);
      setAttachmentBlobs((prev) => ({ ...prev, [messageId]: blobUrl }));
      setActiveZoomUrl(blobUrl);
    } catch (err) {
      toast.error("Failed to load attachment image.");
    }
  };

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault();
    setSendError(null);

    const trimmed = inputText.trim();
    if (!trimmed && !attachment) {
      setSendError("Please type a message or attach a screenshot.");
      return;
    }
    if (trimmed.length > 2000) {
      setSendError("Message cannot exceed 2000 characters.");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      if (trimmed) formData.append("message", trimmed);
      if (attachment) formData.append("attachment", attachment);

      const res = await API.post(`/payment-request/${requestId}/support`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessages((prev) => [...prev, res.data.message]);
      setInputText("");
      removeAttachment();
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Error sending message:", err);
      setSendError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
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
          label: status || "Unknown"
        };
    }
  };

  const statusMeta = getStatusBadge(paymentRequest?.status);

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000, padding: "16px" }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "680px",
          width: "100%",
          height: "85vh",
          maxHeight: "750px",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          background: "#0e111a",
          border: "1px solid rgba(124, 58, 237, 0.25)",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-color)",
            background: "rgba(255, 255, 255, 0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(124, 58, 237, 0.05) 100%)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "#a78bfa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem"
              }}
            >
              <FiMessageSquare />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                  Payment Support Thread
                </h3>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "8px",
                    background: statusMeta.bg,
                    border: `1px solid ${statusMeta.border}`,
                    color: statusMeta.color,
                    fontSize: "0.7rem",
                    fontWeight: 700
                  }}
                >
                  {statusMeta.icon} {statusMeta.label}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Plan: <strong style={{ color: "#fff" }}>{paymentRequest?.plan === "YEARLY" ? "Yearly Pro" : "Monthly Pro"}</strong>
                {paymentRequest?.utr && <> • UTR: <span style={{ fontFamily: "monospace", color: "#a78bfa" }}>{paymentRequest.utr}</span></>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close"
            style={{ position: "static", background: "rgba(255, 255, 255, 0.05)" }}
          >
            <FiX />
          </button>
        </div>

        {/* Message Timeline Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: "radial-gradient(ellipse at top, rgba(124, 58, 237, 0.03) 0%, transparent 70%)"
          }}
        >
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "3px solid rgba(124, 58, 237, 0.2)",
                  borderTopColor: "var(--bg-accent)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }}
              />
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Loading conversation...</span>
            </div>
          ) : error ? (
            <div style={{ padding: "20px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.2)", textAlign: "center", margin: "auto" }}>
              <FiAlertCircle style={{ color: "#ef4444", fontSize: "1.8rem", marginBottom: "6px" }} />
              <p style={{ color: "#fca5a5", fontSize: "0.85rem", margin: 0 }}>{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", margin: "auto", maxWidth: "340px", padding: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(124, 58, 237, 0.1)",
                  color: "#a78bfa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "1.3rem"
                }}
              >
                <FiShield />
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                Direct Payment Support
              </h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                Need help with your UPI payment, receipt proof, or status? Send a message to our verification team below.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.senderRole === "USER";
              return (
                <div
                  key={msg._id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    gap: "4px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      padding: "0 4px"
                    }}
                  >
                    {!isUser && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          color: "#a78bfa",
                          fontWeight: 700,
                          background: "rgba(124, 58, 237, 0.15)",
                          padding: "1px 6px",
                          borderRadius: "4px"
                        }}
                      >
                        <FiShield size={10} /> FinTrack Support
                      </span>
                    )}
                    {isUser && <span style={{ fontWeight: 600 }}>You</span>}
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "12px 16px",
                      borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      background: isUser
                        ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#fff",
                      fontSize: "0.88rem",
                      lineHeight: "1.45",
                      wordBreak: "break-word",
                      boxShadow: isUser ? "0 4px 14px rgba(124, 58, 237, 0.25)" : "none"
                    }}
                  >
                    {msg.message && <div style={{ whiteSpace: "pre-wrap" }}>{msg.message}</div>}

                    {msg.attachmentRef && (
                      <div style={{ marginTop: msg.message ? "10px" : "0" }}>
                        <button
                          type="button"
                          onClick={() => loadAttachmentBlob(msg._id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: "rgba(0, 0, 0, 0.25)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            color: "#fff",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <FiImage /> View Attachment Proof ({msg.attachmentOriginalName || "Screenshot"})
                          <FiMaximize2 size={12} style={{ opacity: 0.7 }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer Form */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border-color)",
            background: "rgba(255, 255, 255, 0.02)",
            flexShrink: 0
          }}
        >
          {sendError && (
            <div
              style={{
                marginBottom: "10px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <FiAlertCircle /> {sendError}
            </div>
          )}

          {/* Attachment Preview Chip */}
          {attachmentPreview && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px",
                borderRadius: "8px",
                background: "rgba(124, 58, 237, 0.15)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                marginBottom: "10px",
                fontSize: "0.75rem",
                color: "#c4b5fd"
              }}
            >
              <FiImage />
              <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {attachment?.name} ({(attachment?.size / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={removeAttachment}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  display: "flex",
                  padding: "2px"
                }}
              >
                <FiX />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach screenshot (JPEG, PNG, WebP — max 5 MB)"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: attachment ? "rgba(124, 58, 237, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color)",
                color: attachment ? "#a78bfa" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                fontSize: "1.1rem"
              }}
            >
              <FiPaperclip />
            </button>

            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message or clarification (Enter to send)..."
              maxLength={2000}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#11131f",
                border: "1px solid var(--border-color)",
                color: "#fff",
                fontSize: "0.85rem",
                resize: "none",
                outline: "none",
                fontFamily: "inherit"
              }}
            />

            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !attachment)}
              style={{
                height: "42px",
                padding: "0 18px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: sending || (!inputText.trim() && !attachment) ? "not-allowed" : "pointer",
                opacity: sending || (!inputText.trim() && !attachment) ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0
              }}
            >
              {sending ? (
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }}
                />
              ) : (
                <>
                  Send <FiSend />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Full Image Zoom Modal */}
      {activeZoomUrl && (
        <div
          className="modal-overlay"
          onClick={() => setActiveZoomUrl(null)}
          style={{ zIndex: 100020, background: "rgba(0,0,0,0.95)" }}
        >
          <button
            className="modal-close"
            onClick={() => setActiveZoomUrl(null)}
            style={{ position: "fixed", top: "24px", right: "24px", zIndex: 100021 }}
          >
            <FiX />
          </button>
          <img
            src={activeZoomUrl}
            alt="Support Attachment Preview"
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

  return createPortal(modalJSX, document.body);
}

export default PaymentSupportModal;
