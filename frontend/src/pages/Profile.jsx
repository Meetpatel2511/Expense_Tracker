import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { FiUser, FiMail, FiStar, FiTrendingUp, FiCreditCard, FiDollarSign, FiShield, FiExternalLink } from "react-icons/fi";
import API from "../utils/api";

function Profile() {
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/user/profile");
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
                    background: profile?.isPro ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {profile?.isPro ? <><FiStar /> Pro Member</> : "Regular Member"}
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
    </div>
  );
}

export default Profile;
