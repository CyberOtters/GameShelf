import React from 'react';

export function MessageBanner({ tone, children }) {
  if (!tone) return null;
  const bg = tone === 'error' ? 'var(--error-bg)' : 'var(--ok-bg)';
  return (
    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: '0.9rem', padding: '0.65rem 0.85rem', border: 'var(--border-width-sm) solid var(--border-default)', borderRadius: 'var(--radius-md)', background: bg }}>
      {children}
    </div>
  );
}
