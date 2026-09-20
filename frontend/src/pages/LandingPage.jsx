import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiGrid,
  FiTrendingUp,
  FiPieChart,
  FiUsers,
  FiCalendar,
  FiDownload,
  FiShield,
  FiLock,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiArrowRight,
  FiZap,
  FiDollarSign,
  FiCreditCard,
  FiSmartphone,
  FiMessageSquare,
  FiMenu,
  FiX
} from "react-icons/fi";

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? -1 : index);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // FAQ Data
  const faqs = [
    {
      q: "Is FinTrack free to use?",
      a: "Yes! The Free plan has no trial period or expiration. It includes unlimited expense and income tracking, unlimited custom categories, monthly budgeting, full dashboard analytics, and standard CSV statement exports."
    },
    {
      q: "Do I need to connect my bank account or share credentials?",
      a: "No. FinTrack is strictly privacy-focused. You do not need to link your bank account, share netbanking passwords, or provide debit/credit card numbers to track your finances."
    },
    {
      q: "How does the Manual UPI payment option work?",
      a: "When upgrading to Pro via UPI, you transfer the subscription amount directly to our official UPI ID / QR code using any UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.). After payment, you submit the 12-digit UTR reference number and a screenshot in the app. Our admin team verifies the transaction and activates your Pro subscription."
    },
    {
      q: "Can I communicate with the team regarding my UPI payment?",
      a: "Yes! FinTrack includes a dedicated Payment Support thread for every manual UPI payment request, allowing you to ask questions or provide additional clarifications directly to administrators."
    },
    {
      q: "What happens when my Pro subscription period ends?",
      a: "When your Pro subscription expires, your account automatically returns to the Free tier. All of your historical transactions, income logs, and budgets remain fully intact and accessible."
    },
    {
      q: "Can I track household expenses with my family?",
      a: "Yes! The Free plan allows you to add up to 2 family members to collaborate on household expenses, while the Pro plan unlocks unlimited family members."
    }
  ];

  return (
    <div style={{ background: "#11131f", color: "#ffffff", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* ========================================================================= */}
      {/* 1. PUBLIC NAVBAR */}
      {/* ========================================================================= */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(17, 19, 31, 0.85)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "all 0.3s ease"
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "#fff"
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)"
              }}
            >
              <FiTrendingUp />
            </div>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
              Fin<span style={{ color: "#a78bfa" }}>Track</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px"
            }}
            className="desktop-nav"
          >
            <button
              onClick={() => scrollToSection("features")}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("smart-insights")}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
            >
              Smart Insights
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("security")}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
            >
              FAQ
            </button>
          </nav>

          {/* Auth Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }} className="desktop-nav">
            <Link
              to="/sign-in"
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              Get Started <FiArrowRight />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
              display: "none"
            }}
          >
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: "#1a1d29",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <button
              onClick={() => scrollToSection("features")}
              style={{ background: "none", border: "none", color: "#94a3b8", textAlign: "left", fontSize: "1rem", fontWeight: 600 }}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("smart-insights")}
              style={{ background: "none", border: "none", color: "#94a3b8", textAlign: "left", fontSize: "1rem", fontWeight: 600 }}
            >
              Smart Insights
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              style={{ background: "none", border: "none", color: "#94a3b8", textAlign: "left", fontSize: "1rem", fontWeight: 600 }}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("security")}
              style={{ background: "none", border: "none", color: "#94a3b8", textAlign: "left", fontSize: "1rem", fontWeight: 600 }}
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              style={{ background: "none", border: "none", color: "#94a3b8", textAlign: "left", fontSize: "1rem", fontWeight: 600 }}
            >
              FAQ
            </button>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <Link
                to="/sign-in"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600
                }}
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#7c3aed",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "72px 24px 80px",
          maxWidth: "1240px",
          margin: "0 auto",
          textAlign: "center"
        }}
      >
        {/* Subtle Background Glow */}
        <div
          style={{
            position: "absolute",
            top: "0%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "350px",
            background: "radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(17, 19, 31, 0) 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>
          {/* Eyebrow Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(124, 58, 237, 0.12)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              color: "#c4b5fd",
              fontSize: "0.82rem",
              fontWeight: 600,
              marginBottom: "24px"
            }}
          >
            <FiZap style={{ color: "#a78bfa" }} /> Personal & Family Wealth Management
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: "-1px",
              marginBottom: "20px",
              color: "#ffffff"
            }}
          >
            Master Your Money with <br />
            <span
              style={{
                background: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #7c3aed 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Precision & Intelligence.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              color: "#94a3b8",
              lineHeight: 1.65,
              maxWidth: "680px",
              margin: "0 auto 36px"
            }}
          >
            Track income and expenses in real time, set intelligent category budgets, coordinate with family members, and understand your financial health with structured insights in one unified dashboard.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "48px"
            }}
          >
            <Link
              to="/sign-up"
              style={{
                padding: "14px 28px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "transform 0.2s ease"
              }}
            >
              Start Free <FiArrowRight />
            </Link>
            <button
              onClick={() => scrollToSection("pricing")}
              style={{
                padding: "14px 24px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              View Pricing
            </button>
          </div>

          {/* Trust Highlights */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
              flexWrap: "wrap",
              fontSize: "0.82rem",
              color: "#94a3b8",
              marginBottom: "48px"
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FiCheck style={{ color: "#10b981" }} /> Free Plan Forever
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FiCheck style={{ color: "#10b981" }} /> No Bank Linking Needed
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <FiCheck style={{ color: "#10b981" }} /> Authentication by Clerk
            </span>
          </div>
        </div>

        {/* Illustrative Dashboard Preview Card */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "980px",
            margin: "0 auto",
            borderRadius: "20px",
            background: "#1a1d29",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.15)",
            padding: "20px",
            overflow: "hidden"
          }}
        >
          {/* Mock Browser/Window Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "16px",
              marginBottom: "16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
            }}
          >
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase"
              }}
            >
              Illustrative Dashboard Preview
            </div>
            <div style={{ width: "40px" }} />
          </div>

          {/* Mock Layout Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
              marginBottom: "16px"
            }}
          >
            {/* Stat Card 1 */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Cashflow Overview</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981" }}>Income & Expense Tracking</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Real-time balance updates</div>
            </div>

            {/* Stat Card 2 */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Budget Progress</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#60a5fa" }}>Category Spending Caps</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Visual threshold tracking</div>
            </div>

            {/* Stat Card 3 */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.06)", textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "4px" }}>Smart Insights</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa" }}>Financial Health Score</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>Proactive spending alerts</div>
            </div>
          </div>

          {/* Mock Charts & Table Structure */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "14px",
              minHeight: "140px"
            }}
            className="mock-dashboard-body"
          >
            <div style={{ background: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <FiPieChart size={28} style={{ color: "#7c3aed" }} />
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Monthly Analytics & Trends Chart Area</span>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <FiUsers size={28} style={{ color: "#3b82f6" }} />
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Family Group Sharing</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CORE FEATURES GRID */}
      {/* ========================================================================= */}
      <section
        id="features"
        style={{
          padding: "80px 24px",
          maxWidth: "1240px",
          margin: "0 auto"
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 56px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, marginBottom: "16px" }}>
            Comprehensive Financial Tools
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6 }}>
            Everything you need to track daily spending, build sustainable budgeting habits, and manage household finances with zero friction.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
          }}
        >
          {/* Feature 1 */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiDollarSign />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Expense & Income Tracking</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Log transactions with custom categories, payment methods, and notes. Instantly see your updated balance and net savings.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiPieChart />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Monthly Budgeting</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Set category spending caps and overall monthly budgets. Real-time visual progress bars alert you before you overspend.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(124, 58, 237, 0.12)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiTrendingUp />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Visual Analytics & Trends</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Interactive charts provide annual cashflow trajectory and category breakdowns to uncover spending patterns over time.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(236, 72, 153, 0.12)", color: "#f472b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiUsers />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Family & Group Finance</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Collaborate on household spending. Track group contributions and shared budgets together in real time.
            </p>
          </div>

          {/* Feature 5 */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiCalendar />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Recurring Bill Tracking</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Track regular monthly commitments, utility payments, and subscriptions to avoid unexpected due-date surprises.
            </p>
          </div>

          {/* Feature 6 */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(168, 85, 247, 0.12)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiDownload />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Flexible Statement Exports</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Export your data to clean CSV format anytime, or generate structured Excel spreadsheets and executive PDF reports with Pro.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SMART FINANCIAL INSIGHTS */}
      {/* ========================================================================= */}
      <section
        id="smart-insights"
        style={{
          padding: "80px 24px",
          maxWidth: "1240px",
          margin: "0 auto",
          background: "linear-gradient(180deg, rgba(124, 58, 237, 0.04) 0%, rgba(17, 19, 31, 0) 100%)",
          borderRadius: "24px"
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "rgba(124, 58, 237, 0.15)", color: "#c4b5fd", fontSize: "0.8rem", fontWeight: 700, marginBottom: "14px" }}>
            <FiZap /> SMART DECISION SUPPORT
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, marginBottom: "16px" }}>
            Smart Financial Insights
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6 }}>
            Rule-based evaluations and proactive metrics designed to help you maintain financial discipline without manual spreadsheet calculations.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px"
          }}
        >
          {/* Card 1: Health Score */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(124, 58, 237, 0.2)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "1.4rem", color: "#a78bfa" }}><FiTrendingUp /></div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Financial Health Score</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Evaluates key indicators including your savings ratio, expense-to-income balance, and category budget discipline to score your financial status.
            </p>
          </div>

          {/* Card 2: Smart Alerts */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(124, 58, 237, 0.2)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "1.4rem", color: "#f59e0b" }}><FiShield /></div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Smart Spending Alerts</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Automatic notifications highlight when you approach or exceed 80% and 100% of category budget limits so you can adjust spending early.
            </p>
          </div>

          {/* Card 3: Actionable Guidance */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(124, 58, 237, 0.2)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "1.4rem", color: "#10b981" }}><FiPieChart /></div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Budget Guidance</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Clear breakdown of your top spending categories to identify where discretionary costs can be optimized to reach your savings goals.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRICING SECTION */}
      {/* ========================================================================= */}
      <section
        id="pricing"
        style={{
          padding: "80px 24px",
          maxWidth: "1240px",
          margin: "0 auto"
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 56px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, marginBottom: "16px" }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6 }}>
            Start with our full-featured Free tier, or upgrade to FinTrack Pro for advanced insights, reports, and unlimited collaboration.
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "28px",
            maxWidth: "1000px",
            margin: "0 auto 56px"
          }}
        >
          {/* Free Tier Card */}
          <div
            style={{
              background: "#1a1d29",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#94a3b8", marginBottom: "8px" }}>Free Plan</div>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>₹0</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "24px" }}>Free forever • No credit card required</div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Unlimited expenses & income
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Unlimited categories & budgets
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Dashboard charts & analytics
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Standard CSV statement export
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#94a3b8" }}>
                  <FiCheck style={{ color: "#94a3b8", flexShrink: 0 }} /> Up to 2 recurring bills
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#94a3b8" }}>
                  <FiCheck style={{ color: "#94a3b8", flexShrink: 0 }} /> Up to 2 family members
                </div>
              </div>
            </div>

            <Link
              to="/sign-up"
              style={{
                marginTop: "32px",
                padding: "12px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none"
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Monthly Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(26, 29, 41, 0.95) 100%)",
              borderRadius: "20px",
              border: "1px solid rgba(124, 58, 237, 0.4)",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}
          >
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa", marginBottom: "8px" }}>Pro Monthly</div>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
                ₹149<span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#94a3b8" }}> / month</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#a78bfa", marginBottom: "24px" }}>Full Pro capabilities billed monthly</div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(124, 58, 237, 0.2)", paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Everything in Free
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Financial Health Score
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Smart Spending Alerts
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Unlimited recurring bills
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Unlimited family members
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Excel (.xlsx) statement export
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Executive PDF financial reports
                </div>
              </div>
            </div>

            <Link
              to="/sign-up"
              style={{
                marginTop: "32px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)"
              }}
            >
              Choose Monthly
            </Link>
          </div>

          {/* Pro Yearly Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(26, 29, 41, 0.95) 100%)",
              borderRadius: "20px",
              border: "2px solid #7c3aed",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              boxShadow: "0 10px 30px rgba(124, 58, 237, 0.2)"
            }}
          >
            {/* Value Badge */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                right: "24px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.5px",
                textTransform: "uppercase"
              }}
            >
              Best Value • Save ~44%
            </div>

            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa", marginBottom: "8px" }}>Pro Yearly</div>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
                ₹999<span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#94a3b8" }}> / year</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 600, marginBottom: "24px" }}>
                Effective ₹83.25 / month (Billed annually)
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(124, 58, 237, 0.2)", paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Everything in Free
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Financial Health Score
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Smart Spending Alerts
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Unlimited recurring bills
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Unlimited family members
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Excel (.xlsx) statement export
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                  <FiCheck style={{ color: "#10b981", flexShrink: 0 }} /> Executive PDF financial reports
                </div>
              </div>
            </div>

            <Link
              to="/sign-up"
              style={{
                marginTop: "32px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                color: "#ffffff",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)"
              }}
            >
              Choose Yearly Plan
            </Link>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            background: "#1a1d29",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden"
          }}
        >
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", fontWeight: 700, fontSize: "1.1rem" }}>
            Feature Comparison Matrix
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", background: "rgba(255, 255, 255, 0.02)", color: "#94a3b8" }}>
                  <th style={{ padding: "14px 20px" }}>Capability</th>
                  <th style={{ padding: "14px 20px", textAlign: "center" }}>Free Plan</th>
                  <th style={{ padding: "14px 20px", textAlign: "center", color: "#a78bfa" }}>FinTrack Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Expense & Income Tracking</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981" }}>Unlimited</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Unlimited</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Budgets & Custom Categories</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981" }}>Unlimited</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Unlimited</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Dashboard Charts & Analytics</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981" }}>Full Access</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Full Access</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>CSV Statement Export</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981" }}>Unlimited</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Unlimited</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Recurring Bills</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#94a3b8" }}>Up to 2 bills</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Unlimited</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Family Group Members</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#94a3b8" }}>Up to 2 members</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Unlimited</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Financial Health Score</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#64748b" }}>—</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Included</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Smart Spending Alerts</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#64748b" }}>—</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Included</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Excel (.xlsx) Statement Export</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#64748b" }}>—</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Included</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>Executive PDF Financial Reports</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#64748b" }}>—</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#10b981", fontWeight: 700 }}>Included</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PAYMENT & UPGRADE EXPERIENCE */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1240px",
          margin: "0 auto",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.06)"
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 48px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, marginBottom: "16px" }}>
            Flexible & Transparent Payment Options
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6 }}>
            Upgrade to Pro seamlessly with your preferred payment method.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px"
          }}
        >
          {/* Channel 1: Dynamic UPI QR */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiZap />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Dynamic UPI QR</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Scan an automatically generated dynamic QR code with exact plan pricing (₹149/mo or ₹999/yr) from GPay, PhonePe, Paytm, or BHIM.
            </p>
          </div>

          {/* Channel 2: UTR & Admin Verification */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(124, 58, 237, 0.12)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiSmartphone />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Manual UTR & Receipt Review</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Submit your 12-digit transaction UTR reference and payment screenshot for swift administrative verification and Pro activation.
            </p>
          </div>

          {/* Channel 3: Payment Support */}
          <div style={{ background: "#1a1d29", padding: "32px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              <FiMessageSquare />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Payment Support Thread</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Dedicated support communication thread on every payment request to answer questions and clarify transaction details.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECURITY & PRIVACY */}
      {/* ========================================================================= */}
      <section
        id="security"
        style={{
          padding: "80px 24px",
          maxWidth: "1240px",
          margin: "0 auto"
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 48px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, marginBottom: "16px" }}>
            Privacy-First Architecture
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6 }}>
            Our security practices are grounded in actual implementation principles designed to keep your records private and protected.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px"
          }}
        >
          {/* Security Principle 1 */}
          <div style={{ background: "#1a1d29", padding: "28px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <FiLock size={24} style={{ color: "#10b981" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>No Bank Credentials Required</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              FinTrack operates without asking for bank account logins, debit cards, or netbanking credentials. You retain full control over your entries.
            </p>
          </div>

          {/* Security Principle 2 */}
          <div style={{ background: "#1a1d29", padding: "28px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <FiShield size={24} style={{ color: "#60a5fa" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Protected Backend Routes</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              All financial API endpoints are guarded by strict authentication middleware and user authorization checks.
            </p>
          </div>

          {/* Security Principle 3 */}
          <div style={{ background: "#1a1d29", padding: "28px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <FiGrid size={24} style={{ color: "#a78bfa" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>User-Owned Records</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              Strict database filtering guarantees that users can only view and manage their own financial logs and support threads.
            </p>
          </div>

          {/* Security Principle 4 */}
          <div style={{ background: "#1a1d29", padding: "28px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <FiCheck size={24} style={{ color: "#c084fc" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Private Attachments</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6 }}>
              Payment screenshots and support proofs are stored privately with authoritative server-side magic-byte inspection.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. INTERACTIVE FAQ */}
      {/* ========================================================================= */}
      <section
        id="faq"
        style={{
          padding: "80px 24px",
          maxWidth: "860px",
          margin: "0 auto"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, marginBottom: "16px" }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6 }}>
            Everything you need to know about FinTrack plans, features, and workflows.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "#1a1d29",
                  borderRadius: "14px",
                  border: `1px solid ${isOpen ? "rgba(124, 58, 237, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
                  overflow: "hidden",
                  transition: "all 0.2s ease"
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    padding: "20px 24px",
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    cursor: "pointer"
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: "#a78bfa", fontSize: "1.2rem", marginLeft: "16px" }}>
                    {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: "0 24px 20px",
                      color: "#94a3b8",
                      fontSize: "0.9rem",
                      lineHeight: 1.65,
                      borderTop: "1px solid rgba(255, 255, 255, 0.04)"
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FINAL CONVERSION CTA */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: "60px 24px 80px",
          maxWidth: "1240px",
          margin: "0 auto"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)",
            border: "1px solid rgba(124, 58, 237, 0.35)",
            borderRadius: "24px",
            padding: "56px 32px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)"
          }}
        >
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, marginBottom: "16px", color: "#fff" }}>
            Take Control of Your Personal Finances Today
          </h2>
          <p style={{ color: "#c4b5fd", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto 32px", lineHeight: 1.6 }}>
            Join FinTrack to organize your expenses, collaborate with your family, and build lasting financial habits.
          </p>
          <Link
            to="/sign-up"
            style={{
              padding: "16px 36px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 24px rgba(124, 58, 237, 0.5)"
            }}
          >
            Create Your Free Account <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PUBLIC FOOTER */}
      {/* ========================================================================= */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "#0d0f1a",
          padding: "48px 24px"
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "0.9rem"
              }}
            >
              <FiTrendingUp />
            </div>
            <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>FinTrack</span>
            <span style={{ color: "#64748b", fontSize: "0.85rem", marginLeft: "12px" }}>
              Personal & Family Wealth Management
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "0.85rem", color: "#94a3b8" }}>
            <Link to="/sign-in" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Sign In
            </Link>
            <Link to="/sign-up" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Get Started
            </Link>
            <a href="mailto:meet9atel@gmail.com" style={{ color: "#94a3b8", textDecoration: "none" }}>
              meet9atel@gmail.com
            </a>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1240px",
            margin: "24px auto 0",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.04)",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "#64748b"
          }}
        >
          © {new Date().getFullYear()} FinTrack. All rights reserved.
        </div>
      </footer>

      {/* Scoped CSS for Mobile Nav and Body adjustments */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: block !important;
          }
          .mock-dashboard-body {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
