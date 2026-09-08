import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { useUser } from "@clerk/clerk-react";
import API from "../utils/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function RazorpayCheckout({ selectedPlan = "MONTHLY", totalAmount = 149, onCancel, onSuccess }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initiateCheckout = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Load the official Razorpay Checkout SDK
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error("Unable to load Razorpay SDK. Please check your internet connection.");
        }

        // 2. Create Razorpay Test Order via Backend API with server-authoritative plan
        const orderRes = await API.post("/user/create-order", {
          plan: selectedPlan
        });
        const { orderId, amount, currency, keyId } = orderRes.data;

        if (!isMounted) return;

        // 3. Configure Razorpay Test Checkout options using authoritative backend response
        const options = {
          key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_key",
          amount: amount || totalAmount * 100,
          currency: currency || "INR",
          name: "FinTrack",
          description: `Upgrade to ${selectedPlan === "YEARLY" ? "Yearly Pro" : "Monthly Pro"} (Test Mode)`,
          order_id: orderId,
          handler: function (response) {
            // Forward genuine Razorpay checkout identifiers to caller
            if (isMounted) {
              onSuccess({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
            }
          },
          modal: {
            ondismiss: function () {
              if (isMounted) {
                onCancel();
              }
            }
          },
          prefill: {
            name: user?.fullName || user?.firstName || "",
            email: user?.primaryEmailAddress?.emailAddress || ""
          },
          theme: {
            color: "#7c3aed"
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on("payment.failed", function (response) {
          console.error("Razorpay Test Payment Failed:", response.error);
          if (isMounted) {
            setError(response.error?.description || "Payment failed. Please try again.");
            setLoading(false);
          }
        });

        razorpayInstance.open();
        setLoading(false);

      } catch (err) {
        console.error("Razorpay Checkout Initialization Error:", err);
        if (isMounted) {
          setError(err.message || "Failed to initialize payment.");
          setLoading(false);
        }
      }
    };

    initiateCheckout();

    return () => {
      isMounted = false;
    };
  }, [selectedPlan, totalAmount, onCancel, onSuccess, user]);

  if (!loading && !error) {
    return null;
  }

  const modalJSX = (
    <div className="modal-overlay" style={{ zIndex: 100000 }}>
      <div className="modal-content" style={{ maxWidth: "400px", textAlign: "center", padding: "32px" }}>
        <button className="modal-close" onClick={onCancel} style={{ top: "16px", right: "16px" }}>
          <FiX />
        </button>

        {loading && (
          <div>
            <div
              className="animate-spin"
              style={{
                width: "44px",
                height: "44px",
                border: "4px solid rgba(124, 58, 237, 0.2)",
                borderTopColor: "#7c3aed",
                borderRadius: "50%",
                margin: "0 auto 20px"
              }}
            ></div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>Opening Razorpay Checkout...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Initializing secure test payment window</p>
          </div>
        )}

        {error && (
          <div>
            <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "16px" }}>
              <FiAlertCircle />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>Checkout Error</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>{error}</p>
            <button
              onClick={onCancel}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                background: "var(--primary-color, #7c3aed)",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}

export default RazorpayCheckout;
