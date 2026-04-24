import React from 'react';

function StatTile({ label, value, delta, negative }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value tabular">{value}</div>
      {delta != null && (
        <div className={`stat-delta${negative ? ' neg' : ''}`}>{delta}</div>
      )}
    </div>
  );
}

export default StatTile;
