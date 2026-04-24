// Landing minimal, inspirée de Firecrawl / Linear / Raycast — focus sur hero + produit + preuve sociale + pricing

function Landing() {
  return (
    <div className="lp-page">
      {/* NAV minimal */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <div className="lp-nav-mark">R</div>
          <span>ReVint</span>
        </div>
        <div className="lp-nav-links">
          <a>Pricing</a>
          <a>Docs</a>
          <a>Changelog</a>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <a style={{fontSize:13,color:'var(--ink-3)',textDecoration:'none',fontWeight:500}}>Se connecter</a>
          <button className="btn btn-gold">Installer</button>
        </div>
      </nav>

      {/* HERO — centré, grand, épuré */}
      <section className="lp-hero-v3">
        <div className="lp-pill">
          <span className="ext-status-dot" /> v4.2 disponible
        </div>
        <h1 className="lp-h1-v3">
          Votre dressing Vinted,<br/>
          <span className="lp-h1-accent">en pilote automatique.</span>
        </h1>
        <p className="lp-sub-v3">
          Extension Chrome pour revendeurs Vinted. Repost, édition en lot, réponse auto aux favoris.
        </p>
        <div className="lp-cta-row" style={{justifyContent:'center'}}>
          <button className="btn btn-gold btn-lg">Ajouter à Chrome — gratuit</button>
          <button className="btn btn-lg btn-ghost-lp">Voir la démo</button>
        </div>
        <div className="lp-hero-trust" style={{justifyContent:'center',marginTop:32}}>
          <div className="lp-avatars">
            {['CR','AD','LM','JK','MP'].map((a,i) => <div key={i} className="lp-av" style={{zIndex:5-i}}>{a}</div>)}
          </div>
          <div style={{fontSize:13,color:'var(--ink-3)'}}>
            <b style={{color:'var(--ink)'}}>2 841 revendeurs</b> utilisent ReVint
          </div>
        </div>

        {/* GROS visuel produit */}
        <div className="lp-product-showcase">
          <div className="lp-showcase-popup">
            <ExtensionPopup initialScreen="dashboard" />
          </div>
          <div className="lp-showcase-glow" />
        </div>
      </section>

      {/* 4 fonctions en ligne, ultra-résumées */}
      <section className="lp-features-row">
        {[
          { t: 'Connexion auto', d: 'Sans mot de passe. 3 secondes.' },
          { t: 'Repost programmé', d: 'En tête des recherches, 24h/24.' },
          { t: 'Auto-réponse', d: 'Un template, tous les favoris.' },
          { t: 'Édition en lot', d: 'Modifiez 50 annonces à la fois.' },
        ].map(f => (
          <div key={f.t} className="lp-feat-mini">
            <div className="lp-feat-mini-dot" />
            <div className="lp-feat-mini-title">{f.t}</div>
            <div className="lp-feat-mini-desc">{f.d}</div>
          </div>
        ))}
      </section>

      {/* PRICING minimal */}
      <section className="lp-section-tight">
        <div className="lp-pricing-v2">
          <div className="lp-plan-v2">
            <div className="lp-plan-head">
              <div className="lp-plan-name">Free</div>
              <div className="lp-plan-price"><b>0€</b><span>/mois</span></div>
              <p className="lp-plan-desc">Pour trier son dressing.</p>
            </div>
            <ul className="lp-plan-list">
              <li>30 articles suivis</li>
              <li>Repost manuel</li>
              <li>Stats 7 jours</li>
            </ul>
            <button className="btn btn-lg btn-full">Installer</button>
          </div>
          <div className="lp-plan-v2 pro">
            <div className="lp-plan-ribbon">RECOMMANDÉ</div>
            <div className="lp-plan-head">
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-price"><b>8,90€</b><span>/mois</span></div>
              <p className="lp-plan-desc" style={{opacity:.85}}>Pour les power-sellers.</p>
            </div>
            <ul className="lp-plan-list">
              <li>Articles illimités</li>
              <li>Repost automatique</li>
              <li>Auto-réponse favoris</li>
              <li>Édition en lot</li>
              <li>Stats complètes</li>
            </ul>
            <button className="btn btn-gold btn-lg btn-full">Essayer 14j gratuits</button>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="lp-final">
        <div className="lp-final-inner">
          <h2 className="lp-final-title">Prêt ?</h2>
          <button className="btn btn-gold btn-lg" style={{fontSize:15,padding:'16px 28px',marginTop:20}}>Ajouter à Chrome</button>
        </div>
      </section>

      {/* FOOTER compact */}
      <footer className="lp-footer-min">
        <div style={{display:'flex',alignItems:'center',gap:10,fontFamily:'var(--display)',fontWeight:800,fontSize:18}}>
          <div className="lp-nav-mark" style={{width:24,height:24,fontSize:13}}>R</div>
          ReVint
        </div>
        <div className="lp-footer-links">
          <a>Docs</a><a>Pricing</a><a>FAQ</a><a>Contact</a><a>Discord</a>
        </div>
        <div className="lp-footer-legal">
          <a>RGPD</a><a>CGU</a>
          <span>© 2026 · Lyon 🇫🇷</span>
        </div>
      </footer>
    </div>
  );
}

window.Landing = Landing;
