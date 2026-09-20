import React, { useState, useEffect } from "react";
import API from "../utils/api";
import { FiTrendingUp, FiZap, FiTarget, FiLock, FiLoader } from "react-icons/fi";

function HealthScoreCard({ isPro }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScore = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/user/health-score");
      setData(res.data);
    } catch (err) {
      console.error("Health score fetch error:", err);
      setError("Financial health analysis unavailable for current data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPro && !data && !loading && !error) {
      fetchScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  if (!isPro) {
    return (
      <div className="card" style={{ height: '100%', position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'rgba(14, 17, 26, 0.85)', 
          backdropFilter: 'blur(6px)', 
          zIndex: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center', 
          padding: '24px' 
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--bg-accent-soft)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c4b5fd',
            marginBottom: '14px'
          }}>
            <FiLock size={22} />
          </div>
          <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: '6px' }}>
            Financial Health Score
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '240px', lineHeight: 1.45, marginBottom: '16px' }}>
            Upgrade to Pro to unlock your holistic financial health score & recommendations.
          </p>
          <button className="upgrade-btn-small" onClick={() => window.location.href='/profile'}>
            Unlock Pro
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px' }}></div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calculating financial health score...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px', gap: '12px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error || "Add more transactions to generate a health score"}</div>
        <button onClick={fetchScore} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          Refresh Score
        </button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--accent-green)";
    if (score >= 60) return "var(--accent-warning)";
    return "var(--accent-danger)";
  };

  const scoreColor = getScoreColor(data.score);

  return (
    <div className="card animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-header" style={{ marginBottom: '8px' }}>
        <div>
          <h3 className="card-title">Financial Health Score</h3>
          <p className="card-subtitle">Algorithmic savings & expense ratio analysis</p>
        </div>
        <span className="badge badge-pro">
          {data.status || "Evaluated"}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
        <div style={{ 
          width: '110px', 
          height: '110px', 
          borderRadius: '50%', 
          border: `6px solid rgba(255,255,255,0.06)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: `0 0 24px ${scoreColor}25`
        }}>
          <div style={{ 
            position: 'absolute', 
            inset: '-6px', 
            borderRadius: '50%', 
            border: `6px solid ${scoreColor}`,
            clipPath: `inset(0 0 ${100 - Math.min(100, Math.max(0, data.score))}% 0)`,
            transition: 'all 1s ease-out'
          }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{data.score}</span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>/ 100</div>
          </div>
        </div>
      </div>

      {data.tips && data.tips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiZap /> Key Recommendations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.tips.map((tip, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ color: '#a78bfa', marginTop: '2px', fontSize: '0.8rem' }}>•</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthScoreCard;
