(function () {
const { Card, CardBody, Button, TabGroup, TextField, MessageBanner } = window.GameShelfDesignSystem_8528f0;

function AuthScreen({ initialTab = 'login', onSubmit }) {
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
      setMsg({ tone: 'ok', text: okText });
      onSubmit && onSubmit();
    }, 500);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem 1rem', backgroundColor: 'var(--surface-page)', backgroundImage: 'var(--dot-grid-image)', backgroundSize: 'var(--dot-grid-size)' }}>
      <div style={{ width: 'min(420px, 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-lg)', letterSpacing: '0.02em', lineHeight: 1, textShadow: '3px 3px 0 var(--gold)' }}>
            Game<span style={{ color: 'var(--tomato)', textShadow: '3px 3px 0 var(--ink)' }}>Shelf</span>
          </h1>
          <p style={{ marginTop: '0.55rem', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Continue your quest</p>
        </div>
        <Card>
          <TabGroup tabs={[{ value: 'login', label: 'Sign In' }, { value: 'register', label: 'Sign Up' }]} active={tab} onChange={(v) => { setTab(v); setMsg(null); }} />
          {tab === 'login' ? (
            <form onSubmit={(e) => { e.preventDefault(); fakeSubmit('Welcome back! Loading save file…'); }} style={{ padding: '1.6rem 1.5rem 1.7rem', display: 'grid', gap: '1.05rem' }}>
              <TextField id="li-email" label="Email" type="email" value={liEmail} onChange={setLiEmail} />
              <TextField id="li-password" label="Password" type="password" value={liPassword} onChange={setLiPassword} />
              {msg && <MessageBanner tone={msg.tone}>{msg.text}</MessageBanner>}
              <Button variant="primary" disabled={busy} style={{ width: '100%' }}>{busy ? 'Loading…' : 'Sign In'}</Button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); fakeSubmit('Account created! Starting new game…'); }} style={{ padding: '1.6rem 1.5rem 1.7rem', display: 'grid', gap: '1.05rem' }}>
              <TextField id="re-name" label="Name" value={reName} onChange={setReName} />
              <TextField id="re-email" label="Email" type="email" value={reEmail} onChange={setReEmail} />
              <TextField id="re-password" label="Password" type="password" value={rePassword} onChange={setRePassword} />
              {msg && <MessageBanner tone={msg.tone}>{msg.text}</MessageBanner>}
              <Button variant="primary" disabled={busy} style={{ width: '100%' }}>{busy ? 'Loading…' : 'Sign Up'}</Button>
            </form>
          )}
        </Card>
        <div style={{ textAlign: 'center', marginTop: '1.3rem', fontSize: '0.85rem', fontWeight: 600 }}>
          {tab === 'login' ? <>New here? <a href="#" onClick={(e) => { e.preventDefault(); setTab('register'); }} style={{ color: 'var(--ink)' }}>Create an account</a></> : <>Already playing? <a href="#" onClick={(e) => { e.preventDefault(); setTab('login'); }} style={{ color: 'var(--ink)' }}>Sign in</a></>}
        </div>
      </div>
    </div>
  );
}
window.AuthScreen = AuthScreen;
})();
