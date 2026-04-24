import React from 'react';

function Tabs({ current, onChange, tabs }) {
  const defaultTabs = [
    { id: 'dashboard', label: 'Dash' },
    { id: 'articles', label: 'Articles' },
    { id: 'automation', label: 'Auto' },
    { id: 'stats', label: 'Stats' },
  ];

  const items = tabs || defaultTabs;

  return (
    <div className="ext-tabs">
      {items.map((t) => (
        <button
          key={t.id}
          className={`ext-tab${current === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.badge != null && <span className="badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
