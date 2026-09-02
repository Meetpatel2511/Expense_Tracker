import React, { useState } from "react";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";

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

  return (
    <div className="card" style={{ marginBottom: "24px", padding: "16px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input 
            type="text" 
            placeholder="Search by note..." 
            className="form-input" 
            style={{ paddingLeft: "36px", margin: 0 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            className="btn-secondary" 
            style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem" }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <FiFilter style={{ marginRight: "8px" }} />
            {isExpanded ? "Hide Filters" : "More Filters"}
          </button>
          <button 
            className="btn-primary" 
            style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem" }}
            onClick={handleApply}
          >
            Apply
          </button>
          {(search || category || startDate || endDate) && (
            <button 
                className="btn-icon" 
                style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                onClick={handleReset}
                title="Clear all filters"
            >
                <FiX />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="animate-fade" style={{ 
          marginTop: "16px", 
          paddingTop: "16px", 
          borderTop: "1px solid var(--border-light)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px"
        }}>
          {showCategory && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: "0.75rem" }}>Category</label>
              <select 
                className="form-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ fontSize: "0.85rem" }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: "0.75rem" }}>Start Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ fontSize: "0.85rem" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: "0.75rem" }}>End Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ fontSize: "0.85rem" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
