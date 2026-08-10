import React from 'react';

const base = {
  fontFamily: 'var(--font-display)',
  fontSize: '1rem',
  textAlign: 'center',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '0.85rem 1.4rem',
  color: 'var(--text-on-tomato)',
  background: 'var(--accent-primary)',
  border: 'var(--border-width) solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
  cursor: 'pointer',
  transition: `translate var(--duration-press), box-shadow var(--duration-press)`,
};

const variants = {
  primary: {},
  ghost: { color: 'var(--text-primary)', background: 'var(--surface-card)' },
};

export function Button({ children, variant = 'primary', disabled, as = 'button', href, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const Tag = as;
  const dynamic = disabled
    ? { opacity: 0.6, cursor: 'wait', translate: '0 0', boxShadow: 'var(--shadow-sm)' }
    : active
    ? { translate: '3px 3px', boxShadow: '0 0 0 var(--border-default)' }
    : hover
    ? { translate: '-2px -2px', boxShadow: '5px 5px 0 var(--border-default)' }
    : {};
  return (
    <Tag
      href={href}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      disabled={as === 'button' ? disabled : undefined}
      style={{ ...base, ...variants[variant], ...dynamic, ...style }}
    >
      {children}
    </Tag>
  );
}
