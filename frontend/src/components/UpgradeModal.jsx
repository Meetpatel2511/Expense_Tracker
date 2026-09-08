import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiStar, FiZap, FiPieChart, FiUsers, FiDownload, FiCreditCard, FiSmartphone } from "react-icons/fi";
import RazorpayCheckout from "./RazorpayCheckout";
import UpiPaymentModal from "./UpiPaymentModal";

function UpgradeModal({ onClose, onUpgrade }) {
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState(null); // null = selection screen, "RAZORPAY" or "UPI_MANUAL"
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

  // If UPI flow is active, render UpiPaymentModal instead
  if (showUpiFlow) {
    return (
      <UpiPaymentModal
        selectedPlan={selectedPlan}
        onClose={onClose}
        onSubmitted={() => {
          // Payment request submitted successfully — user will be notified on activation
        }}
      />
    );
  }

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", padding: "32px" }}>
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
            <button className="modal-close" onClick={onClose}>
              <FiX />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                margin: '0 auto 16px',
                boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)'
              }}>
                <FiStar />
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '6px' }}>Upgrade to Pro 💎</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Experience the full power and intelligence of FinTrack</p>
            </div>

            {/* Plan Selector */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '24px'
            }}>
              {/* Monthly Card */}
              <div
                onClick={() => setSelectedPlan("MONTHLY")}
                style={{
                  position: 'relative',
                  padding: '16px',
                  borderRadius: '14px',
                  background: selectedPlan === "MONTHLY" ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${selectedPlan === "MONTHLY" ? '#7c3aed' : 'var(--border-light, rgba(255, 255, 255, 0.08))'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedPlan === "MONTHLY" ? '#a78bfa' : 'var(--text-secondary)' }}>
                    MONTHLY
                  </span>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedPlan === "MONTHLY" ? '#7c3aed' : 'var(--border-light)'}`,
                    background: selectedPlan === "MONTHLY" ? '#7c3aed' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPlan === "MONTHLY" && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                  ₹149<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/month</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Billed every 30 days
                </div>
              </div>

              {/* Yearly Card */}
              <div
                onClick={() => setSelectedPlan("YEARLY")}
                style={{
                  position: 'relative',
                  padding: '16px',
                  borderRadius: '14px',
                  background: selectedPlan === "YEARLY" ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${selectedPlan === "YEARLY" ? '#7c3aed' : 'var(--border-light, rgba(255, 255, 255, 0.08))'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  letterSpacing: '0.3px'
                }}>
                  SAVE 44%
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedPlan === "YEARLY" ? '#a78bfa' : 'var(--text-secondary)' }}>
                    YEARLY
                  </span>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedPlan === "YEARLY" ? '#7c3aed' : 'var(--border-light)'}`,
                    background: selectedPlan === "YEARLY" ? '#7c3aed' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedPlan === "YEARLY" && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                  ₹999<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/year</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  Best Value — Save 44%
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '0 4px' }}>
              {features.map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#10b981', fontSize: '1.1rem', display: 'flex', flexShrink: 0 }}>
                    <FiCheck />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#a78bfa', fontSize: '1rem', flexShrink: 0 }}>{feature.icon}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary, #cbd5e1)' }}>{feature.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Choose Payment Method
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Instant Checkout (Razorpay) */}
                <div
                  onClick={() => setPaymentMethod("RAZORPAY")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${paymentMethod === "RAZORPAY" ? '#7c3aed' : 'var(--border-light, rgba(255,255,255,0.08))'}`,
                    background: paymentMethod === "RAZORPAY" ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                    flexShrink: 0
                  }}>
                    <FiCreditCard size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                      Instant Checkout
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Card, UPI, Net Banking via Razorpay
                    </div>
                  </div>
                  <div style={{
                    width: '18px', height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === "RAZORPAY" ? '#7c3aed' : 'var(--border-light, rgba(255,255,255,0.15))'}`,
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
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${paymentMethod === "UPI_MANUAL" ? '#7c3aed' : 'var(--border-light, rgba(255,255,255,0.08))'}`,
                    background: paymentMethod === "UPI_MANUAL" ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    flexShrink: 0
                  }}>
                    <FiSmartphone size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                      Pay via UPI Transfer
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      GPay, PhonePe, Paytm — manual verification
                    </div>
                  </div>
                  <div style={{
                    width: '18px', height: '18px',
                    borderRadius: '50%',
                    border: `2px solid ${paymentMethod === "UPI_MANUAL" ? '#7c3aed' : 'var(--border-light, rgba(255,255,255,0.15))'}`,
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
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: 'none',
                background: paymentMethod
                  ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)'
                  : 'rgba(124, 58, 237, 0.3)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: paymentMethod ? 'pointer' : 'not-allowed',
                boxShadow: paymentMethod ? '0 10px 25px -5px rgba(124, 58, 237, 0.4)' : 'none',
                transition: 'var(--transition)',
                opacity: paymentMethod ? 1 : 0.6
              }}
              onMouseOver={(e) => paymentMethod && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => paymentMethod && (e.target.style.transform = 'translateY(0)')}
            >
              Continue with {selectedPlan === "YEARLY" ? "Yearly Pro (₹999)" : "Monthly Pro (₹149)"}
            </button>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Secure server-verified checkout. Non-destructive expiration.
            </p>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default UpgradeModal;

