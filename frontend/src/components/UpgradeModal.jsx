import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiStar, FiZap, FiPieChart, FiUsers, FiDownload, FiCreditCard, FiSmartphone } from "react-icons/fi";
import RazorpayCheckout from "./RazorpayCheckout";
import UpiPaymentModal from "./UpiPaymentModal";

function UpgradeModal({ onClose, onUpgrade }) {
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUpiFlow, setShowUpiFlow] = useState(false);

  const features = [
    { icon: <FiZap />, text: "Financial Health Score & Smart Alerts" },
    { icon: <FiUsers />, text: "Unlimited family group members & recurring bills" },
    { icon: <FiDownload />, text: "Executive Financial PDF & Excel statement exports" },
    { icon: <FiPieChart />, text: "Advanced analytics, trends & category breakdown" }
  ];

  const handleContinue = () => {
    if (paymentMethod === "RAZORPAY") {
      setShowCheckout(true);
    } else if (paymentMethod === "UPI_MANUAL") {
      setShowUpiFlow(true);
    }
  };

  if (showUpiFlow) {
    return (
      <UpiPaymentModal
        selectedPlan={selectedPlan}
        onClose={onClose}
        onSubmitted={() => {}}
      />
    );
  }

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", padding: "28px" }}>
        {showCheckout ? (
          <RazorpayCheckout
            selectedPlan={selectedPlan}
            totalAmount={selectedPlan === "YEARLY" ? 999 : 149}
            onCancel={() => setShowCheckout(false)}
            onSuccess={(paymentData) => {
              onUpgrade(paymentData);
              onClose();
            }}
          />
        ) : (
          <>
            <button className="modal-close" onClick={onClose} aria-label="Close Upgrade Modal">
              <FiX />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 12px',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)'
              }}>
                <FiStar />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Upgrade to FinTrack Pro</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Experience the full power of automated insights and exports</p>
            </div>

            {/* Plan Selector Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {/* Monthly Card */}
              <div
                onClick={() => setSelectedPlan("MONTHLY")}
                style={{
                  position: 'relative',
                  padding: '14px',
                  borderRadius: '14px',
                  background: selectedPlan === "MONTHLY" ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${selectedPlan === "MONTHLY" ? '#7c3aed' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedPlan === "MONTHLY" ? '#c4b5fd' : 'var(--text-muted)' }}>
                    MONTHLY
                  </span>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedPlan === "MONTHLY" ? '#7c3aed' : 'var(--border-color)'}`,
                    background: selectedPlan === "MONTHLY" ? '#7c3aed' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPlan === "MONTHLY" && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                  ₹149<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Standard monthly billing
                </div>
              </div>

              {/* Yearly Card */}
              <div
                onClick={() => setSelectedPlan("YEARLY")}
                style={{
                  position: 'relative',
                  padding: '14px',
                  borderRadius: '14px',
                  background: selectedPlan === "YEARLY" ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${selectedPlan === "YEARLY" ? '#7c3aed' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-9px',
                  right: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  letterSpacing: '0.3px'
                }}>
                  SAVE 44%
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedPlan === "YEARLY" ? '#c4b5fd' : 'var(--text-muted)' }}>
                    YEARLY
                  </span>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedPlan === "YEARLY" ? '#7c3aed' : 'var(--border-color)'}`,
                    background: selectedPlan === "YEARLY" ? '#7c3aed' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPlan === "YEARLY" && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                  ₹999<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/yr</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  Best Value — ₹83/mo
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '0 4px' }}>
              {features.map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: 'var(--accent-green)', fontSize: '1rem', display: 'flex', flexShrink: 0 }}>
                    <FiCheck />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#c4b5fd', fontSize: '0.95rem', flexShrink: 0 }}>{feature.icon}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{feature.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                Select Payment Channel
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Instant Checkout (Razorpay) */}
                <div
                  onClick={() => setPaymentMethod("RAZORPAY")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: `2px solid ${paymentMethod === "RAZORPAY" ? '#7c3aed' : 'var(--border-color)'}`,
                    background: paymentMethod === "RAZORPAY" ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                    flexShrink: 0
                  }}>
                    <FiCreditCard size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '1px' }}>
                      Instant Gateway Checkout
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Debit/Credit Card, Net Banking & Instant UPI via Razorpay
                    </div>
                  </div>
                  <div style={{
                    width: '16px', height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === "RAZORPAY" ? '#7c3aed' : 'var(--border-color)'}`,
                    background: paymentMethod === "RAZORPAY" ? '#7c3aed' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {paymentMethod === "RAZORPAY" && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>

                {/* Manual UPI */}
                <div
                  onClick={() => setPaymentMethod("UPI_MANUAL")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: `2px solid ${paymentMethod === "UPI_MANUAL" ? '#7c3aed' : 'var(--border-color)'}`,
                    background: paymentMethod === "UPI_MANUAL" ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    flexShrink: 0
                  }}>
                    <FiSmartphone size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '1px' }}>
                      Direct UPI Transfer
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Scan QR code / transfer via GPay, PhonePe, Paytm with manual UTR review
                    </div>
                  </div>
                  <div style={{
                    width: '16px', height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === "UPI_MANUAL" ? '#7c3aed' : 'var(--border-color)'}`,
                    background: paymentMethod === "UPI_MANUAL" ? '#7c3aed' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {paymentMethod === "UPI_MANUAL" && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!paymentMethod}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                opacity: paymentMethod ? 1 : 0.5,
                cursor: paymentMethod ? 'pointer' : 'not-allowed'
              }}
            >
              Continue with {selectedPlan === "YEARLY" ? "Yearly Pro (₹999)" : "Monthly Pro (₹149)"}
            </button>

            <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Encrypted transaction processing. Non-destructive tier expiration.
            </p>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default UpgradeModal;
