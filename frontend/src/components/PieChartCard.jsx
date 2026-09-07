import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"];

function PieChartCard({ categoryData = {}, total = 0, title = "Expense Breakdown", subtitle = "By category this month" }) {
  const data = Object.keys(categoryData).map((key) => ({
    name: key,
    value: categoryData[key]
  }));

  // Sort by value descending
  data.sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="card pie-chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">{title}</div>
            <div className="card-subtitle">{subtitle}</div>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No data yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card pie-chart-card">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
              ₹{total.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total</span>
          </div>
        </div>
      </div>

      <div className="pie-chart-layout">
        <div className="pie-chart-container">
          <ResponsiveContainer width="100%" height={180} minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-center-label">
            <div className="percent">100%</div>
            <span className="label">Total</span>
          </div>
        </div>

        <div className="pie-legend">
          {data.map((item, index) => (
            <div key={item.name} className="pie-legend-item">
              <div className="pie-legend-dot" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="pie-legend-name">{item.name}</span>
              <span className="pie-legend-value">₹{item.value.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PieChartCard;
