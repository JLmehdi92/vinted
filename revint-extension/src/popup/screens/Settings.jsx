import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import { IconChev } from '../components/Icons';
import useSupaAuth from '../hooks/useSupaAuth';

const STORAGE_KEY = 'revint_settings';

const DEFAULT_SETTINGS = {
  language: 'fr',
  currency: 'EUR',
  notifications_enabled: true,
  activity_start: 9,
  activity_end: 22,
  daily_msg_limit: 30,
};

function formatPlanExpiry(dateStr) {
  if (!dateStr) return '\u2014';
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['JAN','FEV','MAR','AVR','MAI','JUIN','JUIL','AOUT','SEP','OCT','NOV','DEC'];
    return `${day} ${months[d.getMonth()]}`;
  } catch {
    return '\u2014';
  }
}

const selectStyle = {
  width: 'auto',
  fontSize: 10,
  padding: '2px 6px',
  background: 'var(--ext-bg)',
  color: 'var(--ink-1)',
  border: '1px solid var(--ext-line)',
  borderRadius: 4,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
};

export default function Settings({ user, onBack, onLogout, dark, onToggleTheme }) {
  const { session, profile, signOut: supaSignOut } = useSupaAuth();
  const login = user?.login || 'utilisateur';
  const initial = (login[0] || 'L').toUpperCase();

  // --- Settings state ---
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        setSettings((prev) => ({ ...prev, ...result[STORAGE_KEY] }));
      }
    });
  }, []);

  // --- Plan info ---
  const planLabel = profile?.plan === 'pro' ? 'PLAN PRO' : 'PLAN FREE';
  const expiryLabel = profile?.plan_expires_at
    ? `RENOUV. ${formatPlanExpiry(profile.plan_expires_at)}`
    : '\u2014';

  // --- Reconnect handler ---
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectResult, setReconnectResult] = useState(null);

  const handleReconnect = async () => {
    setReconnecting(true);
    setReconnectResult(null);
    try {
      const result = await chrome.runtime.sendMessage({ type: 'revint:connect' });
      setReconnectResult(result?.connected ? 'ok' : 'fail');
    } catch (e) {
      setReconnectResult('fail');
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <>
      <Header title="Paramètres" onBack={onBack} />
      <div className="ext-main">
        <div style={{ padding: 14 }}>
          {/* Account card */}
          <div
            className="card"
            style={{
              padding: 14,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: 'var(--ext-fg)',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--display)',
                color: 'var(--gold)',
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {initial}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>@{login}</div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ink-4)',
                }}
              >
                {planLabel} &middot; {expiryLabel}
              </div>
            </div>
            <span className="chip" style={{ fontSize: 8, opacity: 0.5 }}>
              Bientôt
            </span>
          </div>

          {/* ── Préférences ── */}
          <div style={{ marginBottom: 14 }}>
            <div className="sec-title" style={{ padding: '0 0 8px' }}>
              Préférences
            </div>
            <div className="card">
              {/* Langue */}
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Langue</div>
                <div className="set-row-value" style={{opacity:0.5}}>Français <span style={{fontSize:8}}>(bientôt)</span></div>
              </div>

              {/* Devise */}
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Devise</div>
                <div className="set-row-value" style={{opacity:0.5}}>EUR &euro; <span style={{fontSize:8}}>(bientôt)</span></div>
              </div>

              {/* Notifications bureau */}
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Notifications bureau</div>
                <div className="set-row-value" style={{opacity:0.5}}>Bientôt</div>
              </div>

              {/* Thème sombre */}
              <div className="set-row" style={{ borderBottom: 'none' }}>
                <div className="set-row-label">Thème sombre</div>
                <Toggle on={dark} onClick={onToggleTheme} />
              </div>
            </div>
          </div>

          {/* ── Automatisation ── */}
          <div style={{ marginBottom: 14 }}>
            <div className="sec-title" style={{ padding: '0 0 8px' }}>
              Automatisation
            </div>
            <div className="card">
              {/* Fenêtre d'activité */}
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Fenêtre d&apos;activité</div>
                <select
                  style={selectStyle}
                  value={`${settings.activity_start || 9}-${settings.activity_end || 22}`}
                  onChange={(e) => {
                    const [s, en] = e.target.value.split('-').map(Number);
                    setSettings(prev => {
                      const next = { ...prev, activity_start: s, activity_end: en };
                      chrome.storage.local.set({ [STORAGE_KEY]: next });
                      return next;
                    });
                  }}
                >
                  <option value="9-22">9h &ndash; 22h</option>
                  <option value="8-23">8h &ndash; 23h</option>
                  <option value="7-21">7h &ndash; 21h</option>
                  <option value="0-24">24h/24</option>
                </select>
              </div>

              {/* Jours actifs */}
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Jours actifs</div>
                <div className="set-row-value" style={{opacity:0.5}}>Lun - Dim <span style={{fontSize:8}}>(bientôt)</span></div>
              </div>

              {/* Limite quotidienne */}
              <div className="set-row" style={{ borderBottom: 'none' }}>
                <div className="set-row-label">Limite quotidienne</div>
                <div className="set-row-value" style={{opacity:0.7}}>Voir onglet Auto</div>
              </div>
            </div>
          </div>

          {/* ── Compte Vinted ── */}
          <div style={{ marginBottom: 14 }}>
            <div className="sec-title" style={{ padding: '0 0 8px' }}>
              Compte Vinted
            </div>
            <div className="card">
              {/* Session */}
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Session</div>
                <div className="set-row-value">
                  {user ? 'Connecté à Vinted' : 'Non connecté'}
                </div>
              </div>

              {/* Reconnecter */}
              <div
                className="set-row"
                style={{ borderBottom: '1px solid var(--ext-line)', cursor: reconnecting ? 'wait' : 'pointer', opacity: reconnecting ? 0.6 : 1 }}
                onClick={reconnecting ? undefined : handleReconnect}
              >
                <div className="set-row-label">{reconnecting ? 'Reconnexion...' : 'Reconnecter'}</div>
                <div className="set-row-value" style={{ fontSize: 9 }}>
                  {reconnectResult === 'ok' && <span style={{ color: 'var(--success)' }}>Connecte</span>}
                  {reconnectResult === 'fail' && <span style={{ color: 'var(--danger)' }}>Echoue</span>}
                  {!reconnectResult && <IconChev />}
                </div>
              </div>

              {/* Se déconnecter */}
              <div
                className="set-row"
                style={{ borderBottom: 'none', cursor: 'pointer' }}
                onClick={async () => { await supaSignOut(); chrome.storage.local.remove('revint_user'); if (onLogout) onLogout(); else if (onBack) onBack(); }}
              >
                <div className="set-row-label danger">Se déconnecter</div>
                <div className="set-row-chev">
                  <IconChev />
                </div>
              </div>
            </div>
          </div>

          {/* Version footer */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              color: 'var(--ink-4)',
              textAlign: 'center',
              padding: '10px 0',
              letterSpacing: '0.1em',
            }}
          >
            REVINT v1.0.0
          </div>
        </div>
      </div>
    </>
  );
}
