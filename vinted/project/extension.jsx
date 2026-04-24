// Extension popup — 400×600 — 9 screens, fully clickable prototype
// ReVint design. Geist + Instrument Serif.

const ICONS = {
  search: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  close: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  check: <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6.5l3 3L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chev: <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevD: <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  heart: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 14s-5-3.5-5-7.5A2.5 2.5 0 018 4a2.5 2.5 0 015 2.5C13 10.5 8 14 8 14z" stroke="currentColor" strokeWidth="1.4"/></svg>,
  eye: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>,
  settings: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  refresh: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.5 6A5 5 0 003.5 6M3.5 10a5 5 0 009 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  boost: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3.5 1.5 5-4.5-3.5-4.5 3.5L5 9.5 1 6h5L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  msg: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 3h12v9H5l-3 3V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  edit: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  plus: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  cal: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" stroke="currentColor" strokeWidth="1.4" rx="1"/><path d="M2 6h12M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  zap: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/></svg>,
  trash: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sun: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  moon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/></svg>,
};

// ─── Theme context (light/dark) — globally synced ─────────
const ThemeContext = React.createContext({ dark: false, toggle: () => {} });
const THEME_KEY = 'revint-ext-theme';
const THEME_EVENT = 'revint-theme-change';
function readThemeDark() {
  try { return localStorage.getItem(THEME_KEY) === 'dark'; } catch(e) { return false; }
}
function writeThemeDark(dark) {
  try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch(e) {}
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { dark } }));
}
function useGlobalTheme() {
  const [dark, setDark] = React.useState(readThemeDark);
  React.useEffect(() => {
    const onChange = (e) => setDark(!!e.detail?.dark);
    const onStorage = (e) => { if (e.key === THEME_KEY) setDark(e.newValue === 'dark'); };
    window.addEventListener(THEME_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  const toggle = React.useCallback(() => {
    setDark(d => { const n = !d; writeThemeDark(n); return n; });
  }, []);
  return [dark, toggle];
}

// ─── Mock data ─────────────────────────────────────────────
const ARTICLES = [
  { id: 1, title: 'Veste en cuir vintage Levi\'s', price: 65, views: 847, favs: 43, days: 12, status: 'active', brand: 'Levi\'s', size: 'M', cat: 'Vestes' },
  { id: 2, title: 'Robe midi satin vert forêt', price: 28, views: 412, favs: 19, days: 5, status: 'active', brand: 'Zara', size: '36', cat: 'Robes' },
  { id: 3, title: 'Sneakers Nike Air Max 90 — taille 42', price: 75, views: 1203, favs: 67, days: 18, status: 'hot', brand: 'Nike', size: '42', cat: 'Chaussures' },
  { id: 4, title: 'Jean mom fit taille haute délavé', price: 22, views: 298, favs: 11, days: 3, status: 'active', brand: 'Pull&Bear', size: '38', cat: 'Jeans' },
  { id: 5, title: 'Sac à main cuir grainé camel', price: 45, views: 156, favs: 8, days: 27, status: 'stale', brand: 'Vintage', size: '—', cat: 'Sacs' },
  { id: 6, title: 'Pull col roulé laine mérinos', price: 35, views: 523, favs: 22, days: 9, status: 'active', brand: 'Uniqlo', size: 'S', cat: 'Pulls' },
  { id: 7, title: 'Bottines Dr. Martens 1460 noires', price: 85, views: 987, favs: 54, days: 14, status: 'hot', brand: 'Dr. Martens', size: '39', cat: 'Chaussures' },
  { id: 8, title: 'Chemise en lin blanc oversize', price: 18, views: 201, favs: 7, days: 31, status: 'stale', brand: 'H&M', size: 'L', cat: 'Chemises' },
];

const statusChip = (s) => {
  if (s === 'hot') return <span className="chip gold dot">Hot</span>;
  if (s === 'stale') return <span className="chip dot" style={{color: '#B83A3A'}}>Stale</span>;
  return <span className="chip dot">Actif</span>;
};

// ─── Shared header / tabs ─────────────────────────────────
function Header({ title, onBack, right }) {
  return (
    <div className="ext-header">
      <div className="ext-logo">
        {onBack ? (
          <button className="ext-iconbtn" onClick={onBack}>{ICONS.back}</button>
        ) : (
          <div className="ext-logo-mark">R</div>
        )}
        <span>{title || 'ReVint'}</span>
        {!onBack && (
          <span className="chip" style={{marginLeft: 6, fontSize: 8}}>
            <span className="ext-status-dot" /> LIVE
          </span>
        )}
      </div>
      <div className="ext-header-actions">{right}</div>
    </div>
  );
}

function Tabs({ current, onChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dash' },
    { id: 'articles', label: 'Articles', badge: 127 },
    { id: 'automation', label: 'Auto' },
    { id: 'stats', label: 'Stats' },
  ];
  return (
    <div className="ext-tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`ext-tab ${current === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.badge && <span className="badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Screen: Onboarding / Auto-connect ───────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = React.useState(0);
  const steps = [
    { label: 'Détection session Vinted…', sub: 'cookie _vinted_fr_session' },
    { label: 'Récupération du profil…', sub: 'GET /api/v2/users/me' },
    { label: 'Synchronisation articles…', sub: '127 items trouvés' },
    { label: 'Prêt.', sub: 'Bienvenue, @lucia_sells' },
  ];

  React.useEffect(() => {
    if (step < steps.length - 1) {
      const t = setTimeout(() => setStep(step + 1), 1400);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <>
      <Header />
      <div className="ext-main">
        <div className="onboard-stage">
          <div className="scanner" style={{marginBottom: 28}}>
            <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em'}}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontFamily: 'var(--display)', fontSize: 44, color: 'var(--ink)', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px'}}>R</div>
                <div style={{marginTop: 4}}>SCANNING</div>
              </div>
            </div>
          </div>

          <div style={{fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, letterSpacing: -0.8, marginBottom: 8}}>
            Connexion en cours
          </div>
          <div style={{fontSize: 12, color: 'var(--ink-3)', marginBottom: 24, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto'}}>
            On récupère votre session depuis les cookies Vinted. Aucun mot de passe requis.
          </div>

          <div style={{textAlign: 'left', background: 'var(--cream-2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 12, fontFamily: 'var(--mono)', fontSize: 11, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto'}}>
            {steps.map((s, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', opacity: i <= step ? 1 : 0.3}}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  background: i < step ? 'var(--success)' : (i === step ? 'var(--gold)' : 'var(--line-strong)'),
                  color: '#fff', fontSize: 8,
                }}>
                  {i < step ? '✓' : (i === step ? '·' : '')}
                </span>
                <span style={{color: i <= step ? 'var(--ink)' : 'var(--ink-4)', flex: 1}}>{s.label}</span>
                <span style={{fontSize: 9, color: 'var(--ink-4)'}}>{s.sub}</span>
              </div>
            ))}
          </div>

          {step === steps.length - 1 && (
            <button className="btn btn-gold btn-lg" style={{marginTop: 24, width: '100%', justifyContent: 'center'}} onClick={onDone}>
              Ouvrir le dashboard {ICONS.chev}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Dashboard ───────────────────────────────────────────
function Dashboard({ go }) {
  return (
    <div style={{padding: '14px 14px 16px'}}>
      {/* Greeting */}
      <div style={{marginBottom: 14}}>
        <div style={{fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4}}>
          Vendredi 18 avril · 14h32
        </div>
        <div style={{fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, letterSpacing: -0.8, lineHeight: 1.15}}>
          Bonjour <em>Lucia</em>.<br/>
          <span style={{color: 'var(--ink-3)'}}>3 nouveaux favoris aujourd'hui.</span>
        </div>
      </div>

      {/* Stat grid */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16}}>
        <div className="stat">
          <div className="stat-label">Articles actifs</div>
          <div className="stat-value tabular">127</div>
          <div className="stat-delta">+4 cette sem.</div>
        </div>
        <div className="stat">
          <div className="stat-label">Vues / 7j</div>
          <div className="stat-value tabular">4 218</div>
          <div className="stat-delta">+12.4%</div>
        </div>
        <div className="stat">
          <div className="stat-label">Favoris</div>
          <div className="stat-value tabular">89</div>
          <div className="stat-delta neg">-3</div>
        </div>
        <div className="stat">
          <div className="stat-label">Ventes / mois</div>
          <div className="stat-value tabular">12</div>
          <div className="stat-delta">+2 vs avr.</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="sec-head" style={{padding: '0 0 8px'}}>
        <div className="sec-title">Actions rapides</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16}}>
        <button className="btn" style={{justifyContent: 'flex-start', padding: 12, flexDirection: 'column', alignItems: 'flex-start', gap: 6, height: 'auto'}} onClick={() => go('repost')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-deep)'}}>{ICONS.boost}</div>
          <div style={{fontSize: 12, fontWeight: 500}}>Reposter articles</div>
          <div style={{fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)'}}>8 sélectionnés</div>
        </button>
        <button className="btn" style={{justifyContent: 'flex-start', padding: 12, flexDirection: 'column', alignItems: 'flex-start', gap: 6, height: 'auto'}} onClick={() => go('automation')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-deep)'}}>{ICONS.zap}</div>
          <div style={{fontSize: 12, fontWeight: 500}}>Auto-réponses</div>
          <div style={{fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)'}}>14 envoyées aujourd'hui</div>
        </button>
      </div>

      {/* Activity */}
      <div className="sec-head" style={{padding: '0 0 8px'}}>
        <div className="sec-title">Activité récente</div>
        <span style={{fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)'}}>LIVE</span>
      </div>
      <div className="card" style={{fontSize: 12}}>
        {[
          { t: '14:28', e: 'Favori', who: '@marion_k', art: 'Sneakers Nike Air Max 90', auto: true },
          { t: '13:47', e: 'Vue', who: '@thecollector', art: 'Bottines Dr. Martens' },
          { t: '12:02', e: 'Favori', who: '@juju_style', art: 'Veste en cuir Levi\'s', auto: true },
          { t: '10:14', e: 'Vendu', who: '@pauline_m', art: 'Robe satin vert' },
        ].map((e, i) => (
          <div key={i} style={{padding: '10px 12px', borderBottom: i < 3 ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', width: 36}}>{e.t}</div>
            <div style={{flex: 1, overflow: 'hidden'}}>
              <div style={{fontSize: 11, color: 'var(--ink-3)'}}>
                <b style={{color: 'var(--ink)', fontWeight: 500}}>{e.e}</b> · {e.who}
              </div>
              <div style={{fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.art}</div>
            </div>
            {e.auto && <span className="chip gold" style={{fontSize: 8}}>AUTO</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Articles list ───────────────────────────────────────
function ArticlesList({ go, selected, setSelected }) {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const shown = ARTICLES.filter(a => {
    if (query && !a.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter !== 'all' && a.status !== filter) return false;
    return true;
  });

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  return (
    <>
      <div style={{padding: '10px 12px', borderBottom: '1px solid var(--line)', background: 'var(--cream)'}}>
        <div style={{position: 'relative'}}>
          <span style={{position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)'}}>{ICONS.search}</span>
          <input
            className="inp"
            placeholder="Rechercher parmi 127 articles…"
            style={{paddingLeft: 28}}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div style={{display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto'}}>
          {[
            { id: 'all', label: 'Tous', n: 127 },
            { id: 'hot', label: 'Hot', n: 8 },
            { id: 'active', label: 'Actifs', n: 89 },
            { id: 'stale', label: 'À booster', n: 30 },
          ].map(f => (
            <button
              key={f.id}
              className={`chip ${filter === f.id ? 'dark' : ''}`}
              style={{cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: 10, whiteSpace: 'nowrap'}}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span style={{opacity: 0.6, marginLeft: 2}}>{f.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        {shown.map(a => (
          <div
            key={a.id}
            className={`art-row ${selected.includes(a.id) ? 'selected' : ''}`}
            onClick={() => go('edit', a)}
          >
            <div className={`cb ${selected.includes(a.id) ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); toggle(a.id); }} />
            <div className="art-thumb">IMG</div>
            <div style={{overflow: 'hidden'}}>
              <div className="art-meta-title">{a.title}</div>
              <div className="art-meta-sub">
                <span>{a.brand}</span>
                <span className="sep">·</span>
                <span>T.{a.size}</span>
                <span className="sep">·</span>
                {statusChip(a.status)}
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div className="art-price tabular">{a.price}€</div>
              <div style={{fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', marginTop: 2, display: 'flex', gap: 6, justifyContent: 'flex-end'}}>
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 2}}>{ICONS.eye} {a.views}</span>
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 2}}>{ICONS.heart} {a.favs}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Edit article ────────────────────────────────────────
function EditArticle({ article, onBack, onSave }) {
  const [price, setPrice] = React.useState(article.price);
  const [title, setTitle] = React.useState(article.title);
  const [desc, setDesc] = React.useState('Pièce unique, portée quelques fois. Aucun défaut. Envoi soigné sous 24h. Négociable pour lot.');

  return (
    <>
      <Header title="Éditer l'annonce" onBack={onBack} right={
        <button className="btn btn-sm btn-primary" onClick={onSave}>Enregistrer</button>
      } />
      <div className="ext-main">
        <div style={{padding: 14}}>
          {/* Photos */}
          <label className="label">Photos · 4/20</label>
          <div style={{display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto'}}>
            {[1,2,3,4].map(i => (
              <div key={i} className="art-thumb" style={{width: 60, height: 60, flexShrink: 0, fontSize: 9}}>
                IMG {i}
              </div>
            ))}
            <div style={{width: 60, height: 60, border: '1px dashed var(--line-strong)', borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', color: 'var(--ink-4)', cursor: 'pointer', flexShrink: 0}}>
              {ICONS.plus}
            </div>
          </div>

          {/* Title */}
          <label className="label">Titre</label>
          <input className="inp" value={title} onChange={e => setTitle(e.target.value)} style={{marginBottom: 4}} />
          <div style={{fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', textAlign: 'right', marginBottom: 14}}>
            {title.length}/80
          </div>

          {/* Price */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14}}>
            <div>
              <label className="label">Prix (€)</label>
              <input className="inp tabular" type="text" value={price} onChange={e => setPrice(+e.target.value || 0)} style={{fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px'}} />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--line-strong)', borderRadius: 'var(--r)', background: '#fff', fontSize: 12}}>
                {article.cat} {ICONS.chevD}
              </div>
            </div>
          </div>

          {/* Suggestion */}
          <div style={{padding: 10, background: 'var(--gold-wash)', border: '1px solid var(--gold)', borderRadius: 'var(--r)', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start'}}>
            <div style={{color: 'var(--gold-deep)', paddingTop: 1}}>{ICONS.zap}</div>
            <div style={{fontSize: 11, flex: 1, color: 'var(--ink-2)'}}>
              <b>Suggestion ReVint :</b> baissez à {Math.max(1, price - 5)}€ pour entrer dans le top recherche. <u>Appliquer</u>
            </div>
          </div>

          {/* Description */}
          <label className="label">Description</label>
          <textarea className="inp" value={desc} onChange={e => setDesc(e.target.value)} rows={5} style={{marginBottom: 14}} />

          {/* Meta */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14}}>
            <div>
              <label className="label">Marque</label>
              <input className="inp" value={article.brand} readOnly />
            </div>
            <div>
              <label className="label">Taille</label>
              <input className="inp" value={article.size} readOnly />
            </div>
          </div>

          {/* Stats inline */}
          <div style={{background: 'var(--cream-2)', padding: 12, borderRadius: 'var(--r)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '3px 0'}}>
              <span>PUBLIÉ IL Y A</span><span className="tabular">{article.days} JOURS</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '3px 0'}}>
              <span>VUES</span><span className="tabular">{article.views}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '3px 0'}}>
              <span>FAVORIS</span><span className="tabular">{article.favs}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="ext-footer">
        <button className="btn btn-danger btn-sm">{ICONS.trash} Supprimer</button>
        <div style={{flex: 1}} />
        <button className="btn btn-sm" onClick={onBack}>Annuler</button>
        <button className="btn btn-primary btn-sm" onClick={onSave}>Enregistrer</button>
      </div>
    </>
  );
}

// ─── Repost / Boost ──────────────────────────────────────
function Repost({ onBack, selected }) {
  const [mode, setMode] = React.useState('now');
  const [delay, setDelay] = React.useState(true);
  const count = selected.length || 8;
  return (
    <>
      <Header title="Reposter" onBack={onBack} />
      <div className="ext-main">
        <div style={{padding: 14}}>
          <div style={{fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 6}}>
            Reposter <em>{count} articles</em> sélectionnés
          </div>
          <div style={{fontSize: 12, color: 'var(--ink-3)', marginBottom: 20}}>
            Supprime et republie vos annonces pour les remettre en tête de recherche.
          </div>

          {/* Selected preview */}
          <div style={{display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4}}>
            {ARTICLES.slice(0, count).map((a, i) => (
              <div key={i} className="art-thumb" style={{width: 44, height: 44, flexShrink: 0, fontSize: 8}}>
                {a.brand.slice(0, 3).toUpperCase()}
              </div>
            ))}
          </div>

          <label className="label">Quand ?</label>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16}}>
            {[
              { id: 'now', label: 'Maintenant' },
              { id: 'sched', label: 'Planifier' },
              { id: 'smart', label: 'Heure opti.' },
            ].map(m => (
              <button
                key={m.id}
                className={`btn btn-sm ${mode === m.id ? 'btn-primary' : ''}`}
                style={{justifyContent: 'center'}}
                onClick={() => setMode(m.id)}
              >{m.label}</button>
            ))}
          </div>

          {mode === 'sched' && (
            <div style={{marginBottom: 14, padding: 10, background: 'var(--cream-2)', borderRadius: 'var(--r)', display: 'flex', gap: 8, alignItems: 'center'}}>
              {ICONS.cal}
              <span style={{fontSize: 12}}>Samedi 19 avril · 19:30</span>
              <div style={{flex: 1}} />
              <button className="btn btn-ghost btn-sm">Changer</button>
            </div>
          )}

          {mode === 'smart' && (
            <div style={{marginBottom: 14, padding: 10, background: 'var(--gold-wash)', border: '1px solid var(--gold)', borderRadius: 'var(--r)', fontSize: 11, color: 'var(--ink-2)'}}>
              <b>Calculée sur vos stats :</b> pic d'audience vendredi 20h–21h. On repostera vos articles par lots de 2 sur cette fenêtre.
            </div>
          )}

          <div style={{padding: '10px 12px', background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10}}>
            <div className={`toggle ${delay ? 'on' : ''}`} onClick={() => setDelay(!delay)} />
            <div style={{flex: 1}}>
              <div style={{fontSize: 12, fontWeight: 500}}>Délai aléatoire entre posts</div>
              <div style={{fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)'}}>3–12 MIN · ÉVITE LES ANTI-SPAMS</div>
            </div>
          </div>

          <div style={{padding: '10px 12px', background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 10}}>
            <div className="toggle on" />
            <div style={{flex: 1}}>
              <div style={{fontSize: 12, fontWeight: 500}}>Conserver les statistiques</div>
              <div style={{fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)'}}>VUES / FAVORIS TRANSFÉRÉS</div>
            </div>
          </div>

          <div style={{marginTop: 20, padding: 12, background: 'var(--ext-fg)', color: 'var(--ext-bg)', borderRadius: 'var(--r)', fontFamily: 'var(--mono)', fontSize: 10}}>
            <div style={{opacity: 0.5, letterSpacing: '0.1em', marginBottom: 6}}>ESTIMATION</div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '2px 0'}}>
              <span>DURÉE TOTALE</span><span>~ 48 MIN</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '2px 0'}}>
              <span>GAIN VUES ESTIMÉ</span><span>+340%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="ext-footer">
        <button className="btn btn-sm" onClick={onBack}>Retour</button>
        <div style={{flex: 1}} />
        <button className="btn btn-gold btn-sm">
          {ICONS.boost} Lancer ({count})
        </button>
      </div>
    </>
  );
}

// ─── Automation: auto-reply to favorites ─────────────────
function Automation({ go }) {
  const [enabled, setEnabled] = React.useState(true);
  const [tpl, setTpl] = React.useState(
    'Bonjour ! Merci pour votre intérêt sur mon article ❤️\n\nIl est toujours dispo. Je fais un petit geste si vous prenez 2 pièces ou plus dans mon dressing. Bonne journée !'
  );

  return (
    <div style={{padding: 14}}>
      {/* Main toggle */}
      <div style={{padding: 14, background: enabled ? 'var(--ext-fg)' : 'var(--ext-bg-2)', color: enabled ? 'var(--ext-bg)' : 'var(--ext-fg)', border: '1px solid var(--ext-line)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, transition: 'all 0.15s'}}>
        <div style={{width: 36, height: 36, background: enabled ? 'var(--gold)' : 'var(--ext-bg-3)', color: enabled ? '#0F1117' : 'var(--ext-fg)', borderRadius: 'var(--r)', display: 'grid', placeItems: 'center'}}>
          {ICONS.zap}
        </div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 13, fontWeight: 500}}>Réponse auto aux favoris</div>
          <div style={{fontSize: 10, fontFamily: 'var(--mono)', opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase'}}>
            {enabled ? 'ACTIF · 14 envoyés aujourd\'hui' : 'DÉSACTIVÉ'}
          </div>
        </div>
        <div className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled(!enabled)} style={{background: enabled ? 'var(--gold)' : undefined}} />
      </div>

      {/* Template editor */}
      <div className="sec-head" style={{padding: '4px 0 8px'}}>
        <div className="sec-title">Template du message</div>
        <button className="btn btn-ghost btn-sm">{ICONS.plus} Variable</button>
      </div>
      <textarea
        className="inp"
        value={tpl}
        onChange={e => setTpl(e.target.value)}
        rows={6}
        style={{fontFamily: 'var(--sans)', fontSize: 12, marginBottom: 8}}
      />
      <div style={{display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap'}}>
        {['{{prenom}}', '{{article}}', '{{prix}}', '{{marque}}'].map(v => (
          <button key={v} className="chip" style={{fontFamily: 'var(--mono)', cursor: 'pointer', border: 'none', textTransform: 'none', fontSize: 9}}>
            + {v}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="sec-head" style={{padding: '0 0 8px'}}>
        <div className="sec-title">Aperçu</div>
      </div>
      <div style={{background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 12, marginBottom: 14}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--line)'}}>
          <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--cream-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)'}}>MK</div>
          <div style={{flex: 1, fontSize: 11}}>
            <b style={{fontWeight: 500}}>@marion_k</b> a mis en favori
            <div style={{fontSize: 10, color: 'var(--ink-4)'}}>Sneakers Nike Air Max 90 · il y a 4 min</div>
          </div>
          <span className="chip gold dot" style={{fontSize: 8}}>AUTO</span>
        </div>
        <div style={{background: 'var(--cream-2)', padding: 10, borderRadius: 'var(--r-sm)', fontSize: 11.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--ink-2)'}}>
          {tpl.replace('{{prenom}}', 'Marion').replace('{{article}}', 'Sneakers Nike Air Max 90').replace('{{prix}}', '75€').replace('{{marque}}', 'Nike')}
        </div>
      </div>

      {/* Settings */}
      <div className="sec-head" style={{padding: '0 0 8px'}}>
        <div className="sec-title">Conditions d'envoi</div>
      </div>
      <div className="card">
        {[
          { label: 'Délai avant envoi', val: '5–15 min', note: 'Aléatoire, semble humain' },
          { label: 'Max par jour', val: '30 messages' },
          { label: 'Ignorer si favori < 24h', val: 'ON', toggle: true },
          { label: 'Ne pas envoyer 2×', val: 'ON', toggle: true },
        ].map((s, i, arr) => (
          <div key={i} style={{padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none'}}>
            <div style={{flex: 1, fontSize: 12}}>
              <div>{s.label}</div>
              {s.note && <div style={{fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)', letterSpacing: '0.05em', textTransform: 'uppercase'}}>{s.note}</div>}
            </div>
            {s.toggle ? <div className="toggle on" /> : (
              <div style={{fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)'}}>{s.val} {ICONS.chev}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats ───────────────────────────────────────────────
function Stats() {
  const data = [24, 31, 19, 42, 58, 38, 67, 72, 54, 89, 76, 94, 82, 108];
  const max = Math.max(...data);

  return (
    <div style={{padding: 14}}>
      <div style={{fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14}}>
        14 derniers jours
      </div>

      {/* Chart */}
      <div style={{background: '#fff', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: 14, marginBottom: 14}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14}}>
          <div>
            <div style={{fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em'}}>VUES TOTALES</div>
            <div style={{fontFamily: 'var(--display)', fontWeight: 800, fontSize: 28, letterSpacing: -1.2, lineHeight: 1}}>4 218</div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--success)'}}>+12.4%</div>
            <div style={{fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)'}}>vs 14j précédents</div>
          </div>
        </div>
        <svg viewBox="0 0 300 80" style={{width: '100%', height: 80, display: 'block'}}>
          {data.map((v, i) => {
            const h = (v / max) * 60;
            const x = i * (300 / data.length);
            const w = 300 / data.length - 2;
            return (
              <g key={i}>
                <rect x={x} y={70 - h} width={w} height={h} fill={i === data.length - 1 ? '#E8C547' : '#1A1D3A'} />
              </g>
            );
          })}
          <line x1="0" y1="70" x2="300" y2="70" stroke="rgba(26,29,58,0.12)" />
        </svg>
      </div>

      {/* Top articles */}
      <div className="sec-head" style={{padding: '0 0 8px'}}>
        <div className="sec-title">Top articles</div>
        <span style={{fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)'}}>PAR VUES</span>
      </div>
      <div className="card" style={{marginBottom: 14}}>
        {ARTICLES.slice(0, 4).sort((a, b) => b.views - a.views).map((a, i) => (
          <div key={a.id} style={{padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: i < 3 ? '1px solid var(--line)' : 'none'}}>
            <div style={{fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)', width: 18, fontWeight: 500}}>{i + 1}</div>
            <div className="art-thumb" style={{width: 32, height: 32, fontSize: 7}}>{a.brand.slice(0,3).toUpperCase()}</div>
            <div style={{flex: 1, overflow: 'hidden', fontSize: 11}}>
              <div style={{fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{a.title}</div>
              <div style={{fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', marginTop: 2}}>
                {a.views} vues · {a.favs} fav
              </div>
            </div>
            <div style={{fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px'}}>{a.price}€</div>
          </div>
        ))}
      </div>

      {/* Conv funnel */}
      <div className="sec-head" style={{padding: '0 0 8px'}}>
        <div className="sec-title">Entonnoir de conversion</div>
      </div>
      <div style={{background: 'var(--ext-fg)', color: 'var(--ext-bg)', borderRadius: 'var(--r)', padding: 14, fontFamily: 'var(--mono)', fontSize: 11}}>
        {[
          { label: 'VUES', v: '4 218', w: 100 },
          { label: 'FAVORIS', v: '189', w: 45 },
          { label: 'MESSAGES', v: '54', w: 22 },
          { label: 'VENDUS', v: '12', w: 8 },
        ].map((r, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0'}}>
            <div style={{width: 70, opacity: 0.6, letterSpacing: '0.08em', fontSize: 9}}>{r.label}</div>
            <div style={{flex: 1, height: 12, background: 'rgba(250,247,242,0.08)', position: 'relative'}}>
              <div style={{height: '100%', width: `${r.w}%`, background: i === 3 ? 'var(--gold)' : 'var(--ext-bg)'}} />
            </div>
            <div style={{width: 50, textAlign: 'right'}}>{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────
function Settings({ onBack }) {
  return (
    <>
      <Header title="Paramètres" onBack={onBack} />
      <div className="ext-main">
        <div style={{padding: 14}}>
          {/* Account */}
          <div className="card" style={{padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{width: 44, height: 44, background: 'var(--ext-fg)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', color: 'var(--gold)', fontSize: 20, fontWeight: 900}}>L</div>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 500, fontSize: 13}}>@lucia_sells</div>
              <div style={{fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)'}}>PLAN PRO · RENOUV. 12 MAI</div>
            </div>
            <button className="btn btn-sm">Gérer</button>
          </div>

          {[
            { title: 'Préférences',
              items: [
                { l: 'Langue', v: 'Français' },
                { l: 'Devise', v: 'EUR €' },
                { l: 'Notifications bureau', toggle: true },
                { l: 'Thème sombre', toggle: false },
              ] },
            { title: 'Automatisation',
              items: [
                { l: 'Fenêtre d\'activité', v: '9h – 22h' },
                { l: 'Jours actifs', v: 'Lun – Dim' },
                { l: 'Limite quotidienne', v: '30 msg' },
              ] },
            { title: 'Compte Vinted',
              items: [
                { l: 'Session', v: 'Connecté · il y a 2h' },
                { l: 'Reconnecter', action: true },
                { l: 'Se déconnecter', danger: true },
              ] },
          ].map((section, si) => (
            <div key={si} style={{marginBottom: 14}}>
              <div className="sec-title" style={{padding: '0 0 8px'}}>{section.title}</div>
              <div className="card">
                {section.items.map((it, i, arr) => (
                  <div key={i} className="set-row" style={{borderBottom: i < arr.length - 1 ? '1px solid var(--ext-line)' : 'none', cursor: (it.action || it.danger) ? 'pointer' : 'default'}}>
                    <div className={`set-row-label ${it.danger ? 'danger' : ''}`}>{it.l}</div>
                    {it.toggle !== undefined ? (
                      <div className={`toggle ${it.toggle ? 'on' : ''}`} />
                    ) : it.v ? (
                      <div className="set-row-value">
                        {it.v} {ICONS.chev}
                      </div>
                    ) : (
                      <div className="set-row-chev">{ICONS.chev}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', textAlign: 'center', padding: '10px 0', letterSpacing: '0.1em'}}>
            REVINT v4.2.0 · BUILD 2804
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Theme toggle button ─────────────────────────────────
function ThemeToggle() {
  const { dark, toggle } = React.useContext(ThemeContext);
  return (
    <button
      className="ext-iconbtn ext-theme-toggle"
      title={dark ? 'Mode clair' : 'Mode sombre'}
      onClick={toggle}
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <span className="ic-swap" key={dark ? 'moon' : 'sun'}>
        {dark ? ICONS.sun : ICONS.moon}
      </span>
    </button>
  );
}

// ─── Container ───────────────────────────────────────────
function ExtensionPopup({ initialScreen = 'dashboard', initialDark }) {
  const [screen, setScreen] = React.useState(initialScreen);
  const [tab, setTab] = React.useState(
    ['dashboard', 'articles', 'automation', 'stats'].includes(initialScreen) ? initialScreen : 'dashboard'
  );
  const [editing, setEditing] = React.useState(ARTICLES[2]);
  const [selected, setSelected] = React.useState([1, 3, 7]);
  const [dark, toggleTheme] = useGlobalTheme();
  const themeValue = React.useMemo(() => ({ dark, toggle: toggleTheme }), [dark, toggleTheme]);
  const popupClass = `ext-popup${dark ? ' dark' : ''}`;

  const go = (s, payload) => {
    if (s === 'edit') { setEditing(payload); setScreen('edit'); return; }
    if (['dashboard', 'articles', 'automation', 'stats'].includes(s)) { setTab(s); setScreen('main'); return; }
    setScreen(s);
  };

  // Onboarding full-screen
  if (screen === 'onboard') {
    return (
      <ThemeContext.Provider value={themeValue}>
        <div className={popupClass}>
          <Onboarding onDone={() => setScreen('main')} />
        </div>
      </ThemeContext.Provider>
    );
  }
  if (screen === 'edit') {
    return (
      <ThemeContext.Provider value={themeValue}>
        <div className={popupClass}>
          <EditArticle article={editing} onBack={() => setScreen('main')} onSave={() => setScreen('main')} />
        </div>
      </ThemeContext.Provider>
    );
  }
  if (screen === 'repost') {
    return (
      <ThemeContext.Provider value={themeValue}>
        <div className={popupClass}>
          <Repost onBack={() => setScreen('main')} selected={selected} />
        </div>
      </ThemeContext.Provider>
    );
  }
  if (screen === 'settings') {
    return (
      <ThemeContext.Provider value={themeValue}>
        <div className={popupClass}>
          <Settings onBack={() => setScreen('main')} />
        </div>
      </ThemeContext.Provider>
    );
  }

  // Main with tab bar
  return (
    <ThemeContext.Provider value={themeValue}>
    <div className={popupClass}>
      <Header right={
        <>
          <ThemeToggle />
          <button className="ext-iconbtn" title="Rafraîchir">{ICONS.refresh}</button>
          <button className="ext-iconbtn" title="Paramètres" onClick={() => setScreen('settings')}>{ICONS.settings}</button>
        </>
      } />
      <Tabs current={tab} onChange={(t) => setTab(t)} />
      <div className="ext-main">
        {tab === 'dashboard' && <Dashboard go={go} />}
        {tab === 'articles' && <ArticlesList go={go} selected={selected} setSelected={setSelected} />}
        {tab === 'automation' && <Automation go={go} />}
        {tab === 'stats' && <Stats />}
      </div>
      {tab === 'articles' && (
        <div className="ext-footer">
          <div style={{fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-4)', letterSpacing: '0.05em'}}>
            {selected.length} SÉLECTIONNÉ{selected.length !== 1 ? 'S' : ''}
          </div>
          <div style={{flex: 1}} />
          <button className="btn btn-sm" disabled={!selected.length}>{ICONS.edit} Éditer</button>
          <button className="btn btn-sm btn-gold" disabled={!selected.length} onClick={() => setScreen('repost')}>
            {ICONS.boost} Reposter
          </button>
        </div>
      )}
    </div>
    </ThemeContext.Provider>
  );
}

window.ExtensionPopup = ExtensionPopup;
