import React from 'react';

const labels = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const colors = { HIGH: 'var(--priority-high)', MEDIUM: 'var(--priority-medium)', LOW: 'var(--priority-low)' };

export function PriorityPill({ priority }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'var(--weight-bold)', fontSize: '0.75rem',
      textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink)',
    }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors[priority], border: '2px solid var(--border-default)' }}></span>
      {labels[priority] || priority}
    </span>
  );
}
