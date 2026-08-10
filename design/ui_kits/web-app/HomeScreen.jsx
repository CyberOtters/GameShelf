(function () {
const { Card, CardTitleBar, CardBody, Button, PlayerBadge, StatBox } = window.GameShelfDesignSystem_8528f0;

function HomeScreen({ session, onSignOut }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem 1rem', backgroundColor: 'var(--surface-page)', backgroundImage: 'var(--dot-grid-image)', backgroundSize: 'var(--dot-grid-size)', position: 'relative' }}>
      <span style={{ position: 'absolute', top: '8%', left: '6%', rotate: '-12deg', fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem,8vw,6rem)', opacity: 0.14 }}>▲</span>
      <span style={{ position: 'absolute', bottom: '10%', right: '7%', rotate: '9deg', fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem,8vw,6rem)', opacity: 0.14 }}>●</span>
      <div style={{ width: 'min(420px, 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-lg)', letterSpacing: '0.02em', lineHeight: 1, textShadow: '3px 3px 0 var(--gold)' }}>
            Game<span style={{ color: 'var(--tomato)', textShadow: '3px 3px 0 var(--ink)' }}>Shelf</span>
          </h1>
        </div>
        <Card ridges>
          <CardTitleBar>{session ? 'Player Card' : 'No Player Found'}</CardTitleBar>
          <CardBody>
            {session ? (
              <>
                <PlayerBadge name={session.name} />
                <StatBox label="Email" value={session.email} />
                <Button variant="primary" onClick={onSignOut}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="primary" as="a" href="#login">Insert Coin</Button>
                <Button variant="ghost" as="a" href="#register">New Game</Button>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
window.HomeScreen = HomeScreen;
})();
