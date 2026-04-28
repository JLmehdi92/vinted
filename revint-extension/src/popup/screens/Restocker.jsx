import React, { useState, useEffect } from 'react';
import Toggle from '../components/Toggle';
import { IconRefresh, IconCheck, IconClose } from '../components/Icons';

const DEFAULT_CONFIG = {
  enabled: false,
  delayBeforeRestock: 5,
  publishAsDraft: false,
  backlogOrders: 0,
  checkInterval: 10,
};

const selectStyle = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  padding: '2px 6px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-sm)',
  background: 'var(--ext-surface)',
  color: 'var(--ext-fg-3)',
  cursor: 'pointer',
};

export default function Restocker() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [restockedToday, setRestockedToday] = useState(0);

  // Load config from storage
  useEffect(() => {
    chrome.storage.local.get('revint_restocker').then((result) => {
      if (result.revint_restocker) {
        setConfig((prev) => ({ ...prev, ...result.revint_restocker }));
      }
    }).catch(() => {});
  }, []);

  // Load daily stats
  useEffect(() => {
    chrome.storage.local.get('revint_restocker_daily').then((result) => {
      const counter = result.revint_restocker_daily;
      const today = new Date().toISOString().slice(0, 10);
      if (counter && counter.date === today) {
        setRestockedToday(counter.count || 0);
      }
    }).catch(() => {});
  }, []);

  // Load running state
  useEffect(() => {
    chrome.storage.local.get('revint_restocker_running').then((result) => {
      if (result.revint_restocker_running) {
        setRunning(true);
      }
    }).catch(() => {});
  }, []);

  // Load event logs + listen for changes
  useEffect(() => {
    chrome.storage.local.get('revint_restocker_logs').then((result) => {
      if (result.revint_restocker_logs) {
        setLogs(result.revint_restocker_logs.slice(-20));
      }
    }).catch(() => {});

    const listener = (changes) => {
      if (changes.revint_restocker_logs) {
        setLogs((changes.revint_restocker_logs.newValue || []).slice(-20));
      }
      if (changes.revint_restocker_daily) {
        const counter = changes.revint_restocker_daily.newValue;
        const today = new Date().toISOString().slice(0, 10);
        if (counter && counter.date === today) {
          setRestockedToday(counter.count || 0);
        }
      }
      if (changes.revint_restocker_running) {
        setRunning(!!changes.revint_restocker_running.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Persist config changes
  const updateConfig = (patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      chrome.storage.local.set({ revint_restocker: next });
      return next;
    });
  };

  const handleStart = () => {
    setRunning(true);
    chrome.storage.local.set({ revint_restocker_running: true });
    chrome.runtime.sendMessage({ type: 'revint:startRestocker', config }).catch(() => {});
  };

  const handleStop = () => {
    setRunning(false);
    chrome.storage.local.set({ revint_restocker_running: false });
    chrome.runtime.sendMessage({ type: 'revint:stopRestocker' }).catch(() => {});
  };

  const delayLabel = (val) => {
    if (val === 1) return '1 min';
    if (val === 5) return '5 min';
    if (val === 15) return '15 min';
    if (val === 30) return '30 min';
    if (val === 60) return '1 heure';
    return val + ' min';
  };

  return (
    <div style={{ padding: 14 }}>
      {/* Main toggle card */}
      <div
        style={{
          padding: 14,
          background: config.enabled ? 'var(--ext-fg)' : 'var(--ext-bg-2)',
          color: config.enabled ? 'var(--ext-bg)' : 'var(--ext-fg)',
          border: '1px solid var(--ext-line)',
          borderRadius: 'var(--r)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14,
          transition: 'all 0.15s',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: config.enabled ? 'var(--gold)' : 'var(--ext-bg-3)',
            color: config.enabled ? '#0F1117' : 'var(--ext-fg)',
            borderRadius: 'var(--r)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <IconRefresh />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Restocker</div>
          <div
            style={{
              fontSize: 10,
              fontFamily: 'var(--mono)',
              opacity: 0.6,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {config.enabled
              ? `ACTIF · ${restockedToday} article${restockedToday !== 1 ? 's' : ''} restocké${restockedToday !== 1 ? 's' : ''} aujourd'hui`
              : 'DÉSACTIVÉ'}
          </div>
        </div>
        <Toggle
          on={config.enabled}
          onClick={() => updateConfig({ enabled: !config.enabled })}
        />
      </div>

      {/* Settings */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Paramètres</div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        {[
          { label: 'Délai avant restock', note: 'Après la vente', selectType: 'delay' },
          { label: 'Publier en brouillon', note: 'Relecture avant mise en ligne', toggle: true, key: 'publishAsDraft' },
          { label: 'Commandes en attente max', note: 'File d\'attente de restock', selectType: 'backlog' },
          { label: 'Intervalle de vérification', note: 'Fréquence de scan', selectType: 'checkInterval' },
        ].map((s, i, arr) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            }}
          >
            <div style={{ flex: 1, fontSize: 12 }}>
              <div>{s.label}</div>
              {s.note && (
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--ext-fg-4)',
                    fontFamily: 'var(--mono)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {s.note}
                </div>
              )}
            </div>
            {s.toggle ? (
              <Toggle
                on={config[s.key]}
                onClick={() => updateConfig({ [s.key]: !config[s.key] })}
              />
            ) : s.selectType === 'delay' ? (
              <select
                style={selectStyle}
                value={config.delayBeforeRestock}
                onChange={(e) => updateConfig({ delayBeforeRestock: parseInt(e.target.value) })}
              >
                <option value={1}>1 min</option>
                <option value={5}>5 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 heure</option>
              </select>
            ) : s.selectType === 'backlog' ? (
              <select
                style={selectStyle}
                value={config.backlogOrders}
                onChange={(e) => updateConfig({ backlogOrders: parseInt(e.target.value) })}
              >
                <option value={0}>Illimité</option>
                <option value={10}>10 articles</option>
                <option value={50}>50 articles</option>
                <option value={100}>100 articles</option>
              </select>
            ) : s.selectType === 'checkInterval' ? (
              <select
                style={selectStyle}
                value={config.checkInterval}
                onChange={(e) => updateConfig({ checkInterval: parseInt(e.target.value) })}
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={30}>30 min</option>
              </select>
            ) : null}
          </div>
        ))}
      </div>

      {/* Daily status */}
      <div
        style={{
          padding: 12,
          background: 'var(--ext-fg)',
          color: 'var(--ext-bg)',
          borderRadius: 'var(--r)',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ opacity: 0.5, letterSpacing: '0.1em', marginBottom: 6 }}>
          AUJOURD'HUI
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>ARTICLES RESTOCKÉS</span>
          <span>{restockedToday}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>DÉLAI ACTUEL</span>
          <span>{delayLabel(config.delayBeforeRestock)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>MODE</span>
          <span>{config.publishAsDraft ? 'BROUILLON' : 'PUBLIÉ'}</span>
        </div>
      </div>

      {/* Event log */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Journal de restock</div>
      </div>
      <div
        style={{
          background: 'var(--ext-surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r)',
          maxHeight: 160,
          overflowY: 'auto',
          marginBottom: 14,
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--ext-fg-4)',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.05em',
            }}
          >
            AUCUN RESTOCK POUR LE MOMENT
          </div>
        ) : (
          [...logs].reverse().map((log, i) => (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: i < logs.length - 1 ? '1px solid var(--line)' : 'none',
                fontSize: 11,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: log.success
                    ? 'var(--success, #2F7D5B)'
                    : 'var(--danger, #B83A3A)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{log.article || '—'}</span>
                {log.price && (
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ext-fg-4)',
                      marginLeft: 4,
                    }}
                  >
                    {log.price}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  color: log.success
                    ? 'var(--success, #2F7D5B)'
                    : 'var(--danger, #B83A3A)',
                }}
              >
                {log.success ? 'RESTOCKÉ' : 'ERREUR'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: 'var(--ext-fg-4)',
                }}
              >
                {log.time ? new Date(log.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Start/Stop buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {running ? (
          <button
            className="btn btn-sm"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: 'rgba(184,58,58,0.1)',
              color: 'var(--danger, #B83A3A)',
              border: '1px solid var(--danger, #B83A3A)',
            }}
            onClick={handleStop}
          >
            <IconClose /> Arrêter
          </button>
        ) : (
          <button
            className="btn btn-gold btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleStart}
            disabled={!config.enabled}
          >
            <IconRefresh /> Démarrer
          </button>
        )}
      </div>

      {/* Running indicator */}
      {running && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            background: 'var(--gold-wash)',
            border: '1px solid var(--gold)',
            borderRadius: 'var(--r)',
            fontSize: 11,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.05em',
            textAlign: 'center',
            color: 'var(--ext-fg-2)',
          }}
        >
          EN COURS · SCAN TOUTES LES {config.checkInterval} MIN
        </div>
      )}
    </div>
  );
}
