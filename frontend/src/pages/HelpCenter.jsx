import React from "react";
import { FiMail, FiPhone, FiCheckCircle, FiShield, FiZap, FiBarChart2 } from "react-icons/fi";

function HelpCenter() {
  const benefits = [
    {
      icon: <FiZap />,
      title: "Real-time Tracking",
      description: "Get instant updates on your spending habits as they happen, helping you stay within your budget."
    },
    {
      icon: <FiShield />,
      title: "Secure & Private",
      description: "Your financial data is encrypted and stored securely. We prioritize your privacy above all else."
    },
    {
      icon: <FiBarChart2 />,
      title: "Advanced Analytics",
      description: "Visualize your income vs expenses with annual trend analysis and deep-dive category breakdowns."
    },
    {
      icon: <FiCheckCircle />,
      title: "Smart Budgeting",
      description: "Set monthly limits and receive intelligent alerts when you're close to exceeding your targets."
    }
  ];

  return (
    <div className="animate-fade">
      {/* Responsive two-column layout — becomes single column on tablet/mobile */}
      <div className="help-layout">

        {/* Left: Product About */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          <div className="card">
            <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, marginBottom: '16px' }}>About FinTrack</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
              FinTrack is a premium financial management suite designed for individuals and families who want to take full control of their wealth. 
              Our platform combines powerful tracking tools with intuitive visualizations to make financial literacy accessible to everyone.
            </p>
          </div>

          {/* Benefits Grid — 2 cols on desktop, 1 col on small phones */}
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'rgba(124, 58, 237, 0.1)', 
                  color: 'var(--bg-accent)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  {benefit.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{benefit.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Support Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>Support Center</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Need help or have a feature request? Our support team is here to help you get the most out of FinTrack.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '16px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-light)',
                flexWrap: 'wrap'
              }}>
                <div style={{ color: '#a78bfa', fontSize: '1.2rem', flexShrink: 0 }}><FiMail /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Support</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, wordBreak: 'break-all' }}>meet9atel@gmail.com</div>
                </div>
              </div>

              {/* Phone */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '16px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-light)',
                flexWrap: 'wrap'
              }}>
                <div style={{ color: '#3b82f6', fontSize: '1.2rem', flexShrink: 0 }}><FiPhone /></div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Direct Call</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>+91 70415 49115</div>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '28px', 
              padding: '14px 16px', 
              borderRadius: '12px', 
              background: 'rgba(16, 185, 129, 0.05)', 
              border: '1px solid rgba(16, 185, 129, 0.1)', 
              display: 'flex', 
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{ color: '#10b981', paddingTop: '2px', flexShrink: 0 }}><FiCheckCircle /></div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Our average response time for email queries is under 24 hours.
              </p>
            </div>
          </div>

          {/* Version Badge */}
          <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Version 2.4.0 (Stable)</h4>
            <div style={{ width: '40px', height: '4px', background: 'var(--bg-accent)', borderRadius: '2px', margin: '0 auto' }}></div>
          </div>
        </div>
      </div>

      <style>{`
        .help-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: clamp(16px, 3vw, 32px);
          width: 100%;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        /* Tablet: stack into single column */
        @media (max-width: 1024px) {
          .help-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Mobile: benefits stack to 1 column */
        @media (max-width: 600px) {
          .benefits-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default HelpCenter;
