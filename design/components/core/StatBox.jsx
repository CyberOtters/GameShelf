import React from 'react';

export function StatBox({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: '0.3rem', padding: '0.7rem 0.85rem', background: 'var(--white)', border: 'var(--border-width-sm) solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ fontWeight: 'var(--weight-black)', fontSize: 'var(--text-caption)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: '1rem', overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  );
}
