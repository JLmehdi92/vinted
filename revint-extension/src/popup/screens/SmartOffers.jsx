import React, { useState, useEffect, useRef } from 'react';
import Toggle from '../components/Toggle';
import { IconZap, IconCheck, IconClose, IconMsg } from '../components/Icons';

const DEFAULT_ACCEPT_MSG =
  "Bonjour @username ! Merci pour votre offre, je l'accepte avec plaisir ❤️ Bonne journée !";

const DEFAULT_COUNTER_MSG =
  "Bonjour @username ! Merci pour votre offre. Je vous propose un prix intermédiaire, qu'en pensez-vous ? 😊";

const DEFAULT_CONFIG = {
  enabled: false,
  offerType: 'simple',
  acceptPercent: 10,
  counterPercent: 15,
  smartRounding: true,
  acceptMessage: DEFAULT_ACCEPT_MSG,
  counterMessage: DEFAULT_COUNTER_MSG,
  enableCounter: true,
  checkInterval: 5,
  // Paliers mode
  paliers: [
    { minPercent: 0, maxPercent: 5, action: 'accept' },
    { minPercent: 5, maxPercent: 15, action: 'counter' },
    { minPercent: 15, maxPercent: 50, action: 'skip' },
  ],
};

const selectStyle = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  padding: '2px 6px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-sm)',
  background: 'var(--ext-surface)',
  color: 'var(--ink-3)',
  cursor: 'pointer',
};

