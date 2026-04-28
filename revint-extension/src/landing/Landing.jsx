import React from 'react';
import '../popup/styles.css';

const FEATURES = [
  { t: 'Connexion auto', d: 'Sans mot de passe. 3 secondes.' },
  { t: 'Repost programme', d: 'En tete des recherches, 24h/24.' },
  { t: 'Auto-reponse', d: 'Un template, tous les favoris.' },
  { t: 'Edition en lot', d: 'Modifiez 50 annonces a la fois.' },
];

const AVATARS = ['CR', 'AD', 'LM', 'JK', 'MP'];

const FREE_FEATURES = [
  '30 articles suivis',
  'Repost manuel',
  'Stats 7 jours',
];

const PRO_FEATURES = [
  'Articles illimites',
  'Repost automatique',
  'Auto-reponse favoris',
  'Edition en lot',
  'Stats completes',
];

export default function Landing() {
  return (
    <div className="lp-page">
      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <div className="lp-nav-mark">R</div>
          <span>ReVint</span>
        </div>
        <div className="lp-nav-links">
          <a href="#pricing">Pricing</a>
          <a href="#docs">Docs</a>
          <a href="#changelog">Changelog</a>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a
            href="#login"
            style={{
              fontSize: 13,
              color: 'var(--ink-3)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Se connecter
          </a>
          <button className="btn btn-gold">Installer</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero-v3">
        <div className="lp-pill">
          <span className="ext-status-dot" /> v1.1.0 disponible
        </div>
        <h1 className="lp-h1-v3">
          Votre dressing Vinted,
          <br />
          <span className="lp-h1-accent">en pilote automatique.</span>
        </h1>
        <p className="lp-sub-v3">
          Extension Chrome pour revendeurs Vinted. Repost, edition en lot,
          reponse auto aux favoris.
        </p>
        <div className="lp-cta-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-gold btn-lg">
            Ajouter a Chrome — gratuit
          </button>
          <button className="btn btn-lg btn-ghost-lp">Voir la demo</button>
        </div>
        <div
          className="lp-hero-trust"
          style={{ justifyContent: 'center', marginTop: 32 }}
        >
          <div className="lp-avatars">
            {AVATARS.map((a, i) => (
              <div key={i} className="lp-av" style={{ zIndex: 5 - i }}>
                {a}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            <b style={{ color: 'var(--ink)' }}>2 841 revendeurs</b> utilisent
            ReVint
          </div>
        </div>

        {/* Product showcase — placeholder */}
        <div className="lp-product-showcase">
          <div className="lp-showcase-popup">
            <div
              style={{
                width: 400,
                height: 520,
                background:
                  'linear-gradient(135deg, var(--cream-2), var(--cream-3))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                fontFamily: 'var(--display)',
                color: 'var(--ink-3)',
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: 'var(--ink)',
                  color: 'var(--gold)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--display)',
                  fontWeight: 900,
                  fontSize: 26,
                  borderRadius: 12,
                }}
              >
                R
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: 'var(--ink-2)',
                }}
              >
                Extension preview
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-4)',
                  maxWidth: 260,
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Dashboard, repost automatique, stats en temps reel — tout depuis
                votre navigateur.
              </div>
            </div>
          </div>
          <div className="lp-showcase-glow" />
        </div>
      </section>

      {/* ── FEATURES ROW ── */}
      <section className="lp-features-row">
        {FEATURES.map((f) => (
          <div key={f.t} className="lp-feat-mini">
            <div className="lp-feat-mini-dot" />
            <div className="lp-feat-mini-title">{f.t}</div>
            <div className="lp-feat-mini-desc">{f.d}</div>
          </div>
        ))}
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-section-tight">
        <div className="lp-pricing-v2">
          {/* Free plan */}
          <div className="lp-plan-v2">
            <div className="lp-plan-head">
              <div className="lp-plan-name">Free</div>
              <div className="lp-plan-price">
                <b>0&euro;</b>
                <span>/mois</span>
              </div>
              <p className="lp-plan-desc">Pour trier son dressing.</p>
            </div>
            <ul className="lp-plan-list">
              {FREE_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="btn btn-lg btn-full">Installer</button>
          </div>

          {/* Pro plan */}
          <div className="lp-plan-v2 pro">
            <div className="lp-plan-ribbon">RECOMMANDE</div>
            <div className="lp-plan-head">
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-price">
                <b>8,90&euro;</b>
                <span>/mois</span>
              </div>
              <p className="lp-plan-desc" style={{ opacity: 0.85 }}>
                Pour les power-sellers.
              </p>
            </div>
            <ul className="lp-plan-list">
              {PRO_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="btn btn-gold btn-lg btn-full">
              Essayer 14j gratuits
            </button>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-final">
        <div className="lp-final-inner">
          <h2 className="lp-final-title">Pret ?</h2>
          <button
            className="btn btn-gold btn-lg"
            style={{ fontSize: 15, padding: '16px 28px', marginTop: 20 }}
          >
            Ajouter a Chrome
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer-min">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          <div
            className="lp-nav-mark"
            style={{ width: 24, height: 24, fontSize: 13 }}
          >
            R
          </div>
          ReVint
        </div>
        <div className="lp-footer-links">
          <a href="#docs">Docs</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
          <a href="#discord">Discord</a>
        </div>
        <div className="lp-footer-legal">
          <a href="#rgpd">RGPD</a>
          <a href="#cgu">CGU</a>
          <span>&copy; 2026 &middot; Lyon</span>
        </div>
      </footer>
    </div>
  );
}
