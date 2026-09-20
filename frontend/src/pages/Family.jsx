import React, { useEffect, useState } from "react";
import API from "../utils/api";
import FamilyCard from "../components/FamilyCard";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { FiUsers, FiUserPlus, FiCopy, FiLock, FiStar, FiCheck } from "react-icons/fi";
import { usePro } from "../context/ProContext";
import toast from "react-hot-toast";

function Family() {
  const { isPro } = usePro();
  const [familyData, setFamilyData] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchFamily();
  }, []);

  const fetchFamily = async () => {
    try {
      const res = await API.get("/family/stats");
      setFamilyData(res.data);
    } catch (err) {
      console.error("Fetch family error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error("Please enter a family name");
      return;
    }
    try {
      await API.post("/family/create", { name: familyName.trim() });
      toast.success("Family group created!");
      setFamilyName("");
      fetchFamily();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create family");
    }
  };

  const joinFamily = async (e) => {
    e.preventDefault();
    if (!familyId.trim()) {
      toast.error("Please enter a family ID");
      return;
    }
    try {
      await API.post("/family/join", { familyId: familyId.trim() });
      toast.success("Joined family workspace!");
      setFamilyId("");
      fetchFamily();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join family");
    }
  };

  const copyFamilyId = () => {
    if (familyData?.familyId) {
      navigator.clipboard.writeText(familyData.familyId);
      setCopied(true);
      toast.success("Family ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '8px' }}>
        <div className="skeleton-card" style={{ minHeight: '260px' }}>
          <div className="skeleton skeleton-line title"></div>
          <div className="skeleton skeleton-line full"></div>
          <div className="skeleton skeleton-line medium"></div>
        </div>
      </div>
    );
  }

  // Has family
  if (familyData?.hasFamily) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <PageHeader 
          title={familyData.familyName || "Family Workspace"} 
          subtitle="Collaborative household budgeting & member spending distribution"
        >
          <span className="badge badge-neutral">
            <FiUsers size={13} /> {familyData.members?.length || 0} Members
          </span>

          {familyData.familyId && (
            <button 
              type="button"
              className="btn-secondary" 
              onClick={copyFamilyId} 
              style={{ fontSize: "0.85rem" }}
            >
              {copied ? <FiCheck size={14} style={{ color: 'var(--accent-green)' }} /> : <FiCopy size={14} />}
              <span>{copied ? "ID Copied" : "Copy Family ID"}</span>
            </button>
          )}
        </PageHeader>

        <div className="page-grid reverse">
          {/* Members List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Member Limit Alert for Free Users */}
            {!isPro && (familyData.members?.length || 0) >= 2 && (
              <div className="card" style={{ 
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', 
                border: '1px solid rgba(124, 58, 237, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                flexWrap: 'wrap'
              }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-accent)', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  <FiLock />
                </div>
                <div style={{ flex: '1 1 240px' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '2px', fontSize: '0.95rem', color: '#fff' }}>Free Tier Limit: 2 Members</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Free accounts support up to 2 family members. Upgrade to <strong>Pro</strong> to add unlimited family members and track real-time shared expenses.
                  </p>
                </div>
                <button 
                  type="button"
                  className="upgrade-btn-small" 
                  onClick={() => window.location.href='/profile'}
                >
                  <FiStar size={13} /> Unlock Pro
                </button>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Family Members</h3>
                  <p className="card-subtitle">
                    Combined monthly expenditure: ₹{(familyData.totalFamilyExpense || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {familyData.members && familyData.members.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {familyData.members.map((m, i) => (
                    <FamilyCard key={i} data={m} index={i} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FiUsers size={24} />}
                  title="No member activity"
                  description="No member expense data recorded for this month."
                />
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title">Workspace Details</h3>
                <p className="card-subtitle">Share identifier with household members</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Group Name</span>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{familyData.familyName}</span>
              </div>
              
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                  Unique Family ID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{
                    flex: 1,
                    background: "#0a0c14",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    color: "#c4b5fd",
                    border: '1px solid rgba(255,255,255,0.06)',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}>
                    {familyData.familyId}
                  </code>
                  <button 
                    type="button"
                    className="btn-icon" 
                    onClick={copyFamilyId}
                    title="Copy ID"
                    aria-label="Copy Family ID"
                  >
                    {copied ? <FiCheck size={14} style={{ color: 'var(--accent-green)' }} /> : <FiCopy size={14} />}
                  </button>
                </div>
              </div>
              
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: 'center', lineHeight: 1.45 }}>
                Family members can join this workspace by pasting the unique Family ID in their FinTrack account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No family yet
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader 
        title="Family Workspace" 
        subtitle="Manage shared household expenses, budgets, and track member contributions"
      />

      <div className="page-grid">
        {/* Create Family */}
        <div className="card form-card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 className="card-title">Create Family Group</h3>
              <p className="card-subtitle">Set up a new shared household budget</p>
            </div>
          </div>

          <form onSubmit={createFamily}>
            <div className="form-group">
              <label className="form-label">Family Workspace Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. The Sharma Family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              <FiUsers size={16} />
              <span>Create Family Group</span>
            </button>
          </form>
        </div>

        {/* Join Family */}
        <div className="card form-card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 className="card-title">Join Existing Family</h3>
              <p className="card-subtitle">Connect to your household using an invitation ID</p>
            </div>
          </div>

          <form onSubmit={joinFamily}>
            <div className="form-group">
              <label className="form-label">Family ID Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="Paste Family ID shared by a member"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ width: '100%', marginTop: '8px' }}>
              <FiUserPlus size={16} />
              <span>Join Workspace</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Family;