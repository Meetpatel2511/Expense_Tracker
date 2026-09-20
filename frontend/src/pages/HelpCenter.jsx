import React, { useState } from "react";
import { FiMail, FiPhone, FiShield, FiZap, FiBarChart2, FiTarget, FiHelpCircle, FiChevronDown, FiChevronUp, FiCopy, FiCheck } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import toast from "react-hot-toast";

function HelpCenter() {
  const [openFaq, setOpenFaq] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const benefits = [
    {
      icon: <FiZap />,
      title: "Real-time Expense Logging",
      description: "Log daily expenses and income streams instantaneously to keep cash flow numbers current."
    },
    {
      icon: <FiShield />,
      title: "Encrypted & Confidential",
      description: "Financial records are encrypted and tied strictly to your authenticated session. No third-party bank linking required."
    },
    {
      icon: <FiBarChart2 />,
      title: "Analytics & Trends",
      description: "Visualize cash flow trajectories, annual income vs expense trends, and deep-dive category breakdowns."
    },
    {
      icon: <FiTarget />,
      title: "Proactive Budgeting",
      description: "Set category spending limits and receive smart alerts when approaching your configured caps."
    }
  ];

  const faqs = [
    {
      q: "What is included in the Free tier vs FinTrack Pro?",
      a: "The Free plan includes unlimited expenses, unlimited income, custom categories, monthly budgeting, dashboard analytics, and CSV exports (with up to 2 recurring bills and 2 family members). FinTrack Pro unlocks the Financial Health Score, Smart Alerts, unlimited recurring bills, unlimited family workspace members, and PDF & Excel exports."
    },
    {
      q: "How does the manual UPI transfer verification work?",
      a: "When upgrading via UPI, you scan the official QR code or copy the UPI ID, complete the payment in your UPI app, and submit your 12-digit UTR reference number and payment screenshot. Our administrative team reviews the transaction and activates Pro access upon confirmation."
    },
    {
      q: "Where can I check the status of my payment verification?",
      a: "Navigate to Account & Subscription (Profile). If you have an active manual payment request, its review status and support messaging thread are displayed prominently at the top of the page."
    },
    {
      q: "How do I invite members to my family workspace?",
      a: "Create a family group on the Family page to generate a unique Family ID code. Share this ID code with your family members so they can enter it on their FinTrack accounts and join your shared household workspace."
    }
  ];

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      toast.success("Email copied to clipboard!");
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      toast.success("Phone number copied to clipboard!");
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader 
        title="Help & Support Center" 
        subtitle="Guides, frequently asked questions, and direct support communication channels"
      />

      {/* Two-column layout */}
      <div className="help-layout">
        {/* Left Column: Platform Features & FAQs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          <div className="card">
            <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              About FinTrack
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.9rem' }}>
              FinTrack is a privacy-first personal and family financial management platform designed to help users gain clear visibility into their wealth, budget accurately, and track expenditures without exposing bank netbanking credentials.
            </p>
          </div>

          {/* Core Feature Capabilities */}
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'var(--bg-accent-soft)', 
                  color: '#c4b5fd', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  flexShrink: 0
                }}>
                  {benefit.icon}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{benefit.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title">Frequently Asked Questions</h3>
                <p className="card-subtitle">Common questions regarding features, plans, and verification</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-light)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{faq.q}</span>
                      <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
                        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 14px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Contact Channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)' }}>
            <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Direct Support Channels</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Have questions about your account, payment verification, or feature suggestions? Get in touch with our team.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Email Contact Card */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '14px 16px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#c4b5fd', fontSize: '1.2rem', flexShrink: 0 }}><FiMail /></div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Inquiries</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>meet9atel@gmail.com</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-icon" 
                  onClick={() => copyToClipboard("meet9atel@gmail.com", "email")}
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copiedEmail ? <FiCheck size={14} style={{ color: 'var(--accent-green)' }} /> : <FiCopy size={14} />}
                </button>
              </div>

              {/* Phone Contact Card */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '14px 16px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: 'var(--accent-blue)', fontSize: '1.2rem', flexShrink: 0 }}><FiPhone /></div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Direct Telephone</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>+91 70415 49115</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-icon" 
                  onClick={() => copyToClipboard("+917041549115", "phone")}
                  title="Copy telephone number"
                  aria-label="Copy telephone number"
                >
                  {copiedPhone ? <FiCheck size={14} style={{ color: 'var(--accent-green)' }} /> : <FiCopy size={14} />}
                </button>
              </div>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '12px 14px', 
              borderRadius: '10px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid var(--border-light)', 
              display: 'flex', 
              gap: '10px',
              alignItems: 'center'
            }}>
              <div style={{ color: 'var(--accent-green)', display: 'flex', flexShrink: 0 }}><FiShield size={16} /></div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                For pending manual UPI verifications, you can communicate directly with reviewers via the Payment Support thread on your Profile page.
              </p>
            </div>
          </div>

          {/* Version Card */}
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FinTrack Application</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Version 2.4.0 (Stable Production Release)</div>
          </div>
        </div>
      </div>

      <style>{`
        .help-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: clamp(16px, 2.5vw, 28px);
          width: 100%;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .help-layout {
            grid-template-columns: 1fr;
          }
        }

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
