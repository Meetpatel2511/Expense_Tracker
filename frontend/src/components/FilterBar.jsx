import React, { useState } from "react";
import { FiSearch, FiFilter, FiX, FiCalendar } from "react-icons/fi";

function FilterBar({ onFilterChange, categories = [], showCategory = true }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    onFilterChange({ search, category, startDate, endDate });
  };

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setStartDate("");
    setEndDate("");
    onFilterChange({ search: "", category: "", startDate: "", endDate: "" });
  };

  const hasActiveFilters = Boolean(search || category || startDate || endDate);

  return (
    <div className="card" style={{ marginBottom: "20px", padding: "16px 18px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem" }} />
          <input 
            type="text" 
            placeholder="Search by note or description..." 
            className="form-input" 
            style={{ paddingLeft: "40px", margin: 0 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button 
            type="button"
            className="btn-secondary" 
            style={{ padding: "10px 16px", fontSize: "0.85rem" }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <FiFilter size={14} />
            <span>{isExpanded ? "Hide Filters" : "Filter Options"}</span>
          </button>
          
          <button 
            type="button"
            className="btn-primary" 
            style={{ padding: "10px 18px", fontSize: "0.85rem", width: "auto" }}
            onClick={handleApply}
          >
            Apply
          </button>

          {hasActiveFilters && (
            <button 
              type="button"
              className="btn-icon" 
              style={{ background: "var(--accent-danger-light)", color: "var(--accent-danger)", borderColor: "rgba(239, 68, 68, 0.25)" }}
              onClick={handleReset}
              title="Clear all filters"
              aria-label="Clear all filters"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="animate-fade" style={{ 
          marginTop: "16px", 
          paddingTop: "16px", 
          borderTop: "1px solid var(--border-light)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px"
        }}>
          {showCategory && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "0.72rem" }}>Category</label>
              <select 
                className="form-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ fontSize: "0.875rem", padding: "10px 12px" }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: "0.72rem" }}>Start Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ fontSize: "0.875rem", padding: "10px 12px" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: "0.72rem" }}>End Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ fontSize: "0.875rem", padding: "10px 12px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
