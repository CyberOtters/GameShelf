import React from 'react';

export function TabGroup({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, borderBottom: 'var(--border-width) solid var(--border-default)' }}>
      {tabs.map((t, i) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          style={{
            fontFamily: 'var(--font-display)', fontSize: '0.95rem', padding: '0.9rem 0.5rem',
            background: t.value === active ? 'var(--accent-tertiary)' : 'var(--surface-card)',
            color: 'var(--text-primary)', border: 'none', cursor: 'pointer',
            opacity: t.value === active ? 1 : 0.45,
            borderLeft: i > 0 ? 'var(--border-width) solid var(--border-default)' : 'none',
            transition: 'opacity 0.15s, background 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
