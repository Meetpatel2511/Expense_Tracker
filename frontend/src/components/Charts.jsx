import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p>{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <div key={index} className="value" style={{ color: entry.fill || entry.color }}>
            {entry.name}: ₹{Number(entry.value).toLocaleString("en-IN")}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CategoryPieChart({ data = {} }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  
  if (chartData.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No category data available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function Charts({ monthlyData = [], hideHeader = false }) {
  return (
    <div className={`chart-container ${hideHeader ? 'no-header' : ''}`} style={{ background: 'transparent', border: 'none', padding: 0 }}>
      {!hideHeader && (
        <div className="card-header">
        <div>
          <div className="card-title">Financial Performance</div>
          <div className="card-subtitle">Income vs Expenses overview</div>
        </div>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: "#10b981" }} />
            Income
          </div>
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: "#6366f1" }} />
            Expenses
          </div>
        </div>
        </div>
      )}

      <div style={{ width: "100%", height: 280, position: 'relative' }}>
        {(!monthlyData || monthlyData.length === 0 || monthlyData.every(d => d.income === 0 && d.expense === 0)) ? (
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(255, 255, 255, 0.01)',
            borderRadius: '12px',
            color: 'var(--text-muted)',
            zIndex: 10
          }}>
             <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
             <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No data available for {new Date().getFullYear()}</p>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255, 255, 255, 0.3)", fontSize: 12 }}
              tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#incomeGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#expenseGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Charts;