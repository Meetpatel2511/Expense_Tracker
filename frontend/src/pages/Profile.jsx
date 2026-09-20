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
  FiClock,
  FiMessageSquare,
  FiChevronRight
} from "react-icons/fi";
import API from "../utils/api";
import { usePro } from "../context/ProContext";
import PageHeader from "../components/PageHeader";
import UpgradeModal from "../components/UpgradeModal";
import PaymentSupportModal from "../components/PaymentSupportModal";

function Profile() {
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const { isPro: contextIsPro, refreshProStatus } = usePro();
  const [profile, setProfile] = useState(null);
  const [allPaymentRequests, setAllPaymentRequests] = useState([]);
  const [activePaymentRequest, setActivePaymentRequest] = useState(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [activeSupportRequest, setActiveSupportRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const [profileRes, requestsRes, unreadRes] = await Promise.all([
        API.get("/user/profile"),
        API.get("/payment-request/my-requests").catch(() => ({ data: [] })),
        API.get("/payment-request/support/unread-summary").catch(() => ({ data: { unreadCount: 0 } }))
      ]);
      setProfile(profileRes.data);
      const reqList = requestsRes.data || [];
      setAllPaymentRequests(reqList);
      const active = reqList.find(
        (r) => r.status === "UNDER_REVIEW" || r.status === "NEEDS_MORE_INFO"
      );
      setActivePaymentRequest(active || null);
      setUnreadSupportCount(unreadRes.data?.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
        <div className="skeleton-card" style={{ height: '240px' }}>
          <div className="skeleton skeleton-line title"></div>
          <div className="skeleton skeleton-line full"></div>
          <div className="skeleton skeleton-line medium"></div>
        </div>
      </div>
    );
  }

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
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader 
        title="Account & Subscription" 
        subtitle="Manage your personal profile, security settings, and Pro subscription level"
      />

      <div className="responsive-flex">
        {/* Profile Card */}
        <div className="card" style={{ flex: 1.2, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '2px solid var(--border-accent)',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)',
                flexShrink: 0
              }}>
                <img src={clerkUser?.imageUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  {profile?.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge ${isProActive ? "badge-pro" : isExpired ? "badge-danger" : "badge-neutral"}`}>
                    {isProActive ? <><FiStar /> {planLabel}</> : isExpired ? <><FiAlertCircle /> Expired</> : "Free Member"}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Member since {new Date(profile?.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '12px',
              width: '100%'
            }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  <FiMail /> Primary Email
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>
                  {profile?.email}
                </div>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  <FiShield /> Security Status
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-green)' }}>
                  Active & Authenticated
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All-Time Stats Card */}
        <div className="card" style={{ flex: 0.8, minWidth: 0, width: '100%' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 className="card-title">All-Time Totals</h3>
              <p className="card-subtitle">Lifetime financial volume</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                <FiDollarSign /> Total Income
              </div>
              <div style={{ fontWeight: 800, color: '#fff' }}>₹{Number(profile?.stats?.totalIncome || 0).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <div style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                <FiCreditCard /> Total Expense
              </div>
              <div style={{ fontWeight: 800, color: '#fff' }}>₹{Number(profile?.stats?.totalExpense || 0).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <div style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                <FiTrendingUp /> Net Balance
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: (profile?.stats?.savings >= 0 ? 'var(--accent-green)' : 'var(--accent-danger)') }}>
                ₹{Number(profile?.stats?.savings || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Manual Payment Status Banner */}
      {activePaymentRequest && (
        <div className="card" style={{
          padding: '18px 20px',
          background: activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(239, 68, 68, 0.06)',
          border: `1px solid ${activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: activePaymentRequest.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: activePaymentRequest.status === 'UNDER_REVIEW' ? 'var(--accent-warning)' : 'var(--accent-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
            }}>
              <FiClock />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                {activePaymentRequest.status === 'UNDER_REVIEW'
                  ? "Manual payment submitted — verification under review."
                  : "Additional information needed to verify your manual payment."}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Plan: <strong style={{ color: '#fff' }}>{activePaymentRequest.plan === 'YEARLY' ? 'Yearly Pro' : 'Monthly Pro'}</strong> • UTR: <span style={{ fontFamily: 'monospace', color: '#c4b5fd' }}>{activePaymentRequest.utr}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className={`badge ${activePaymentRequest.status === 'UNDER_REVIEW' ? 'badge-warning' : 'badge-danger'}`}>
              {activePaymentRequest.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : 'NEEDS INFO'}
            </span>

            <button
              type="button"
              onClick={() => setActiveSupportRequest(activePaymentRequest)}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <FiMessageSquare size={14} /> 
              <span>Payment Support</span>
              {unreadSupportCount > 0 && (
                <span className="badge badge-danger" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                  {unreadSupportCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Subscription Status Section */}
      <div className="card" style={{ border: isProActive ? '1px solid var(--border-accent)' : isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3 className="card-title">Subscription & Entitlements</h3>
            <p className="card-subtitle">Manage membership level and plan intervals</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className={`badge ${isProActive ? 'badge-success' : isExpired ? 'badge-danger' : 'badge-neutral'}`}>
              {isProActive ? <><FiCheckCircle /> Active Pro</> : isExpired ? <><FiAlertCircle /> Expired</> : "Free Tier"}
            </span>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary"
              style={{ width: 'auto', padding: '9px 18px', fontSize: '0.85rem' }}
            >
              {isProActive ? "Extend / Switch Plan" : isExpired ? "Renew Pro Subscription" : "Upgrade to Pro"}
            </button>
          </div>
        </div>

        {/* Plan Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '18px',
          borderRadius: '12px',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Current Plan
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              {planLabel}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {isProActive ? "Validity Period" : isExpired ? "Expiration Date" : "Tier Status"}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isExpired ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
              {isProActive && profile?.proExpiresAt ? (
                `${formatDate(profile?.proStartsAt || profile?.proSince)} → ${formatDate(profile?.proExpiresAt)}`
              ) : isProActive ? (
                "Lifetime Active Access"
              ) : isExpired ? (
                `Expired on ${formatDate(profile?.proExpiresAt)}`
              ) : (
                "Standard Free Tier"
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Entitlements
            </div>
            <div style={{ fontSize: '0.82rem', color: isProActive ? 'var(--accent-green)' : 'var(--text-muted)', lineHeight: 1.4 }}>
              {isProActive
                ? "Unlimited Bills & Family, Health Score, Smart Alerts, PDF Reports"
                : isExpired
                  ? "Data preserved. Upgrade to regain Pro insights and unlimited limits."
                  : "Max 2 recurring bills, Max 2 family members, CSV exports"}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Requests & Support History */}
      {allPaymentRequests.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 className="card-title">Payment History ({allPaymentRequests.length})</h3>
              <p className="card-subtitle">Recent manual transfer requests and verification status</p>
            </div>
            {unreadSupportCount > 0 && (
              <span className="badge badge-danger">
                {unreadSupportCount} unread message{unreadSupportCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allPaymentRequests.map((pr) => {
              const statusVariant = pr.status === 'APPROVED'
                ? 'success'
                : pr.status === 'UNDER_REVIEW'
                ? 'warning'
                : pr.status === 'NEEDS_MORE_INFO'
                ? 'pro'
                : 'danger';

              return (
                <div
                  key={pr._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                        {pr.plan === 'YEARLY' ? 'Yearly Pro' : 'Monthly Pro'} (₹{pr.amount / 100})
                      </span>
                      <span className={`badge badge-${statusVariant}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        {pr.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      UTR: <span style={{ fontFamily: 'monospace', color: '#c4b5fd' }}>{pr.utr}</span> • Submitted {new Date(pr.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSupportRequest(pr)}
                    className="btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                  >
                    <FiMessageSquare size={13} />
                    <span>Support Thread</span>
                    <FiChevronRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security & Identity Card */}
      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '32px 24px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'var(--bg-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd' }}>
          <FiShield size={26} />
        </div>
        <div>
          <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Security & Identity Credentials</h3>
          <p className="card-subtitle" style={{ maxWidth: '480px', margin: '0 auto' }}>
            Manage your password, connected authentication methods, and active sessions through Clerk.
          </p>
        </div>
        <button
          onClick={() => openUserProfile()}
          className="btn-secondary"
          style={{ width: 'auto', padding: '10px 24px' }}
        >
          <span>Manage Security Settings</span>
          <FiExternalLink size={14} />
        </button>
      </div>

      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* Payment Support Thread Modal */}
      {activeSupportRequest && (
        <PaymentSupportModal
          requestId={activeSupportRequest._id}
          paymentRequest={activeSupportRequest}
          onClose={() => {
            setActiveSupportRequest(null);
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}

export default Profile;
