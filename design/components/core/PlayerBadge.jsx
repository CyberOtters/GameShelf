import React from 'react';

export function PlayerBadge({ name, eyebrow = 'Now playing' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--surface-card)', background: 'var(--accent-primary)', border: 'var(--border-width) solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', width: 58, height: 58, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {initial}
      </div>
      <div style={{ display: 'grid', gap: '0.15rem', minWidth: 0 }}>
        <span style={{ fontWeight: 'var(--weight-black)', fontSize: 'var(--text-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--accent-secondary)' }}>{eyebrow}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-md)', lineHeight: 1.15, overflowWrap: 'anywhere' }}>{name}</span>
      </div>
    </div>
  );
}
