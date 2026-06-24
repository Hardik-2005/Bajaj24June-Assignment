import React from 'react';

export default function BadgeList({ items, variant }) {
  if (!items || items.length === 0) {
    return (
      <p className="empty-msg">
        <span>✓</span>
        None found
      </p>
    );
  }

  return (
    <div className="badge-row">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className={`badge-item ${variant}`}>
          {variant === 'invalid' ? '✕' : '⎘'} {item}
        </span>
      ))}
    </div>
  );
}
