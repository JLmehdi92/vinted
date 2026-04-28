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
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['JAN','FEV','MAR','AVR','MAI','JUIN','JUIL','AOUT','SEP','OCT','NOV','DEC'];
    return `${day} ${months[d.getMonth()]}`;
  } catch {
    return '—';
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
    : '—';

  // --- Reconnect handler ---
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectResult, setReconnectResult] = useState(null);
  const [reconnectMessage, setReconnectMessage] = useState(null);

  const handleReconnect = async () => {
    setReconnecting(true);
    setReconnectResult(null);
    setReconnectMessage(null);
    try {
      const result = await chrome.runtime.sendMessage({ type: 'revint:connect' });
      if (result?.connected) {
        setReconnectResult('ok');
      } else {
        setReconnectResult('fail');
        setReconnectMessage(result?.error || 'Connexion impossible.');
      }
    } catch (e) {
      setReconnectResult('fail');
      setReconnectMessage(e.message);
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <>
      <Header title="Paramètres" onBack={onBack} />
      <div className="ext-main">
        <div style={{ padding: 14 }}>

          {/* ── Account card ── */}
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
            <div style={{
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
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>@{login}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                {planLabel} &middot; {expiryLabel}
              </div>
            </div>
            <button
              className="btn btn-sm"
              style={{ flexShrink: 0, fontSize: 10 }}
              onClick={() => {/* Manage account — coming soon */}}
            >
              Gérer
            </button>
          </div>

          {/* ── Préférences ── */}
          <div style={{ marginBottom: 14 }}>
            <div className="sec-title" style={{ padding: '0 0 8px' }}>
              Préférences
            </div>
            <div className="card">
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Langue</div>
                <div className="set-row-value">
                  Français
                  <IconChev />
                </div>
              </div>
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Devise</div>
                <div className="set-row-value">
                  EUR &euro;
                  <IconChev />
                </div>
              </div>
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Notifications bureau</div>
                <Toggle on={settings.notifications_enabled} onClick={() => {
                  setSettings(prev => {
                    const next = { ...prev, notifications_enabled: !prev.notifications_enabled };
                    chrome.storage.local.set({ [STORAGE_KEY]: next });
                    return next;
                  });
                }} />
              </div>
              <div className="set-row">
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
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Jours actifs</div>
                <div className="set-row-value">
                  Lun - Dim
                  <IconChev />
                </div>
              </div>
              <div className="set-row">
                <div className="set-row-label">Limite quotidienne</div>
                <div className="set-row-value">
                  {settings.daily_msg_limit} msg/j
                  <IconChev />
                </div>
              </div>
            </div>
          </div>

          {/* ── Compte Vinted ── */}
          <div style={{ marginBottom: 14 }}>
            <div className="sec-title" style={{ padding: '0 0 8px' }}>
              Compte Vinted
            </div>
            <div className="card">
              <div className="set-row" style={{ borderBottom: '1px solid var(--ext-line)' }}>
                <div className="set-row-label">Session</div>
                <div className="set-row-value">
                  {user ? 'Connecté' : 'Non connecté'}
                </div>
              </div>
              <div
                className="set-row"
                style={{
                  borderBottom: '1px solid var(--ext-line)',
                  cursor: reconnecting ? 'wait' : 'pointer',
                  opacity: reconnecting ? 0.6 : 1,
                }}
                onClick={reconnecting ? undefined : handleReconnect}
              >
                <div className="set-row-label">
                  {reconnecting ? 'Reconnexion...' : 'Reconnecter'}
                </div>
                <div className="set-row-value" style={{ fontSize: 9 }}>
                  {reconnectResult === 'ok' && <span style={{ color: 'var(--success)' }}>Connecté</span>}
                  {reconnectResult === 'fail' && <span style={{ color: 'var(--danger)' }}>Échec</span>}
                  {!reconnectResult && <IconChev />}
                </div>
              </div>
              {reconnectMessage && reconnectResult === 'fail' && (
                <div style={{
                  padding: '6px 14px 10px',
                  fontSize: 10,
                  color: 'var(--danger)',
                  borderBottom: '1px solid var(--ext-line)',
                }}>
                  {reconnectMessage}
                </div>
              )}
              <div
                className="set-row"
                style={{ cursor: 'pointer' }}
                onClick={async () => {
                  await supaSignOut();
                  chrome.storage.local.remove('revint_user');
                  if (onLogout) onLogout();
                  else if (onBack) onBack();
                }}
              >
                <div className="set-row-label danger">Se déconnecter</div>
                <div className="set-row-chev">
                  <IconChev />
                </div>
              </div>
            </div>
          </div>

          {/* ── Version footer ── */}
          <div className="mono" style={{
            fontSize: 9,
            color: 'var(--ink-4)',
            textAlign: 'center',
            padding: '10px 0',
            letterSpacing: '0.1em',
          }}>
            REVINT v{chrome.runtime.getManifest?.()?.version || '1.1.0'}
          </div>
        </div>
      </div>
    </>
  );
}
