import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  FiMail,
  FiStar,
  FiTrendingUp,
  FiCreditCard,
  FiDollarSign,
  FiShield,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiClock
} from "react-icons/fi";
import API from "../utils/api";
import { usePro } from "../context/ProContext";
import UpgradeModal from "../components/UpgradeModal";

function Profile() {
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const { isPro: contextIsPro, refreshProStatus } = usePro();
  const [profile, setProfile] = useState(null);
  const [activePaymentRequest, setActivePaymentRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const [profileRes, requestsRes] = await Promise.all([
        API.get("/user/profile"),
        API.get("/payment-request/my-requests").catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      const active = (requestsRes.data || []).find(
        (r) => r.status === "UNDER_REVIEW" || r.status === "NEEDS_MORE_INFO"
      );
      setActivePaymentRequest(active || null);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpgrade = async (paymentData) => {
    if (!paymentData) return;
    try {
      const res = await API.post("/user/upgrade-pro", paymentData);
      if (res.data.isPro) {
        await refreshProStatus();
        await fetchProfile();
        setShowUpgradeModal(false);
        alert("🎉 Subscription activated successfully! Welcome to FinTrack Pro.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Upgrade failed. Please try again.");
      console.error("Upgrade error:", err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-content animate-fade" style={{ paddingTop: '8px' }}>
        <div className="skeleton-card" style={{ height: '300px', marginBottom: '24px' }}>
          <div className="skeleton skeleton-line title"></div>
          <div className="skeleton skeleton-line full"></div>
          <div className="skeleton skeleton-line medium"></div>
        </div>
      </div>
    );
  }

  // Derive subscription display states
  const isProActive = Boolean(profile?.isPro ?? contextIsPro);
  const isExpired = !isProActive && Boolean(profile?.proExpiresAt);
  const planLabel = profile?.plan === "YEARLY"
    ? "Yearly Pro"
    : profile?.plan === "MONTHLY"
      ? "Monthly Pro"
      : isProActive
        ? "Pro Member (Lifetime)"
        : "Free Plan";

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="dashboard-content animate-fade pb-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="welcome-section" style={{ marginBottom: '8px' }}>
        <h2 className="welcome-title">Account Settings</h2>
        <p className="welcome-date">Manage your personal information and subscription level.</p>
      </div>

      <div className="responsive-flex" style={{ gap: '24px' }}>
        {/* Profile Card */}
        <div className="card" style={{ flex: 1.2, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '2px solid var(--bg-accent-soft)',
                boxShadow: '0 8px 30px rgba(124, 58, 237, 0.2)'
              }}>
                <img src={clerkUser?.imageUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{profile?.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: isProActive ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' : isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: isExpired ? '#ef4444' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isProActive ? <><FiStar /> {planLabel}</> : isExpired ? <><FiAlertCircle /> Expired</> : "Free Member"}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    Joined {new Date(profile?.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                gap: '16px',
                width: '100%'
            }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '8px' }}>
                  <FiMail /> PRIMARY EMAIL
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{profile?.email}</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '8px' }}>
                  <FiShield /> SECURITY STATUS
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-green)' }}>Active & Secure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card" style={{ flex: 0.8, minWidth: 0, width: '100%' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiTrendingUp style={{ color: 'var(--bg-accent)' }} /> All-Time Stats
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)' }}>
              <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                <FiDollarSign /> Total Income
              </div>
              <div style={{ fontWeight: 700 }}>₹{profile?.stats?.totalIncome.toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)' }}>
              <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                <FiCreditCard /> Total Expense
              </div>
              <div style={{ fontWeight: 700 }}>₹{profile?.stats?.totalExpense.toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', borderTop: '1px dashed var(--border-light)', marginTop: '4px' }}>
              <div style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
                Net Balance
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: (profile?.stats?.savings >= 0 ? '#10b981' : '#ef4444') }}>
                ₹{profile?.stats?.savings.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Manual Payment Status Banner */}
      {activePaymentRequest && (
        <div className="card" style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(239, 68, 68, 0.06)',
          border: `1px solid ${activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: activePaymentRequest.status === 'UNDER_REVIEW' ? '#f59e0b' : '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0
            }}>
              <FiClock />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                {activePaymentRequest.status === 'UNDER_REVIEW'
                  ? "Payment submitted — we're reviewing your payment."
                  : "We need some additional information to verify your payment."}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Plan: <strong style={{ color: '#fff' }}>{activePaymentRequest.plan === 'YEARLY' ? 'Yearly Pro' : 'Monthly Pro'}</strong> • UTR: <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{activePaymentRequest.utr}</span>
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700,
            padding: '6px 12px', borderRadius: '8px',
            background: activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: activePaymentRequest.status === 'UNDER_REVIEW' ? '#f59e0b' : '#ef4444',
            border: `1px solid ${activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {activePaymentRequest.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : 'NEEDS INFO'}
          </span>
        </div>
      )}

      {/* Subscription Status Section */}
      <div className="card" style={{ padding: '28px', border: isProActive ? '1px solid rgba(124, 58, 237, 0.3)' : isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isProActive ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isProActive ? '#fff' : 'var(--text-muted)'
              }}>
                <FiStar size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Subscription & Plan</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage your tier and billing intervals
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: isProActive
                ? 'rgba(16, 185, 129, 0.12)'
                : isExpired
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(255, 255, 255, 0.05)',
              color: isProActive ? '#10b981' : isExpired ? '#ef4444' : 'var(--text-secondary)',
              border: `1px solid ${isProActive ? 'rgba(16, 185, 129, 0.3)' : isExpired ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-light)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {isProActive ? <><FiCheckCircle /> Active Pro</> : isExpired ? <><FiAlertCircle /> Expired</> : "Free Tier"}
            </span>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary gradient-purple"
              style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              {isProActive ? "Extend / Switch Plan" : isExpired ? "Renew Pro Subscription" : "Upgrade to Pro"}
            </button>
          </div>
        </div>

        {/* Plan Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              CURRENT PLAN
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              {planLabel}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              {isProActive ? "BILLING PERIOD" : isExpired ? "EXPIRATION DATE" : "TIER ENTITLEMENT"}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isExpired ? '#ef4444' : 'var(--text-secondary)' }}>
              {isProActive && profile?.proExpiresAt ? (
                `${formatDate(profile?.proStartsAt || profile?.proSince)} → ${formatDate(profile?.proExpiresAt)}`
              ) : isProActive ? (
                "Lifetime Active Access"
              ) : isExpired ? (
                `Expired on ${formatDate(profile?.proExpiresAt)}`
              ) : (
                "Standard Free Limits"
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              ENTITLEMENTS
            </div>
            <div style={{ fontSize: '0.85rem', color: isProActive ? '#10b981' : 'var(--text-muted)' }}>
              {isProActive
                ? "Unlimited Bills, Family, AI Health Score & PDF Reports"
                : isExpired
                  ? "Data preserved. Upgrade to regain Pro insights & unlimited limits."
                  : "Max 2 recurring bills, Max 2 family members, CSV export"}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-accent)', marginBottom: '8px' }}>
          <FiShield size={28} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Security & Identity Settings</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
            Manage your password, connected social accounts, and login methods through our secure identity portal.
          </p>
        </div>
        <button
          onClick={() => openUserProfile()}
          className="btn-primary gradient-purple"
          style={{ width: 'auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          Manage Security Settings <FiExternalLink />
        </button>
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
}

export default Profile;
