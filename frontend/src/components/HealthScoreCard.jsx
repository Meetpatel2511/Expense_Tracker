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
      setError("AI analysis unavailable for current data.");
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
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
             <FiLock size={32} style={{ color: 'var(--bg-accent)', marginBottom: '16px' }} />
             <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>AI Health Score</h4>
             <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '16px' }}>Unlock deep AI analysis of your saving & spending habits.</p>
             <button className="upgrade-btn-small" onClick={() => window.location.href='/profile'}>Upgrade to Pro</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
         <FiLoader size={32} className="animate-spin" style={{ color: 'var(--bg-accent)' }} />
         <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI is calculating your health score...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px', gap: '12px' }}>
         <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error || "Add more data to generate a score"}</div>
         <button onClick={fetchScore} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-light)', fontSize: '0.8rem', cursor: 'pointer' }}>
            Try Again
         </button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--accent-green)";
    if (score >= 60) return "var(--accent-warning)";
    return "var(--accent-danger)";
  };

  return (
    <div className="card animate-fade" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Health Score</h3>
        <span className="badge" style={{ color: 'var(--bg-accent)', borderColor: 'var(--bg-accent)', background: 'rgba(124, 58, 237, 0.1)' }}>
           {data.status}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '10px 0' }}>
         {/* Circular representation */}
         <div style={{ 
           width: '120px', 
           height: '120px', 
           borderRadius: '50%', 
           border: `8px solid rgba(255,255,255,0.05)`,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           position: 'relative'
         }}>
            <div style={{ 
               position: 'absolute', 
               inset: '-8px', 
               borderRadius: '50%', 
               border: `8px solid ${getScoreColor(data.score)}`,
               clipPath: `inset(0 0 ${100 - data.score}% 0)`,
               transition: 'all 1s ease-out'
            }} />
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(data.score) }}>{data.score}</span>
         </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <FiZap /> Actionable Insights
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.tips.map((tip, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
               <div style={{ color: 'var(--bg-accent)', marginTop: '2px' }}>•</div>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HealthScoreCard;
