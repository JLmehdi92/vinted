import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import PhotoEditor from '../components/PhotoEditor';
import { IconBoost, IconCal } from '../components/Icons';

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Shared logic: compute best hour from snapshots
function computeBestHourFromSnapshots(raw) {
  const snapshots = Object.entries(raw).map(([date, data]) => ({
    date,
    timestamp: data.timestamp,
    totalViews: data.totals?.views || 0,
  }));
  if (snapshots.length < 3) return null;
  const dayViews = {};
  const hourViews = {};
  snapshots.forEach(snap => {
    const ts = snap.timestamp || snap.date;
    if (!ts) return;
    const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
    const day = d.getDay();
    const hour = d.getHours();
    const views = snap.totalViews ?? 0;
    dayViews[day] = (dayViews[day] || 0) + views;
    hourViews[hour] = (hourViews[hour] || 0) + views;
  });
  let bestDay = 0, bestDayViews = 0;
  for (const [day, v] of Object.entries(dayViews)) {
    if (v > bestDayViews) { bestDay = Number(day); bestDayViews = v; }
  }
  let bestHour = 20, bestHourViews = 0;
  for (const [hour, v] of Object.entries(hourViews)) {
    if (v > bestHourViews) { bestHour = Number(hour); bestHourViews = v; }
  }
  return { day: DAY_NAMES[bestDay], hourStart: bestHour, hourEnd: Math.min(bestHour + 1, 23) };
}

function SmartTimeInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'revint:getSnapshots' })
      .then(res => {
        const raw = res?.snapshots || {};
        const result = computeBestHourFromSnapshots(raw);
        setInfo(result);
        setLoading(false);
      })
      .catch(() => {
        setInfo(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ marginBottom: 14, padding: 10, background: 'var(--gold-wash)', border: '1px solid var(--gold)', borderRadius: 'var(--r)', fontSize: 11, color: 'var(--ext-fg-2)' }}>
        <b>Analyse en cours...</b>
      </div>
    );
  }

  if (!info) {
    return (
      <div style={{ marginBottom: 14, padding: 10, background: 'var(--gold-wash)', border: '1px solid var(--gold)', borderRadius: 'var(--r)', fontSize: 11, color: 'var(--ext-fg-2)' }}>
        <b>Pas assez de données.</b> Utilisez l'extension quelques jours pour que ReVint calcule vos heures de pic.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 14, padding: 10, background: 'var(--gold-wash)', border: '1px solid var(--gold)', borderRadius: 'var(--r)', fontSize: 11, color: 'var(--ext-fg-2)' }}>
      <b>Calculée sur vos stats :</b> pic d'audience {info.day} {info.hourStart}h-{info.hourEnd}h.
    </div>
  );
}

const MODES = [
  { id: 'now', label: 'Maintenant' },
  { id: 'sched', label: 'Planifier' },
  { id: 'smart', label: 'Heure opti.' },
];

