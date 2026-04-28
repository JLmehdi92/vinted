import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { IconChev } from '../components/Icons';

const STEPS = [
  { label: 'Detection session Vinted...', sub: 'cookie _vinted_fr_session' },
  { label: 'Recuperation du profil...', sub: 'GET /api/v2/users/me' },
  { label: 'Synchronisation articles...', sub: 'chargement du dressing' },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0); // 0, 1, 2 = in progress, 3 = done
  const [stepStatus, setStepStatus] = useState([]); // [{ok, msg}] per step
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const startedRef = React.useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoke which would otherwise
    // launch two concurrent flows and produce duplicate step entries.
    if (startedRef.current) return;
    startedRef.current = true;
    runConnection();
  }, []);

  async function runConnection() {
    // ── Step 0: Detect session ──
    // revint:connect gere tout : detection CSRF, refresh si perime, retry
    setStep(0);
    setStepStatus([]);
    await wait(300);
    setStepStatus([{ ok: true }]);

    await wait(400);

    // ── Step 1: Get profile (revint:connect gere le CSRF refresh automatiquement) ──
    setStep(1);
    try {
      const result = await chrome.runtime.sendMessage({ type: 'revint:connect' });
      if (!result?.connected || !result?.user) {
        const errorMsg = result?.error || '';
        // Message d'erreur adapte selon le cas
        if (errorMsg.includes('NOT_AUTHENTICATED') || errorMsg.includes('Ouvrez Vinted')) {
          setStepStatus(prev => [...prev, { ok: false, msg: 'Session non trouvee' }]);
          setError('Connectez-vous a Vinted dans un onglet, naviguez un peu sur le site, puis cliquez Reessayer.');
        } else {
          setStepStatus(prev => [...prev, { ok: false, msg: 'Echec' }]);
          setError('Naviguez sur vinted.fr (accueil, recherche...) pour activer la session, puis cliquez Reessayer.');
        }
        return;
      }
      setUser(result.user);
      setStepStatus(prev => [...prev, { ok: true, msg: `@${result.user.login}` }]);
    } catch (e) {
      setStepStatus(prev => [...prev, { ok: false, msg: 'Erreur' }]);
      setError('Impossible de recuperer votre profil Vinted. Verifiez que vous etes connecte sur vinted.fr.');
      return;
    }

    await wait(600);

    // ── Step 2: Sync articles ──
    setStep(2);
    try {
      const data = await chrome.runtime.sendMessage({ type: 'revint:getItems', page: 1, perPage: 1 });
      if (data?.error) throw new Error(data.error);
      const count = data?.pagination?.total_entries || data?.items?.length || 0;
      setStepStatus(prev => [...prev, { ok: true, msg: `${count} articles` }]);
    } catch (e) {
      // Don't lie with a green checkmark: surface the failure so the user knows
      // their dressing couldn't be synced and they need to take action.
      setStepStatus(prev => [...prev, { ok: false, msg: 'Echec' }]);
      setError('Impossible de synchroniser vos articles. Verifiez votre connexion Vinted et reessayez.');
      return;
    }

    await wait(400);

    // ── Done ──
    setStep(3);
  }

  function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  const isError = error !== null;
  const isDone = step === 3 && !isError;

  return (
    <>
      <Header />
      <div className="ext-main">
        <div className="onboard-stage">
          {/* Scanner animation */}
          <div className="scanner" style={{ marginBottom: 28 }}>
            <div style={{
              position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.1em',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--display)', fontSize: 44, color: 'var(--ink)',
                  fontWeight: 900, lineHeight: 1, letterSpacing: '-2px',
                }}>R</div>
                <div style={{ marginTop: 4 }}>SCANNING</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24,
            letterSpacing: -0.8, marginBottom: 8,
          }}>
            {isError ? 'Connexion echouee' : isDone ? `Bienvenue, ${user?.login || ''}` : 'Connexion en cours'}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: 12, color: 'var(--ink-3)', marginBottom: 24,
            maxWidth: 280, marginLeft: 'auto', marginRight: 'auto',
          }}>
            {isError
              ? error
              : isDone
              ? 'Votre dressing est pret.'
              : 'On recupere votre session depuis les cookies Vinted. Aucun mot de passe requis.'}
          </div>

          {/* Steps card */}
          <div
            className="card"
            style={{
              textAlign: 'left',
              padding: 14,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              maxWidth: 300,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {STEPS.map((s, i) => {
              const status = stepStatus[i];
              const isActive = i === step && !isError;
              const isPast = i < step || (i === step && status);
              const isFailed = status && !status.ok;

              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0',
                  opacity: isPast || isActive ? 1 : 0.3,
                  borderBottom: i < STEPS.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  {/* Status circle */}
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    flexShrink: 0, marginTop: 1,
                    background: isFailed ? 'var(--danger)'
                      : (status?.ok) ? 'var(--success)'
                      : isActive ? 'var(--gold)'
                      : 'var(--line-strong)',
                    color: '#fff', fontSize: 9, fontWeight: 700,
                  }}>
                    {isFailed ? '✗' : status?.ok ? '✓' : isActive ? '·' : ''}
                  </span>

                  {/* Label + sub */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: isPast || isActive ? 'var(--ink)' : 'var(--ink-4)',
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontSize: 9,
                      color: 'var(--ink-4)',
                      marginTop: 2,
                      fontFamily: 'var(--mono)',
                    }}>
                      {s.sub}
                    </div>
                  </div>

                  {/* Status message (right) */}
                  {status?.msg && (
                    <span style={{
                      fontSize: 9,
                      color: isFailed ? 'var(--danger)' : 'var(--success)',
                      fontWeight: 500,
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {status.msg}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Done button */}
          {isDone && (
            <button
              className="btn btn-gold btn-lg"
              style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
              onClick={onDone}
            >
              Ouvrir le dashboard <IconChev />
            </button>
          )}

          {/* Error retry button */}
          {isError && (
            <button
              className="btn btn-lg"
              style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setStep(0);
                setStepStatus([]);
                setError(null);
                setUser(null);
                startedRef.current = true;
                runConnection();
              }}
            >
              Reessayer
            </button>
          )}
        </div>
      </div>
    </>
  );
}