export default function SmartOffers() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ accepted: 0, countered: 0 });

  // Load config from storage
  useEffect(() => {
    chrome.storage.local.get('revint_smart_offers').then((result) => {
      if (result.revint_smart_offers) {
        setConfig((prev) => ({ ...prev, ...result.revint_smart_offers }));
      }
    }).catch(() => {});
  }, []);

  // Load daily stats
  useEffect(() => {
    chrome.storage.local.get('revint_smart_offers_daily').then((result) => {
      const counter = result.revint_smart_offers_daily;
      const today = new Date().toISOString().slice(0, 10);
      if (counter && counter.date === today) {
        setStats({ accepted: counter.accepted || 0, countered: counter.countered || 0 });
      }
    }).catch(() => {});
  }, []);

  // Load running state
  useEffect(() => {
    chrome.storage.local.get('revint_smart_offers_running').then((result) => {
      if (result.revint_smart_offers_running) {
        setRunning(true);
      }
    }).catch(() => {});
  }, []);

  // Load event logs
  useEffect(() => {
    chrome.storage.local.get('revint_smart_offers_logs').then((result) => {
      if (result.revint_smart_offers_logs) {
        setLogs(result.revint_smart_offers_logs.slice(-20));
      }
    }).catch(() => {});

    const listener = (changes) => {
      if (changes.revint_smart_offers_logs) {
        setLogs((changes.revint_smart_offers_logs.newValue || []).slice(-20));
      }
      if (changes.revint_smart_offers_daily) {
        const counter = changes.revint_smart_offers_daily.newValue;
        const today = new Date().toISOString().slice(0, 10);
        if (counter && counter.date === today) {
          setStats({ accepted: counter.accepted || 0, countered: counter.countered || 0 });
        }
      }
      if (changes.revint_smart_offers_running) {
        setRunning(!!changes.revint_smart_offers_running.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Persist config changes
  const updateConfig = (patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      chrome.storage.local.set({ revint_smart_offers: next });
      return next;
    });
  };

  const handleStart = () => {
    setRunning(true);
    chrome.storage.local.set({ revint_smart_offers_running: true });
    chrome.runtime.sendMessage({ type: 'revint:startSmartOffers', config }).catch(() => {});
  };

  const handleStop = () => {
    setRunning(false);
    chrome.storage.local.set({ revint_smart_offers_running: false });
    chrome.runtime.sendMessage({ type: 'revint:stopSmartOffers' }).catch(() => {});
  };

  const acceptRef = useRef(null);
  const counterRef = useRef(null);

  const insertAtCursor = (ref, field, variable) => {
    const el = ref.current;
    const text = config[field];
    if (el) {
      const start = el.selectionStart ?? text.length;
      const end = el.selectionEnd ?? start;
      const before = text.slice(0, start);
      const after = text.slice(end);
      const newText = before + variable + after;
      updateConfig({ [field]: newText });
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + variable.length;
        el.focus();
      });
    } else {
      updateConfig({ [field]: text + variable });
    }
  };

  const logTypeLabel = (type) => {
    if (type === 'accept') return 'ACCEPTÉ';
    if (type === 'counter') return 'CONTRE-OFFRE';
    if (type === 'skip') return 'IGNORÉ';
    return type?.toUpperCase() || '—';
  };

  const logTypeColor = (type) => {
    if (type === 'accept') return 'var(--success, #2F7D5B)';
    if (type === 'counter') return 'var(--gold, #E8C547)';
    if (type === 'skip') return 'var(--ext-fg-4)';
    return 'var(--ext-fg-4)';
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
          <IconMsg />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Smart Offers</div>
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
              ? `ACTIF · ${stats.accepted} acceptée${stats.accepted !== 1 ? 's' : ''}, ${stats.countered} contre-offre${stats.countered !== 1 ? 's' : ''}`
              : 'DÉSACTIVÉ'}
          </div>
        </div>
        <Toggle
          on={config.enabled}
          onClick={() => updateConfig({ enabled: !config.enabled })}
        />
      </div>

      {/* Offer type selector */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Type d'offre</div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          marginBottom: 16,
        }}
      >
        {[
          { id: 'simple', label: 'Simple' },
          { id: 'paliers', label: 'Par paliers' },
        ].map((m) => (
          <button
            key={m.id}
            className={`btn btn-sm${config.offerType === m.id ? ' btn-primary' : ''}`}
            style={{ justifyContent: 'center' }}
            onClick={() => updateConfig({ offerType: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Simple mode sliders */}
      {config.offerType === 'simple' && (
        <div className="card" style={{ marginBottom: 14 }}>
          {/* Accept threshold */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12 }}>Accepter si remise ≤</div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--success, #2F7D5B)',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {config.acceptPercent}%
              </div>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={config.acceptPercent}
              onChange={(e) => updateConfig({ acceptPercent: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--gold)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', marginTop: 2 }}>
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Counter threshold */}
          <div style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12 }}>Contre-offre si remise ≤</div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--gold, #E8C547)',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {config.counterPercent}%
              </div>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={config.counterPercent}
              onChange={(e) => updateConfig({ counterPercent: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--gold)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', marginTop: 2 }}>
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>
        </div>
      )}

      {/* Paliers mode */}
      {config.offerType === 'paliers' && (
        <div className="card" style={{ marginBottom: 14 }}>
          {config.paliers.map((palier, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: i < config.paliers.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: palier.action === 'accept'
                    ? 'var(--success, #2F7D5B)'
                    : palier.action === 'counter'
                      ? 'var(--gold, #E8C547)'
                      : 'var(--danger, #B83A3A)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, fontSize: 11 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>
                  {palier.minPercent}% – {palier.maxPercent}%
                </span>
              </div>
              <select
                style={selectStyle}
                value={palier.action}
                onChange={(e) => {
                  const newPaliers = [...config.paliers];
                  newPaliers[i] = { ...palier, action: e.target.value };
                  updateConfig({ paliers: newPaliers });
                }}
              >
                <option value="accept">Accepter</option>
                <option value="counter">Contre-offre</option>
                <option value="skip">Ignorer</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Options */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Options</div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        {[
          { label: 'Arrondi intelligent', note: 'Ex: 23,47€ → 23,50€', toggle: true, key: 'smartRounding' },
          { label: 'Activer les contre-offres', toggle: true, key: 'enableCounter' },
          { label: 'Intervalle de vérification', selectType: 'checkInterval' },
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
                    color: 'var(--ink-4)',
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
            ) : s.selectType === 'checkInterval' ? (
              <select
                style={selectStyle}
                value={config.checkInterval}
                onChange={(e) => updateConfig({ checkInterval: parseInt(e.target.value) })}
              >
                <option value={3}>3 min</option>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
              </select>
            ) : null}
          </div>
        ))}
      </div>

      {/* Accept message template */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Message d'acceptation</div>
      </div>
      <textarea
        ref={acceptRef}
        className="inp"
        value={config.acceptMessage}
        onChange={(e) => updateConfig({ acceptMessage: e.target.value })}
        rows={3}
        style={{ fontFamily: 'var(--sans)', fontSize: 12, marginBottom: 4 }}
      />
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {['@username', '{{article}}', '{{prix}}'].map((v) => (
          <button
            key={v}
            className="chip"
            style={{
              fontFamily: 'var(--mono)',
              cursor: 'pointer',
              border: 'none',
              textTransform: 'none',
              fontSize: 9,
            }}
            onClick={() => insertAtCursor(acceptRef, 'acceptMessage', v)}
          >
            + {v}
          </button>
        ))}
      </div>

      {/* Counter-offer message template */}
      {config.enableCounter && (
        <>
          <div className="sec-head" style={{ padding: '0 0 8px' }}>
            <div className="sec-title">Message de contre-offre</div>
          </div>
          <textarea
            ref={counterRef}
            className="inp"
            value={config.counterMessage}
            onChange={(e) => updateConfig({ counterMessage: e.target.value })}
            rows={3}
            style={{ fontFamily: 'var(--sans)', fontSize: 12, marginBottom: 4 }}
          />
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
            {['@username', '{{article}}', '{{prix}}', '{{contre_prix}}'].map((v) => (
              <button
                key={v}
                className="chip"
                style={{
                  fontFamily: 'var(--mono)',
                  cursor: 'pointer',
                  border: 'none',
                  textTransform: 'none',
                  fontSize: 9,
                }}
                onClick={() => insertAtCursor(counterRef, 'counterMessage', v)}
              >
                + {v}
              </button>
            ))}
          </div>
        </>
      )}

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
          <span>OFFRES ACCEPTÉES</span>
          <span>{stats.accepted}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>CONTRE-OFFRES ENVOYÉES</span>
          <span>{stats.countered}</span>
        </div>
      </div>

      {/* Event log */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Journal des actions</div>
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
              color: 'var(--ink-4)',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.05em',
            }}
          >
            AUCUNE ACTION POUR LE MOMENT
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
                  background: logTypeColor(log.type),
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{log.article || '—'}</span>
                {log.user && (
                  <span style={{ color: 'var(--ink-4)', marginLeft: 4 }}>
                    de @{log.user}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  color: logTypeColor(log.type),
                }}
              >
                {logTypeLabel(log.type)}
              </span>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: 'var(--ink-4)',
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
            <IconZap /> Démarrer
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
            color: 'var(--ink-2)',
          }}
        >
          EN COURS · VÉRIFICATION TOUTES LES {config.checkInterval} MIN
        </div>
      )}
    </div>
  );
}
