import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: "8px", 
      marginTop: "24px",
      padding: "16px 0"
    }}>
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-icon"
        style={{ 
          padding: "8px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          opacity: currentPage === 1 ? 0.5 : 1,
          cursor: currentPage === 1 ? "not-allowed" : "pointer"
        }}
      >
        <FiChevronLeft />
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            border: "1px solid var(--border-light)",
            background: currentPage === page ? "var(--bg-accent)" : "rgba(255, 255, 255, 0.05)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          {page}
        </button>
      ))}

      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-icon"
        style={{ 
          padding: "8px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          opacity: currentPage === totalPages ? 0.5 : 1,
          cursor: currentPage === totalPages ? "not-allowed" : "pointer"
        }}
      >
        <FiChevronRight />
      </button>
    </div>
  );
}

export default Pagination;
