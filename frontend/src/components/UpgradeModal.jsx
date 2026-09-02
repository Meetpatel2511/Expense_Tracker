import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheck, FiStar, FiZap, FiPieChart, FiUsers, FiDownload } from "react-icons/fi";
import RazorpayCheckout from "./RazorpayCheckout";

function UpgradeModal({ onClose, onUpgrade }) {
  const [showCheckout, setShowCheckout] = useState(false);

  const features = [
    { icon: <FiPieChart />, text: "Advanced analytics & trends" },
    { icon: <FiZap />, text: "AI-powered financial insights" },
    { icon: <FiUsers />, text: "Unlimited family group tracking" },
    { icon: <FiDownload />, text: "Export custom PDF/CSV reports" }
  ];

  const modalJSX = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {showCheckout ? (
          <RazorpayCheckout 
            totalAmount={199}
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

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '2rem',
                margin: '0 auto 20px',
                boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)'
              }}>
                <FiStar />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Upgrade to Pro 💎</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Experience the full power of FinTrack</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {features.map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ color: '#10b981', fontSize: '1.2rem', display: 'flex' }}>
                    <FiCheck />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#a78bfa', fontSize: '1.1rem' }}>{feature.icon}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{feature.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px', 
              marginBottom: '32px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Free Plan</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹0</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Pro Plan</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>₹199<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
              </div>
            </div>

            <button 
              onClick={() => setShowCheckout(true)}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '14px', 
                border: 'none', 
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)',
                transition: 'var(--transition)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Upgrade Now
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Secure payment simulated. Cancel anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default UpgradeModal;