export default function Repost({ selectedIds, articles, onBack, onDone }) {
  const [mode, setMode] = useState('now');
  const [delay, setDelay] = useState(true);
  const [draftMode, setDraftMode] = useState(false);
  const [priceReduction, setPriceReduction] = useState(false);
  const [priceReductionValue, setPriceReductionValue] = useState('5');
  const [titleModifier, setTitleModifier] = useState(true);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('19:30');
  const [schedError, setSchedError] = useState(null);

  const ids = selectedIds || [];
  const count = ids.length;

  // Resolve selected articles for thumbnail strip
  const selectedArticles = (articles || []).filter((a) => ids.includes(a.id)).slice(0, count);

  // Restore in-flight batch state when the popup is re-opened mid-run.
  // The listener is always attached so late updates still land even if we
  // haven't called handleLaunch in this popup instance.
  useEffect(() => {
    chrome.storage.local.get(['revint_repost_batch', 'revint_repost_progress']).then((res) => {
      if (res.revint_repost_batch?.status === 'running') {
        setRunning(true);
      }
      if (res.revint_repost_progress) {
        setProgress(res.revint_repost_progress);
      }
    }).catch(() => {});

    const listener = (changes) => {
      if (changes.revint_repost_progress) {
        const p = changes.revint_repost_progress.newValue;
        setProgress(p);
        if (p?.status === 'complete') setRunning(false);
      }
      if (changes.revint_repost_batch) {
        const b = changes.revint_repost_batch.newValue;
        if (b?.status === 'running') setRunning(true);
        if (b?.status === 'complete') setRunning(false);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const scheduleAt = async (when) => {
    const res = await chrome.runtime.sendMessage({
      type: 'revint:scheduleRepost',
      itemIds: ids,
      when,
      delayMin: delay ? 5 : 0,
      delayMax: delay ? 15 : 0,
    });
    if (res?.error || !res?.scheduled) {
      throw new Error(res?.error || 'Planification impossible.');
    }
    setProgress({ total: count, done: 0, status: 'scheduled', when });
  };

  const handleLaunch = async () => {
    if (count === 0) return;
    setSchedError(null);
    if (mode === 'sched') {
      if (!schedDate) {
        setSchedError('Veuillez choisir une date pour la planification.');
        return;
      }
      const when = new Date(`${schedDate}T${schedTime}`).getTime();
      if (isNaN(when) || when <= Date.now()) {
        setSchedError('La date doit être dans le futur.');
        return;
      }
      try { await scheduleAt(when); } catch (e) { setSchedError(e.message); }
      return;
    }
    if (mode === 'smart') {
      try {
        const res = await chrome.runtime.sendMessage({ type: 'revint:getSnapshots' });
        const raw = res?.snapshots || {};
        const info = computeBestHourFromSnapshots(raw);
        const bestHour = info ? info.hourStart : 20;
        const now = new Date();
        const target = new Date();
        target.setHours(bestHour, 0, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
        await scheduleAt(target.getTime());
      } catch (e) {
        setSchedError(e.message);
      }
      return;
    }
    // Mode "now" — dispatch batch and surface any launch error to the user.
    setRunning(true);
    setProgress({ total: count, done: 0, status: 'running' });
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'revint:repostBatch',
        itemIds: ids,
        delayMin: delay ? 5 : 0,
        delayMax: delay ? 15 : 0,
        draftMode,
        priceReduction: priceReduction ? { type: 'percentage_decrease', value: parseInt(priceReductionValue) } : null,
        titleModifier,
      });
      if (res?.error) throw new Error(res.error);
    } catch (e) {
      setRunning(false);
      setProgress(null);
      setSchedError(`Impossible de lancer le repost : ${e.message}`);
    }
  };

  const isComplete = progress?.status === 'complete';

  return (
    <>
      <Header title="Reposter" onBack={onBack} />
      <div className="ext-main">
        <div style={{ padding: 14 }}>
          {/* Title */}
          <div
            style={{
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: -0.8,
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            Reposter <em>{count} articles</em> sélectionnés
          </div>
          <div style={{ fontSize: 12, color: 'var(--ext-fg-3)', marginBottom: 20 }}>
            Supprime et republie vos annonces pour les remettre en tête de recherche.
          </div>

          {/* Thumbnail strip */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 20,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {(selectedArticles.length > 0
              ? selectedArticles
              : Array.from({ length: count }, (_, i) => ({ id: i }))
            ).map((a, i) => {
              const thumbUrl =
                a.photos?.[0]?.thumbnails?.[0]?.url || a.photos?.[0]?.url || null;
              const brandLabel =
                (a.brand_title ?? a.brand ?? '').slice(0, 3).toUpperCase() || 'IMG';
              return (
                <div
                  key={a.id ?? i}
                  className="art-thumb"
                  style={{ width: 44, height: 44, flexShrink: 0, fontSize: 8 }}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    brandLabel
                  )}
                </div>
              );
            })}
          </div>

          {/* Photo editor overlay */}
          {editingPhoto && (
            <PhotoEditor
              imageUrl={editingPhoto}
              onSave={(blob) => { setEditingPhoto(null); }}
              onCancel={() => setEditingPhoto(null)}
            />
          )}

          {/* Edit photos button */}
          {selectedArticles.length > 0 && selectedArticles[0]?.photos?.[0] && (
            <button
              className="btn btn-sm"
              style={{ marginBottom: 12, width: '100%', justifyContent: 'center' }}
              onClick={() => {
                const url = selectedArticles[0].photos[0].full_size_url || selectedArticles[0].photos[0].url;
                if (url) setEditingPhoto(url);
              }}
            >
              Éditer les photos
            </button>
          )}

          {/* When selector */}
          <label className="label">Quand ?</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 6,
              marginBottom: 16,
            }}
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`btn btn-sm${mode === m.id ? ' btn-primary' : ''}`}
                style={{ justifyContent: 'center' }}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Schedule picker */}
          {mode === 'sched' && (
            <div style={{marginBottom:14, padding:10, background:'var(--ext-bg-2)', borderRadius:'var(--r)', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <IconCal />
              <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="inp" style={{width:'auto', flex:1}} />
              <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} className="inp" style={{width:80}} />
            </div>
          )}

          {/* Smart time info */}
          {mode === 'smart' && (
            <SmartTimeInfo />
          )}

          {/* Toggle: random delay */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--ext-surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Toggle on={delay} onClick={() => setDelay(!delay)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Délai aléatoire entre posts</div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--ext-fg-4)',
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                5-15 MIN &middot; ÉVITE LES ANTI-SPAMS
              </div>
            </div>
          </div>

          {/* Draft mode toggle (Dotb pattern) */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--ext-surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Toggle on={draftMode} onClick={() => setDraftMode(!draftMode)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Publier en brouillon</div>
              <div style={{ fontSize: 10, color: 'var(--ext-fg-4)', fontFamily: 'var(--mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                VÉRIFIER AVANT PUBLICATION
              </div>
            </div>
          </div>

          {/* Price reduction (Dotb pattern) */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--ext-surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Toggle on={priceReduction} onClick={() => setPriceReduction(!priceReduction)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Réduire le prix au repost</div>
            </div>
            {priceReduction && (
              <select
                style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 6px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', background: 'var(--ext-surface)', color: 'var(--ext-fg-3)', cursor: 'pointer' }}
                value={priceReductionValue}
                onChange={e => setPriceReductionValue(e.target.value)}
              >
                <option value="2">-2%</option>
                <option value="5">-5%</option>
                <option value="10">-10%</option>
                <option value="15">-15%</option>
              </select>
            )}
          </div>

          {/* Title modifier (Dotb pattern) */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--ext-surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Toggle on={titleModifier} onClick={() => setTitleModifier(!titleModifier)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Modifier le titre</div>
              <div style={{ fontSize: 10, color: 'var(--ext-fg-4)', fontFamily: 'var(--mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                ANTI-DOUBLON VINTED
              </div>
            </div>
          </div>

          {/* Keep stats — info notice */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--ext-surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{color:'var(--ext-fg-4)', fontSize:11}}>
              <span style={{fontFamily:'var(--mono)', fontSize:10, letterSpacing:'0.05em'}}>INFO</span> · Le repost crée une nouvelle annonce. Les vues et favoris repartent à zéro.
            </div>
          </div>

          {/* Schedule validation error */}
          {schedError && (
            <div style={{ padding: '8px 12px', marginBottom: 8, background: 'rgba(184,58,58,0.1)', color: 'var(--danger)', fontSize: 11, textAlign: 'center', borderRadius: 'var(--r)' }}>
              {schedError}
            </div>
          )}

          {/* Estimation box */}
          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: 'var(--ext-fg)',
              color: 'var(--ext-bg)',
              borderRadius: 'var(--r)',
              fontFamily: 'var(--mono)',
              fontSize: 10,
            }}
          >
            <div style={{ opacity: 0.5, letterSpacing: '0.1em', marginBottom: 6 }}>
              ESTIMATION
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>DURÉE TOTALE</span>
              <span>~ {delay ? count * (5 + 15) / 2 : count * 1} MIN</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>BOOST VISIBILITÉ</span>
              <span>Remontée en tête</span>
            </div>
          </div>

          {/* Progress indicator */}
          {running && progress && !isComplete && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: 'var(--ext-bg-2)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ext-fg-3)',
                  marginBottom: 8,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                En cours&hellip; {progress.done}/{progress.total}
              </div>
              <div
                style={{
                  height: 4,
                  background: 'var(--line)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((progress.done || 0) / (progress.total || 1)) * 100}%`,
                    background: 'var(--gold)',
                    borderRadius: 2,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Scheduled confirmation */}
          {progress?.status === 'scheduled' && (
            <div style={{marginTop:14, padding:12, background:'var(--gold-wash)', border:'1px solid var(--gold)', borderRadius:'var(--r)', fontSize:12}}>
              <div style={{fontWeight:600, marginBottom:4}}>Repost planifié !</div>
              <div style={{fontFamily:'var(--mono)', fontSize:10, color:'var(--ext-fg-3)'}}>
                {new Date(progress.when).toLocaleString('fr-FR')}
              </div>
            </div>
          )}

          {/* Results */}
          {isComplete && progress?.results && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                background: 'var(--gold-wash)',
                border: '1px solid var(--gold)',
                borderRadius: 'var(--r)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Repost terminé !
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-3)' }}>
                {progress.results.filter((r) => r.success).length}/{progress.results.length}{' '}
                articles repostés avec succès
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="ext-footer">
        <button className="btn btn-sm" onClick={onBack}>
          Retour
        </button>
        <div style={{ flex: 1 }} />
        {isComplete ? (
          <button className="btn btn-gold btn-sm" onClick={onDone || onBack}>
            Terminer
          </button>
        ) : (
          <button
            className="btn btn-gold btn-sm"
            onClick={handleLaunch}
            disabled={running}
          >
            <IconBoost /> {running ? 'En cours\u2026' : `Lancer (${count})`}
          </button>
        )}
      </div>
    </>
  );
}
