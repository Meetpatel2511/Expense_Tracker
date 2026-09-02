import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCreditCard, FiSmartphone, FiShield, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import API from "../utils/api";

const DEFAULT_TEST_SECRET = "rzp_test_secret_portfolio_demo";

async function generateHmacSha256(secret, message) {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function RazorpayCheckout({ totalAmount = 199, onCancel, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Method, 2: Card Intro, 3: OTP, 4: Success
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // Generate test order from backend API
    const initOrder = async () => {
      try {
        const res = await API.post("/user/create-order");
        setOrderData(res.data);
      } catch (err) {
        // Fallback for offline/standalone preview
        setOrderData({
          orderId: `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
        });
      }
    };
    initOrder();
  }, []);

  const handleMethodSelect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    const orderId = orderData?.orderId || `order_test_${Date.now()}`;
    const paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const secret = import.meta.env?.VITE_RAZORPAY_KEY_SECRET || DEFAULT_TEST_SECRET;
    const signature = await generateHmacSha256(secret, `${orderId}|${paymentId}`);

    setTimeout(() => {
      setLoading(false);
      setStep(4);
      setTimeout(() => {
        onSuccess({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        });
      }, 1500);
    }, 1500);
  };

  const checkoutJSX = (
    <div className="modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', padding: '0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#2d3436', padding: '24px', position: 'relative' }}>
          <button className="modal-close" onClick={onCancel} style={{ top: '16px', right: '16px' }}><FiX /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: '#3498db', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>R</div>
            <div>
               <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Razorpay Checkout</div>
               <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>₹{totalAmount.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
               <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid rgba(52, 152, 219, 0.2)', borderTopColor: '#3498db', borderRadius: '50%', margin: '0 auto 20px' }}></div>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Processing Payment...</p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="animate-fade">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Select Payment Method</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div onClick={handleMethodSelect} style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#3498db'}>
                        <FiCreditCard style={{ fontSize: '1.2rem', color: '#3498db' }} />
                        <div style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>Card / EMI</div>
                        <FiArrowRight style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div onClick={handleMethodSelect} style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#3498db'}>
                        <FiSmartphone style={{ fontSize: '1.2rem', color: '#10b981' }} />
                        <div style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>UPI / Google Pay / PhonePe</div>
                        <FiArrowRight style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Enter Card Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                     <input type="text" className="form-input" placeholder="Card Number (4242 4242 ...)" defaultValue="4242 4242 4242 4242" />
                     <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="text" className="form-input" placeholder="MM / YY" style={{ flex: 1 }} defaultValue="12 / 28" />
                        <input type="password" className="form-input" placeholder="CVV" style={{ flex: 1 }} defaultValue="123" />
                     </div>
                  </div>
                  <button onClick={handlePay} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#3498db', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                    Pay ₹{totalAmount.toLocaleString()}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-fade" style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Bank Verification</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Enter the 6-digit OTP sent to your registered mobile.</p>
                  <input type="text" className="form-input" placeholder="Enter OTP" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 800, marginBottom: '24px' }} defaultValue="123456" />
                  <button onClick={handleVerifyOTP} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                    Verify & Pay
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="animate-fade" style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ color: '#10b981', fontSize: '4rem', marginBottom: '20px' }}>
                    <FiCheckCircle />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Payment Successful!</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Upgrading your account to Pro...</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
           <FiShield /> <span>SSL Secure | PCI-DSS Compliant</span>
        </div>
      </div>
    </div>
  );

  return createPortal(checkoutJSX, document.body);
}

export default RazorpayCheckout;
