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
    <div ref={dropdownRef} style={{ position: 'relative', width: '160px', zIndex: 100 }}>
      {/* Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '10px', 
            background: 'var(--bg-card)', 
            padding: '10px 16px', 
            borderRadius: '12px', 
            border: `1px solid ${isOpen ? 'var(--bg-accent)' : 'var(--border-light)'}`,
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            boxShadow: isOpen ? '0 0 0 3px rgba(124, 58, 237, 0.1)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCalendar style={{ color: 'var(--bg-accent)', fontSize: '1rem' }} />
            <span>{selectedLabel}</span>
        </div>
        <FiChevronDown style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
            transition: 'transform 0.3s ease',
            opacity: 0.7
        }} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
            className="animate-fade"
            style={{ 
                position: 'absolute', 
                top: 'calc(100% + 8px)', 
                left: 0, 
                right: 0, 
                background: '#1e293b', // Deep slate
                borderRadius: '12px', 
                border: '1px solid var(--border-light)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                padding: '6px'
            }}
        >
            <div style={{ maxHeight: '280px', overflowY: 'auto', scrollbarWidth: 'none' }}>
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
                                padding: '10px 14px', 
                                borderBottom: i === options.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.03)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: isSelected ? 800 : 500,
                                color: isSelected ? 'var(--bg-accent)' : 'var(--text-secondary)',
                                background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease',
                                borderRadius: '8px',
                                margin: '2px 0'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
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
                            {opt.label}
                            {isSelected && <FiCheck size={14} />}
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

