import { useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { FiMenu } from "react-icons/fi";
import NotificationBell from "./NotificationBell";

const pageData = {
  "/": { title: "Financial Overview", subtitle: "Your wealth at a glance" },
  "/expenses": { title: "Add Expense", subtitle: "Track your spending" },
  "/income": { title: "Add Income", subtitle: "Manage earnings" },
  "/budget": { title: "Budget", subtitle: "Set monthly limits" },
  "/family": { title: "Family", subtitle: "Shared expenses" },
  "/suggestions": { title: "AI Insights", subtitle: "Smart suggestions" },
  "/help": { title: "Help Center", subtitle: "Get support" }
};

function Header({ toggleSidebar }) {
  const location = useLocation();
  const current = Object.keys(pageData).find(path => 
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)
  );
  const page = pageData[current] || pageData["/"];

  return (
    <header className="header">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="header-icon-btn mobile-only" 
          onClick={toggleSidebar}
          style={{ display: 'none' }} // Hidden by default, shown via media query in index.css
        >
          <FiMenu size={24} />
        </button>
        <div>
          <h1 className="header-title" style={{ fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{page.title}</h1>
          <p className="header-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{page.subtitle}</p>
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <NotificationBell />
        <div className="header-profile" style={{ flexShrink: 0, marginRight: '16px' }}>
          <UserButton 
            afterSignOutUrl="/sign-in" 
            userButtonPopoverPlacement="bottom-end"
            appearance={{ 
              elements: { 
                userButtonAvatarBox: { width: '40px', height: '40px' } 
              } 
            }} 
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: flex !important; }
          .header-subtitle { display: none; }
          .header-title { font-size: 1.25rem !important; }
        }
      `}</style>
    </header>
  );
}

export default Header;