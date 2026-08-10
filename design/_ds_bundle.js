/* @ds-bundle: {"format":4,"namespace":"GameShelfDesignSystem_8528f0","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardTitleBar","sourcePath":"components/core/Card.jsx"},{"name":"CardBody","sourcePath":"components/core/Card.jsx"},{"name":"PlayerBadge","sourcePath":"components/core/PlayerBadge.jsx"},{"name":"StatBox","sourcePath":"components/core/StatBox.jsx"},{"name":"MessageBanner","sourcePath":"components/feedback/MessageBanner.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"GameCard","sourcePath":"components/game/GameCard.jsx"},{"name":"PriorityPill","sourcePath":"components/game/PriorityPill.jsx"},{"name":"StatusPill","sourcePath":"components/game/StatusPill.jsx"},{"name":"TabGroup","sourcePath":"components/navigation/TabGroup.jsx"}],"sourceHashes":{"components/core/Button.jsx":"1c70e4288b9b","components/core/Card.jsx":"818935806a87","components/core/PlayerBadge.jsx":"94d745f4b4ed","components/core/StatBox.jsx":"7f12e933f7de","components/feedback/MessageBanner.jsx":"2d923ae21c7f","components/forms/TextField.jsx":"b9a7423c9e4d","components/game/GameCard.jsx":"9fa52b179135","components/game/PriorityPill.jsx":"5abf05d5f63a","components/game/StatusPill.jsx":"6a656811100d","components/navigation/TabGroup.jsx":"3c8ca7bfac47","ui_kits/web-app/AuthScreen.jsx":"9053bf9334bf","ui_kits/web-app/HomeScreen.jsx":"3ad474ea9c2c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.GameShelfDesignSystem_8528f0 = window.GameShelfDesignSystem_8528f0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
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
  transition: `translate var(--duration-press), box-shadow var(--duration-press)`
};
const variants = {
  primary: {},
  ghost: {
    color: 'var(--text-primary)',
    background: 'var(--surface-card)'
  }
};
function Button({
  children,
  variant = 'primary',
  disabled,
  as = 'button',
  href,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const Tag = as;
  const dynamic = disabled ? {
    opacity: 0.6,
    cursor: 'wait',
    translate: '0 0',
    boxShadow: 'var(--shadow-sm)'
  } : active ? {
    translate: '3px 3px',
    boxShadow: '0 0 0 var(--border-default)'
  } : hover ? {
    translate: '-2px -2px',
    boxShadow: '5px 5px 0 var(--border-default)'
  } : {};
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    disabled: as === 'button' ? disabled : undefined,
    style: {
      ...base,
      ...variants[variant],
      ...dynamic,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  children,
  ridges = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      ...style
    }
  }, ridges && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: '10px 14px',
      background: 'var(--accent-secondary)',
      borderBottom: 'var(--border-width) solid var(--border-default)'
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 8,
      background: 'var(--surface-card)',
      border: '2px solid var(--border-default)',
      borderRadius: 4
    }
  }))), children);
}
function CardTitleBar({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-display-sm)',
      textAlign: 'center',
      padding: '0.9rem 0.5rem',
      background: 'var(--accent-tertiary)',
      borderBottom: 'var(--border-width) solid var(--border-default)'
    }
  }, children);
}
function CardBody({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '1.6rem 1.5rem 1.7rem',
      display: 'grid',
      gap: 'var(--space-4)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card, CardTitleBar, CardBody });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/PlayerBadge.jsx
try { (() => {
function PlayerBadge({
  name,
  eyebrow = 'Now playing'
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.9rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.5rem',
      color: 'var(--surface-card)',
      background: 'var(--accent-primary)',
      border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      width: 58,
      height: 58,
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, initial), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '0.15rem',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-black)',
      fontSize: 'var(--text-eyebrow)',
      letterSpacing: 'var(--tracking-eyebrow)',
      textTransform: 'uppercase',
      color: 'var(--accent-secondary)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-display-md)',
      lineHeight: 1.15,
      overflowWrap: 'anywhere'
    }
  }, name)));
}
Object.assign(__ds_scope, { PlayerBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PlayerBadge.jsx", error: String((e && e.message) || e) }); }

// components/core/StatBox.jsx
try { (() => {
function StatBox({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '0.3rem',
      padding: '0.7rem 0.85rem',
      background: 'var(--white)',
      border: 'var(--border-width-sm) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-black)',
      fontSize: 'var(--text-caption)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      fontSize: '1rem',
      overflowWrap: 'anywhere'
    }
  }, value));
}
Object.assign(__ds_scope, { StatBox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatBox.jsx", error: String((e && e.message) || e) }); }

// components/feedback/MessageBanner.jsx
try { (() => {
function MessageBanner({
  tone,
  children
}) {
  if (!tone) return null;
  const bg = tone === 'error' ? 'var(--error-bg)' : 'var(--ok-bg)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      fontSize: '0.9rem',
      padding: '0.65rem 0.85rem',
      border: 'var(--border-width-sm) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      background: bg
    }
  }, children);
}
Object.assign(__ds_scope, { MessageBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/MessageBanner.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function TextField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  id
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '0.35rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      fontWeight: 'var(--weight-black)',
      fontSize: '0.78rem',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    id: id,
    type: type,
    value: value,
    placeholder: placeholder,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      fontFamily: 'inherit',
      fontSize: '1rem',
      fontWeight: 'var(--weight-semibold)',
      padding: '0.7rem 0.85rem',
      border: 'var(--border-width-sm) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-field)',
      outline: 'none',
      boxShadow: focus ? '5px 5px 0 var(--accent-secondary)' : 'var(--shadow-sm)',
      translate: focus ? '-2px -2px' : '0 0',
      transition: 'translate 0.12s, box-shadow 0.12s'
    }
  }));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/game/PriorityPill.jsx
try { (() => {
const labels = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};
const colors = {
  HIGH: 'var(--priority-high)',
  MEDIUM: 'var(--priority-medium)',
  LOW: 'var(--priority-low)'
};
function PriorityPill({
  priority
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      fontWeight: 'var(--weight-bold)',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: colors[priority],
      border: '2px solid var(--border-default)'
    }
  }), labels[priority] || priority);
}
Object.assign(__ds_scope, { PriorityPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/PriorityPill.jsx", error: String((e && e.message) || e) }); }

// components/game/StatusPill.jsx
try { (() => {
const labels = {
  BACKLOG: 'Backlog',
  PLAYING: 'Playing',
  COMPLETED: 'Completed',
  DROPPED: 'Dropped'
};
const colors = {
  BACKLOG: 'var(--status-backlog)',
  PLAYING: 'var(--status-playing)',
  COMPLETED: 'var(--status-completed)',
  DROPPED: 'var(--status-dropped)'
};
function StatusPill({
  status
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      fontFamily: 'var(--font-display)',
      fontSize: '0.65rem',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      padding: '0.35rem 0.6rem',
      color: 'var(--ink)',
      background: colors[status],
      border: '2px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: '2px 2px 0 var(--border-default)'
    }
  }, labels[status] || status);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/game/GameCard.jsx
try { (() => {
function GameCard({
  title,
  platform,
  status,
  rating,
  coverUrl
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      display: 'grid',
      gridTemplateRows: 'auto 1fr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/9',
      background: coverUrl ? `center/cover url(${coverUrl})` : 'repeating-linear-gradient(135deg, var(--paper), var(--paper) 10px, var(--card) 10px, var(--card) 20px)',
      borderBottom: 'var(--border-width) solid var(--border-default)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.85rem',
      display: 'grid',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '0.85rem',
      lineHeight: 1.2
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      fontSize: '0.75rem',
      opacity: 0.7,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, platform), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatusPill, {
    status: status
  }), rating != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--weight-bold)',
      fontSize: '0.85rem'
    }
  }, "\u2605 ", rating))));
}
Object.assign(__ds_scope, { GameCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/GameCard.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabGroup.jsx
try { (() => {
function TabGroup({
  tabs,
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
      borderBottom: 'var(--border-width) solid var(--border-default)'
    }
  }, tabs.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: t.value,
    onClick: () => onChange(t.value),
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: '0.95rem',
      padding: '0.9rem 0.5rem',
      background: t.value === active ? 'var(--accent-tertiary)' : 'var(--surface-card)',
      color: 'var(--text-primary)',
      border: 'none',
      cursor: 'pointer',
      opacity: t.value === active ? 1 : 0.45,
      borderLeft: i > 0 ? 'var(--border-width) solid var(--border-default)' : 'none',
      transition: 'opacity 0.15s, background 0.15s'
    }
  }, t.label)));
}
Object.assign(__ds_scope, { TabGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabGroup.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/AuthScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    CardBody,
    Button,
    TabGroup,
    TextField,
    MessageBanner
  } = window.GameShelfDesignSystem_8528f0;
  function AuthScreen({
    initialTab = 'login',
    onSubmit
  }) {
    const [tab, setTab] = React.useState(initialTab);
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const [liEmail, setLiEmail] = React.useState('');
    const [liPassword, setLiPassword] = React.useState('');
    const [reName, setReName] = React.useState('');
    const [reEmail, setReEmail] = React.useState('');
    const [rePassword, setRePassword] = React.useState('');
    function fakeSubmit(okText) {
      setBusy(true);
      setMsg(null);
      setTimeout(() => {
        setBusy(false);
        setMsg({
          tone: 'ok',
          text: okText
        });
        onSubmit && onSubmit();
      }, 500);
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1rem',
        backgroundColor: 'var(--surface-page)',
        backgroundImage: 'var(--dot-grid-image)',
        backgroundSize: 'var(--dot-grid-size)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 'min(420px, 100%)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        marginBottom: '1.6rem'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-display-lg)',
        letterSpacing: '0.02em',
        lineHeight: 1,
        textShadow: '3px 3px 0 var(--gold)'
      }
    }, "Game", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--tomato)',
        textShadow: '3px 3px 0 var(--ink)'
      }
    }, "Shelf")), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: '0.55rem',
        fontWeight: 600,
        fontSize: '0.85rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase'
      }
    }, "Continue your quest")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(TabGroup, {
      tabs: [{
        value: 'login',
        label: 'Sign In'
      }, {
        value: 'register',
        label: 'Sign Up'
      }],
      active: tab,
      onChange: v => {
        setTab(v);
        setMsg(null);
      }
    }), tab === 'login' ? /*#__PURE__*/React.createElement("form", {
      onSubmit: e => {
        e.preventDefault();
        fakeSubmit('Welcome back! Loading save file…');
      },
      style: {
        padding: '1.6rem 1.5rem 1.7rem',
        display: 'grid',
        gap: '1.05rem'
      }
    }, /*#__PURE__*/React.createElement(TextField, {
      id: "li-email",
      label: "Email",
      type: "email",
      value: liEmail,
      onChange: setLiEmail
    }), /*#__PURE__*/React.createElement(TextField, {
      id: "li-password",
      label: "Password",
      type: "password",
      value: liPassword,
      onChange: setLiPassword
    }), msg && /*#__PURE__*/React.createElement(MessageBanner, {
      tone: msg.tone
    }, msg.text), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      disabled: busy,
      style: {
        width: '100%'
      }
    }, busy ? 'Loading…' : 'Sign In')) : /*#__PURE__*/React.createElement("form", {
      onSubmit: e => {
        e.preventDefault();
        fakeSubmit('Account created! Starting new game…');
      },
      style: {
        padding: '1.6rem 1.5rem 1.7rem',
        display: 'grid',
        gap: '1.05rem'
      }
    }, /*#__PURE__*/React.createElement(TextField, {
      id: "re-name",
      label: "Name",
      value: reName,
      onChange: setReName
    }), /*#__PURE__*/React.createElement(TextField, {
      id: "re-email",
      label: "Email",
      type: "email",
      value: reEmail,
      onChange: setReEmail
    }), /*#__PURE__*/React.createElement(TextField, {
      id: "re-password",
      label: "Password",
      type: "password",
      value: rePassword,
      onChange: setRePassword
    }), msg && /*#__PURE__*/React.createElement(MessageBanner, {
      tone: msg.tone
    }, msg.text), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      disabled: busy,
      style: {
        width: '100%'
      }
    }, busy ? 'Loading…' : 'Sign Up'))), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        marginTop: '1.3rem',
        fontSize: '0.85rem',
        fontWeight: 600
      }
    }, tab === 'login' ? /*#__PURE__*/React.createElement(React.Fragment, null, "New here? ", /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => {
        e.preventDefault();
        setTab('register');
      },
      style: {
        color: 'var(--ink)'
      }
    }, "Create an account")) : /*#__PURE__*/React.createElement(React.Fragment, null, "Already playing? ", /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => {
        e.preventDefault();
        setTab('login');
      },
      style: {
        color: 'var(--ink)'
      }
    }, "Sign in")))));
  }
  window.AuthScreen = AuthScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/AuthScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web-app/HomeScreen.jsx
