import React, { useState, useRef, useEffect } from "react";
import { FiCalendar, FiChevronDown, FiCheck } from "react-icons/fi";

function MonthSelector({ selectedMonth, selectedYear, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Generate last 12 months
  const options = [];
  const now = new Date();
  let currMonth = now.getUTCMonth(); 
  let currYear = now.getUTCFullYear();

  for (let i = 0; i < 12; i++) {
    options.push({
      month: currMonth + 1,
      year: currYear,
      label: `${months[currMonth]} ${currYear}`
    });

    currMonth--;
    if (currMonth < 0) {
      currMonth = 11;
      currYear--;
    }
  }

  const selectedLabel = options.find(opt => opt.month === selectedMonth && opt.year === selectedYear)?.label || "Select Month";

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: '160px', zIndex: 100 }}>
      {/* Trigger */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '10px', 
          background: 'var(--bg-surface-2)', 
          padding: '10px 14px', 
          borderRadius: '12px', 
          border: `1px solid ${isOpen ? 'var(--bg-accent)' : 'var(--border-color)'}`,
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: isOpen ? '#fff' : 'var(--text-secondary)',
          transition: 'var(--transition)',
          boxShadow: isOpen ? '0 0 0 3px var(--bg-accent-soft)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCalendar style={{ color: '#c4b5fd', fontSize: '0.95rem' }} />
          <span>{selectedLabel}</span>
        </div>
        <FiChevronDown style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.25s ease',
          opacity: 0.7
        }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="animate-fade"
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 6px)', 
            left: 0, 
            right: 0, 
            background: 'var(--bg-surface-2)', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            padding: '6px',
            zIndex: 1000
          }}
        >
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {options.map((opt, i) => {
              const isSelected = opt.month === selectedMonth && opt.year === selectedYear;
              return (
                <div 
                  key={i}
                  onClick={() => {
                    onChange(opt.month, opt.year);
                    setIsOpen(false);
                  }}
                  style={{ 
                    padding: '9px 12px', 
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? '#c4b5fd' : 'var(--text-secondary)',
                    background: isSelected ? 'var(--bg-accent-soft)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'var(--transition-fast)',
                    borderRadius: '8px',
                    margin: '2px 0'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <FiCheck size={14} style={{ color: '#a78bfa' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthSelector;
