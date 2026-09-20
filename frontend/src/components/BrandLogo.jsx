import React from "react";
import { Link } from "react-router-dom";

/**
 * Official FinTrack Brand Logo Component
 * 
 * Variants:
 * - "navbar" (default): 34px icon + styled FinTrack wordmark for headers and sidebars.
 * - "icon" / "compact": Icon mark only (for collapsed sidebars, badges, mobile buttons).
 * - "full": Prominent icon mark + FinTrack wordmark + optional tagline.
 * - "hero": Larger branded presentation for Auth pages and Landing sections.
 */
export default function BrandLogo({
  variant = "navbar",
  size = "md",
  to,
  showTagline = false,
  className = "",
  style = {},
  iconOnly = false,
  subtitle
}) {
  // Preset dimension mappings
  const sizeMap = {
    sm: { icon: 28, text: "1.15rem", sub: "0.7rem", gap: "8px" },
    md: { icon: 34, text: "1.32rem", sub: "0.75rem", gap: "10px" },
    lg: { icon: 44, text: "1.6rem", sub: "0.85rem", gap: "12px" },
    xl: { icon: 56, text: "2.0rem", sub: "0.95rem", gap: "14px" },
  };

  const actualSize = typeof size === "number" 
    ? { icon: size, text: `${Math.max(1, size * 0.04)}rem`, sub: "0.75rem", gap: "10px" } 
    : (sizeMap[size] || sizeMap.md);

  const isIconOnly = iconOnly || variant === "icon" || variant === "compact";
  const isHero = variant === "hero";
  const isFull = variant === "full" || isHero;
  const displayTagline = showTagline || isFull;

  // Render the icon mark SVG natively for instant load and sharp rendering at any scale
  const renderIcon = () => (
    <div
      style={{
        width: `${actualSize.icon}px`,
        height: `${actualSize.icon}px`,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "28%",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)",
        transition: "transform 0.2s ease",
      }}
      className="fintrack-logo-icon"
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brandBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="50%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="brandWallet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e1065" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="brandFlap" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#5b21b6" />
          </linearGradient>
          <linearGradient id="brandLeaf1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <linearGradient id="brandLeaf2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </linearGradient>
        </defs>

        {/* Squircle Base */}
        <rect x="6" y="6" width="108" height="108" rx="28" fill="url(#brandBg)" />
        <rect x="6" y="6" width="108" height="108" rx="28" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="2.5" />

        {/* Receipt / Invoice Top */}
        <g>
          <rect x="36" y="18" width="48" height="38" rx="8" fill="#ffffff" />
          <line x1="46" y1="28" x2="74" y2="28" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="46" y1="36" x2="66" y2="36" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Wallet Body */}
        <rect x="18" y="38" width="84" height="60" rx="16" fill="url(#brandWallet)" stroke="rgba(167, 139, 250, 0.35)" strokeWidth="1.5" />

        {/* Wallet Flap with Clasp */}
        <path d="M 72 50 L 98 50 C 103 50, 106 53, 106 58 L 106 66 C 106 71, 103 74, 98 74 L 72 74 Z" fill="url(#brandFlap)" stroke="rgba(216, 180, 254, 0.4)" strokeWidth="1.2" />
        <circle cx="94" cy="62" r="5" fill="#f8fafc" stroke="#c084fc" strokeWidth="1.5" />
        <circle cx="94" cy="62" r="2.2" fill="#9333ea" />

        {/* White Indian Rupee Symbol (₹) */}
        <g fill="#ffffff">
          <rect x="38" y="52" width="22" height="3.2" rx="1.5" />
          <rect x="38" y="59" width="22" height="3.2" rx="1.5" />
          <path d="M 44 52 L 44 69 C 50 69, 54 67, 54 60.5 C 54 54, 49 52, 44 52 Z" stroke="#ffffff" strokeWidth="3.2" strokeLinejoin="round" fill="none" />
          <path d="M 44 67 L 57 84" stroke="#ffffff" strokeWidth="3.6" strokeLinecap="round" />
        </g>

        {/* Growth Leaves */}
        <path d="M 68 84 C 68 70, 78 62, 88 64 C 88 74, 82 84, 68 84 Z" fill="url(#brandLeaf1)" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1" />
        <path d="M 82 86 C 82 72, 94 62, 104 64 C 104 76, 96 86, 82 86 Z" fill="url(#brandLeaf2)" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1" />
      </svg>
    </div>
  );

  const renderContent = () => (
    <div
      className={`fintrack-brand-logo ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: actualSize.gap,
        textDecoration: "none",
        color: "inherit",
        userSelect: "none",
        ...style
      }}
      aria-label="FinTrack"
    >
      {renderIcon()}

      {!isIconOnly && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: actualSize.text,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#ffffff",
              display: "flex",
              alignItems: "center"
            }}
          >
            Fin
            <span
              style={{
                background: "linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginLeft: "1px"
              }}
            >
              Track
            </span>
          </span>

          {(displayTagline || subtitle) && (
            <span
              style={{
                fontSize: actualSize.sub,
                color: "var(--text-secondary, #94a3b8)",
                fontWeight: 500,
                marginTop: "2px",
                letterSpacing: "0.2px"
              }}
            >
              {subtitle || "Track Today · Build a Better Tomorrow"}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none", display: "inline-flex" }}>
        {renderContent()}
      </Link>
    );
  }

  return renderContent();
}