try { (() => {
(function () {
  const {
    Card,
    CardTitleBar,
    CardBody,
    Button,
    PlayerBadge,
    StatBox
  } = window.GameShelfDesignSystem_8528f0;
  function HomeScreen({
    session,
    onSignOut
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1rem',
        backgroundColor: 'var(--surface-page)',
        backgroundImage: 'var(--dot-grid-image)',
        backgroundSize: 'var(--dot-grid-size)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: '8%',
        left: '6%',
        rotate: '-12deg',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(3rem,8vw,6rem)',
        opacity: 0.14
      }
    }, "\u25B2"), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        bottom: '10%',
        right: '7%',
        rotate: '9deg',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(3rem,8vw,6rem)',
        opacity: 0.14
      }
    }, "\u25CF"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 'min(420px, 100%)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        marginBottom: '1.6rem'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-display-lg)',
        letterSpacing: '0.02em',
        lineHeight: 1,
        textShadow: '3px 3px 0 var(--gold)'
      }
    }, "Game", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--tomato)',
        textShadow: '3px 3px 0 var(--ink)'
      }
    }, "Shelf"))), /*#__PURE__*/React.createElement(Card, {
      ridges: true
    }, /*#__PURE__*/React.createElement(CardTitleBar, null, session ? 'Player Card' : 'No Player Found'), /*#__PURE__*/React.createElement(CardBody, null, session ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PlayerBadge, {
      name: session.name
    }), /*#__PURE__*/React.createElement(StatBox, {
      label: "Email",
      value: session.email
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: onSignOut
    }, "Sign Out")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      as: "a",
      href: "#login"
    }, "Insert Coin"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      as: "a",
      href: "#register"
    }, "New Game"))))));
  }
  window.HomeScreen = HomeScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web-app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardTitleBar = __ds_scope.CardTitleBar;

__ds_ns.CardBody = __ds_scope.CardBody;

__ds_ns.PlayerBadge = __ds_scope.PlayerBadge;

__ds_ns.StatBox = __ds_scope.StatBox;

__ds_ns.MessageBanner = __ds_scope.MessageBanner;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.GameCard = __ds_scope.GameCard;

__ds_ns.PriorityPill = __ds_scope.PriorityPill;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.TabGroup = __ds_scope.TabGroup;

})();
