import React from 'react';

export function Card({ children, ridges = false, style }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: 'var(--border-width) solid var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', ...style }}>
      {ridges && (
        <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: 'var(--accent-secondary)', borderBottom: 'var(--border-width) solid var(--border-default)' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ flex: 1, height: 8, background: 'var(--surface-card)', border: '2px solid var(--border-default)', borderRadius: 4 }}></span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export function CardTitleBar({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-sm)', textAlign: 'center', padding: '0.9rem 0.5rem', background: 'var(--accent-tertiary)', borderBottom: 'var(--border-width) solid var(--border-default)' }}>
      {children}
    </div>
  );
}

export function CardBody({ children, style }) {
  return <div style={{ padding: '1.6rem 1.5rem 1.7rem', display: 'grid', gap: 'var(--space-4)', ...style }}>{children}</div>;
}
