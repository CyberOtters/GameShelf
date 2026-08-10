import React from 'react';

export function TextField({ label, type = 'text', value, onChange, placeholder, id }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: '0.35rem' }}>
      <label htmlFor={id} style={{ fontWeight: 'var(--weight-black)', fontSize: '0.78rem', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>{label}</label>
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          fontFamily: 'inherit', fontSize: '1rem', fontWeight: 'var(--weight-semibold)',
          padding: '0.7rem 0.85rem', border: 'var(--border-width-sm) solid var(--border-default)', borderRadius: 'var(--radius-md)',
          background: 'var(--surface-field)', outline: 'none',
          boxShadow: focus ? '5px 5px 0 var(--accent-secondary)' : 'var(--shadow-sm)',
          translate: focus ? '-2px -2px' : '0 0',
          transition: 'translate 0.12s, box-shadow 0.12s',
        }}
      />
    </div>
  );
}
