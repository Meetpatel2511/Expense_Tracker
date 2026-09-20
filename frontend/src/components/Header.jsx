import React from "react";
import { useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { FiMenu } from "react-icons/fi";
import NotificationBell from "./NotificationBell";

const pageData = {
  "/": { title: "Financial Overview", subtitle: "Real-time summary of your balances and cash flow" },
  "/dashboard": { title: "Financial Overview", subtitle: "Real-time summary of your balances and cash flow" },
  "/expenses": { title: "Expense Tracking", subtitle: "Log expenditures and automate recurring bills" },
  "/income": { title: "Income Streams", subtitle: "Manage salary, dividends, and recurring deposits" },
  "/budget": { title: "Budget Planning", subtitle: "Set category limits and track spending progress" },
  "/family": { title: "Family Workspace", subtitle: "Shared household budget & member activity" },
  "/profile": { title: "Account & Subscription", subtitle: "Manage your profile, security, and Pro tier" },
  "/help": { title: "Help & Support", subtitle: "Knowledge base, guides, and customer assistance" }
};

function Header({ toggleSidebar }) {
  const location = useLocation();
  const current = Object.keys(pageData).find(path => 
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
  );
  const page = pageData[current] || { title: "Dashboard", subtitle: "Personal financial management" };

  return (
    <header className="header">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button 
          className="header-icon-btn mobile-only" 
          onClick={toggleSidebar}
          aria-label="Open Navigation Menu"
          style={{ display: 'none' }}
        >
          <FiMenu size={20} />
        </button>
        <div>
          <h1 className="header-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>
            {page.title}
          </h1>
          <p className="header-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
            {page.subtitle}
          </p>
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <NotificationBell />
        <div className="header-profile" style={{ flexShrink: 0 }}>
          <UserButton 
            afterSignOutUrl="/sign-in" 
            userButtonPopoverPlacement="bottom-end"
            appearance={{ 
              elements: { 
                userButtonAvatarBox: { width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--border-color)' } 
              } 
            }} 
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: flex !important; }
          .header-subtitle { display: none; }
          .header-title { font-size: 1.15rem !important; }
        }
      `}</style>
    </header>
  );
}

export default Header;