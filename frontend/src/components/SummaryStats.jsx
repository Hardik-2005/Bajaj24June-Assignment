import React from 'react';

export default function SummaryStats({ summary }) {
  const stats = [
    {
      icon: '🌲',
      label: 'Total Trees',
      value: summary.total_trees,
      color: 'green',
    },
    {
      icon: '🔄',
      label: 'Total Cycles',
      value: summary.total_cycles,
      color: 'orange',
    },
    {
      icon: '👑',
      label: 'Largest Tree Root',
      value: summary.largest_tree_root || '—',
      color: 'blue',
    },
  ];

  return (
    <div className="summary-grid" style={{ marginBottom: '28px' }}>
      {stats.map((s) => (
        <div className={`stat-card ${s.color}`} key={s.label}>
          <div className={`stat-icon ${s.color}`}>{s.icon}</div>
          <div className={`stat-value ${s.color}`}>{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
