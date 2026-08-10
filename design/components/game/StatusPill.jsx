import React from 'react';

const labels = { BACKLOG: 'Backlog', PLAYING: 'Playing', COMPLETED: 'Completed', DROPPED: 'Dropped' };
const colors = { BACKLOG: 'var(--status-backlog)', PLAYING: 'var(--status-playing)', COMPLETED: 'var(--status-completed)', DROPPED: 'var(--status-dropped)' };

export function StatusPill({ status }) {
  return (
    <span style={{
      display: 'inline-block', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.04em',
      textTransform: 'uppercase', padding: '0.35rem 0.6rem', color: 'var(--ink)', background: colors[status],
      border: '2px solid var(--border-default)', borderRadius: 'var(--radius-sm)', boxShadow: '2px 2px 0 var(--border-default)',
    }}>
      {labels[status] || status}
    </span>
  );
}
