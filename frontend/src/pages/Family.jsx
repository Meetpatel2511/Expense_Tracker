import React, { useEffect, useState } from "react";
import API from "../utils/api";
import FamilyCard from "../components/FamilyCard";
import { FiUsers, FiUserPlus, FiCopy, FiLock, FiStar } from "react-icons/fi";
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
      toast.success("Family created!");
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
      toast.success("Joined family!");
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Has family
  if (familyData?.hasFamily) {
    return (
      <div className="animate-fade">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px", gap: "8px" }}>
          <span className="badge">
            <FiUsers style={{ marginRight: 6 }} />
            {familyData.members?.length || 0} members
          </span>

          {familyData.familyId && (
            <button className="btn-secondary" onClick={copyFamilyId} style={{ fontSize: "0.8rem" }}>
              <FiCopy size={14} />
              {copied ? "Copied!" : "Copy ID"}
            </button>
          )}
        </div>

        <div className="page-grid reverse">
        {/* Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Member Limit Alert for Free Users */}
          {!isPro && (familyData.members?.length || 0) >= 2 && (
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', 
              border: '1px solid rgba(124, 58, 237, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(16px, 3vw, 24px)',
              padding: 'clamp(16px, 4vw, 24px)',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '12px', 
                background: 'var(--bg-accent)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.1rem',
                flexShrink: 0
              }}>
                <FiLock />
              </div>
              <div style={{ flex: '1 1 250px' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1rem' }}>Family Member Limit</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Free accounts are limited to 2 family members. Upgrade to **Pro** to add unlimited members and track their expenses in real-time.
                </p>
              </div>
              <div className="mobile-hide-tag" style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiStar /> Pro Feature
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Members</div>
                <div className="card-subtitle">
                  Total: ₹{(familyData.totalFamilyExpense || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {familyData.members && familyData.members.length > 0 ? (
              familyData.members.map((m, i) => (
                <FamilyCard key={i} data={m} index={i} />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-text">No expense data yet</div>
              </div>
            )}
          </div>
        </div>

          {/* Info card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Family Info</div>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ color: 'var(--bg-accent)', fontWeight: 700 }}>Name:</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{familyData.familyName}</div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ color: 'var(--bg-accent)', fontWeight: 700, marginBottom: '8px' }}>Family ID:</div>
                <code style={{
                  display: 'block',
                  background: "#0f172a",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: "#e2e8f0",
                  border: '1px solid rgba(255,255,255,0.05)',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {familyData.familyId}
                </code>
              </div>
              
              <p style={{ marginTop: 20, color: "var(--text-muted)", fontSize: "0.8rem", textAlign: 'center' }}>
                Share this ID with members to track expenses together.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No family
  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '24px' }}></div>

      <div className="page-grid">
        {/* Create Family */}
        <div className="card form-card">
          <div className="card-header">
            <div className="card-title">
              <FiUsers style={{ marginRight: 8, verticalAlign: "middle" }} />
              Create Family
            </div>
          </div>

          <form onSubmit={createFamily}>
            <div className="form-group">
              <label className="form-label">Family Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., The Sharma Family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">
              Create Family
            </button>
          </form>
        </div>

        {/* Join Family */}
        <div className="card form-card">
          <div className="card-header">
            <div className="card-title">
              <FiUserPlus style={{ marginRight: 8, verticalAlign: "middle" }} />
              Join Existing Family
            </div>
          </div>

          <form onSubmit={joinFamily}>
            <div className="form-group">
              <label className="form-label">Family ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter family ID from a member"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">
              <FiUserPlus size={16} />
              Join Family
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Family;