import React from 'react';
import { StatusPill } from './StatusPill.jsx';

export function GameCard({ title, platform, status, rating, coverUrl }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: 'var(--border-width) solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div style={{ aspectRatio: '16/9', background: coverUrl ? `center/cover url(${coverUrl})` : 'repeating-linear-gradient(135deg, var(--paper), var(--paper) 10px, var(--card) 10px, var(--card) 20px)', borderBottom: 'var(--border-width) solid var(--border-default)' }}></div>
      <div style={{ padding: '0.85rem', display: 'grid', gap: '0.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{platform}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusPill status={status} />
          {rating != null && <span style={{ fontWeight: 'var(--weight-bold)', fontSize: '0.85rem' }}>★ {rating}</span>}
        </div>
      </div>
    </div>
  );
}
