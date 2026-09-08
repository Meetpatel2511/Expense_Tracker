import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiUpload,
  FiArrowLeft,
  FiAlertCircle,
  FiClock,
  FiImage,
  FiChevronRight
} from "react-icons/fi";
import API from "../utils/api";

// Step constants for the multi-step wizard
const STEP = {
  INSTRUCTIONS: 0,
  EVIDENCE: 1,
  CONFIRMATION: 2,
  STATUS: 3
};

function UpiPaymentModal({ selectedPlan = "MONTHLY", onClose, onSubmitted }) {
  const [step, setStep] = useState(STEP.INSTRUCTIONS);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Evidence form state
  const [utr, setUtr] = useState("");
  const [payerUpiId, setPayerUpiId] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [userNote, setUserNote] = useState("");
  const fileInputRef = useRef(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Fetch server-authoritative UPI configuration & pricing
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        setConfigError(null);
        const res = await API.get("/payment-request/config");
        if (isMounted) setConfig(res.data);
      } catch (err) {
        if (isMounted) {
          setConfigError(
            err.response?.data?.message ||
            "Failed to load payment configuration. Please try again."
          );
        }
      } finally {
        if (isMounted) setConfigLoading(false);
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  const planInfo = config?.plans?.[selectedPlan];
  const upiVpa = config?.upi?.vpa;
  const payeeName = config?.upi?.payeeName || "FinTrack";

  // Generate UPI deep-link URI for QR code
  const upiUri = upiVpa && planInfo
    ? `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${planInfo.priceINR}&cu=INR&tn=${encodeURIComponent(`FinTrack ${selectedPlan === "YEARLY" ? "Yearly" : "Monthly"} Pro`)}`
    : "";

  const copyVpa = useCallback(async () => {
    if (!upiVpa) return;
    try {
      await navigator.clipboard.writeText(upiVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    } catch { /* clipboard denied */ }
  }, [upiVpa]);

  // File handling
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validations (server re-validates)
    const maxSize = 5 * 1024 * 1024;
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      setSubmitError("Only JPEG, PNG, and WebP images are accepted.");
      return;
    }
    if (file.size > maxSize) {
      setSubmitError("Screenshot must be under 5 MB.");
      return;
    }

    setScreenshot(file);
    setSubmitError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  const removeScreenshot = useCallback(() => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Form submission
  const handleSubmit = async () => {
    setSubmitError(null);

    // Client-side checks
    const trimmedUtr = utr.trim();
    if (!trimmedUtr) {
      setSubmitError("Please enter your UTR / Transaction Reference number.");
      return;
    }
    const cleanUtr = trimmedUtr.replace(/\s/g, "");
    if (cleanUtr.length < 6 || cleanUtr.length > 30) {
      setSubmitError("UTR must be between 6 and 30 characters.");
      return;
    }
    if (!paidAt) {
      setSubmitError("Please select the date and time when you completed the payment.");
      return;
    }
    const selectedPaidDate = new Date(paidAt);
    if (isNaN(selectedPaidDate.getTime()) || selectedPaidDate > new Date()) {
      setSubmitError("Payment date cannot be in the future.");
      return;
    }
    if (!screenshot) {
      setSubmitError("Please upload a screenshot of your payment receipt.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("plan", selectedPlan);
      formData.append("paymentMethod", "UPI_MANUAL");
      formData.append("utr", trimmedUtr);
      if (payerUpiId.trim()) formData.append("payerUpiId", payerUpiId.trim());
      formData.append("paidAt", selectedPaidDate.toISOString());
      if (userNote.trim()) formData.append("userNote", userNote.trim());
      formData.append("screenshot", screenshot);

      const res = await API.post("/payment-request/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSubmittedRequest(res.data.paymentRequest);
      setStep(STEP.STATUS);
      if (onSubmitted) onSubmitted(res.data.paymentRequest);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === "UTR_ALREADY_EXISTS") {
        setSubmitError("This UTR has already been submitted. Please check your transaction reference.");
      } else if (errData?.code === "PENDING_REQUEST_EXISTS") {
        setSubmitError("You already have a payment request under review. Please wait for verification.");
      } else {
        setSubmitError(errData?.message || "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Shared styles
  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--text-muted, #94a3b8)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px"
  };
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border-light, rgba(255,255,255,0.08))",
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 500,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box"
  };

  // Render: Config Loading / Error
  if (configLoading) {
    return createPortal(
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", textAlign: "center", padding: "48px 32px" }}>
          <div className="animate-spin" style={{
            width: "44px", height: "44px",
            border: "4px solid rgba(124, 58, 237, 0.2)",
            borderTopColor: "#7c3aed",
            borderRadius: "50%",
            margin: "0 auto 20px"
          }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading payment configuration...</p>
        </div>
      </div>,
      document.body
    );
  }

  if (configError) {
    return createPortal(
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px", textAlign: "center", padding: "36px 28px" }}>
          <button className="modal-close" onClick={onClose}><FiX /></button>
          <div style={{ color: "#ef4444", fontSize: "2.5rem", marginBottom: "16px" }}><FiAlertCircle /></div>
          <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>Configuration Error</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "24px" }}>{configError}</p>
          <button onClick={onClose} style={{
            padding: "10px 24px", borderRadius: "10px",
            background: "var(--primary-color, #7c3aed)", color: "#fff",
            border: "none", fontWeight: 600, cursor: "pointer"
          }}>Close</button>
        </div>
      </div>,
      document.body
    );
  }

  // STEP 0: Instructions — QR code + UPI details
  const renderInstructions = () => (
    <>
      <button className="modal-close" onClick={onClose}><FiX /></button>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "4px" }}>
          Pay via UPI 📱
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          {selectedPlan === "YEARLY" ? "Yearly Pro — ₹999" : "Monthly Pro — ₹149"}
        </p>
      </div>

      {/* QR Code */}
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        marginBottom: "20px"
      }}>
        <QRCodeSVG
          value={upiUri}
          size={180}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#1e1b4b"
        />
      </div>

      {/* UPI ID */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: "12px",
        background: "rgba(124, 58, 237, 0.08)",
        border: "1px solid rgba(124, 58, 237, 0.2)",
        marginBottom: "18px"
      }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
            UPI ID
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.3px" }}>
            {upiVpa}
          </div>
        </div>
        <button
          onClick={copyVpa}
          title="Copy UPI ID"
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background: copiedVpa ? "rgba(16, 185, 129, 0.15)" : "rgba(124, 58, 237, 0.15)",
            color: copiedVpa ? "#10b981" : "#a78bfa",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            fontWeight: 600,
            transition: "all 0.2s"
          }}
        >
          {copiedVpa ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "24px",
        padding: "0 4px"
      }}>
        {config?.instructions?.map((inst, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{
              minWidth: "22px", height: "22px",
              borderRadius: "50%",
              background: "rgba(124, 58, 237, 0.12)",
              color: "#a78bfa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 800,
              marginTop: "1px"
            }}>
              {i + 1}
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary, #cbd5e1)", lineHeight: "1.45", margin: 0 }}>
              {inst}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep(STEP.EVIDENCE)}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: "pointer",
          boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
          transition: "transform 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        I've Completed the Payment <FiChevronRight />
      </button>
    </>
  );

  // STEP 1: Evidence Collection
  const renderEvidence = () => (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button
          onClick={() => setStep(STEP.INSTRUCTIONS)}
          style={{
            width: "32px", height: "32px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, rgba(255,255,255,0.08))",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <FiArrowLeft />
        </button>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Submit Payment Proof</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: 0 }}>
            {selectedPlan === "YEARLY" ? "Yearly Pro — ₹999" : "Monthly Pro — ₹149"}
          </p>
        </div>
      </div>

      {/* UTR Field */}
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>UTR / Transaction Reference *</label>
        <input
          type="text"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="e.g. 423456789012"
          maxLength={30}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
          onBlur={(e) => e.target.style.borderColor = "var(--border-light, rgba(255,255,255,0.08))"}
        />
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Find this in your UPI app payment confirmation (12-digit reference number)
        </p>
      </div>

      {/* Payer UPI ID (optional) */}
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Your UPI ID (Optional)</label>
        <input
          type="text"
          value={payerUpiId}
          onChange={(e) => setPayerUpiId(e.target.value)}
          placeholder="e.g. yourname@upi"
          maxLength={100}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
          onBlur={(e) => e.target.style.borderColor = "var(--border-light, rgba(255,255,255,0.08))"}
        />
      </div>

      {/* Payment Date & Time (Required) */}
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Payment Date & Time *</label>
        <input
          type="datetime-local"
          value={paidAt}
          max={new Date().toISOString().slice(0, 16)}
          onChange={(e) => setPaidAt(e.target.value)}
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
          onBlur={(e) => e.target.style.borderColor = "var(--border-light, rgba(255,255,255,0.08))"}
        />
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Exact date & time when you transferred the funds in your UPI app
        </p>
      </div>

      {/* Screenshot Upload */}
      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Payment Screenshot *</label>
        {screenshotPreview ? (
          <div style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--border-light, rgba(255,255,255,0.08))",
            background: "rgba(255,255,255,0.02)"
          }}>
            <img
              src={screenshotPreview}
              alt="Receipt preview"
              style={{
                width: "100%",
                maxHeight: "200px",
                objectFit: "contain",
                display: "block",
                padding: "8px"
              }}
            />
            <button
              onClick={removeScreenshot}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                border: "none",
                background: "rgba(239, 68, 68, 0.9)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem"
              }}
            >
              <FiX />
            </button>
            <div style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--border-light, rgba(255,255,255,0.08))",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <FiImage /> {screenshot?.name} ({(screenshot?.size / 1024).toFixed(0)} KB)
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "32px 20px",
              borderRadius: "12px",
              border: "2px dashed var(--border-light, rgba(255,255,255,0.1))",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer",
              textAlign: "center",
              transition: "border-color 0.2s, background 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#7c3aed";
              e.currentTarget.style.background = "rgba(124, 58, 237, 0.04)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light, rgba(255,255,255,0.1))";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
          >
            <FiUpload style={{ fontSize: "1.5rem", color: "#a78bfa", marginBottom: "8px" }} />
            <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 4px 0" }}>
              Click to upload payment receipt
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
              JPEG, PNG, or WebP • Max 5 MB
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      {/* User Note (optional) */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Note (Optional)</label>
        <textarea
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="Any additional context for the payment team..."
          maxLength={500}
          rows={2}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: "60px",
            fontFamily: "inherit"
          }}
          onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
          onBlur={(e) => e.target.style.borderColor = "var(--border-light, rgba(255,255,255,0.08))"}
        />
      </div>

      {/* Error display */}
      {submitError && (
        <div style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#f87171",
          fontSize: "0.82rem",
          fontWeight: 500,
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <FiAlertCircle style={{ flexShrink: 0 }} /> {submitError}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: submitting
            ? "rgba(124, 58, 237, 0.4)"
            : "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: submitting ? "not-allowed" : "pointer",
          boxShadow: submitting ? "none" : "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
      >
        {submitting ? (
          <>
            <div className="animate-spin" style={{
              width: "18px", height: "18px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%"
            }} />
            Submitting...
          </>
        ) : (
          <>Submit for Verification <FiCheck /></>
        )}
      </button>
    </>
  );

  // STEP 3: Status / Confirmation
  const renderStatus = () => (
    <>
      <button className="modal-close" onClick={onClose}><FiX /></button>

      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div style={{
          width: "64px", height: "64px",
          borderRadius: "50%",
          background: "rgba(16, 185, 129, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          color: "#10b981",
          fontSize: "1.8rem"
        }}>
          <FiCheck />
        </div>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "6px" }}>
          Payment Submitted! 🎉
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
          Your payment is being verified by our team. You'll be notified once your Pro subscription is activated.
        </p>

        {/* Status card */}
        <div style={{
          padding: "18px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border-light, rgba(255,255,255,0.08))",
          textAlign: "left",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <FiClock style={{ color: "#f59e0b" }} />
            <span style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#f59e0b",
              background: "rgba(245, 158, 11, 0.1)",
              padding: "3px 10px",
              borderRadius: "6px"
            }}>
              UNDER REVIEW
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
                Plan
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                {submittedRequest?.plan === "YEARLY" ? "Yearly Pro" : "Monthly Pro"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
                Amount
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                ₹{submittedRequest?.amount ? (submittedRequest.amount / 100) : "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
                UTR Reference
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#a78bfa", fontFamily: "monospace" }}>
                {submittedRequest?.utr}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>
                Submitted At
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                {submittedRequest?.submittedAt
                  ? new Date(submittedRequest.submittedAt).toLocaleString()
                  : "Just now"}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)"
          }}
        >
          Done
        </button>

        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "12px" }}>
          Verification typically takes 1–24 hours during business days.
        </p>
      </div>
    </>
  );

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "480px",
          padding: "28px",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        {step === STEP.INSTRUCTIONS && renderInstructions()}
        {step === STEP.EVIDENCE && renderEvidence()}
        {step === STEP.STATUS && renderStatus()}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default UpiPaymentModal;
