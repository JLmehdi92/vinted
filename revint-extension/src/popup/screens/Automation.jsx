import React, { useState, useEffect } from 'react';
import Toggle from '../components/Toggle';
import { IconZap, IconPlus, IconChev, IconChevD } from '../components/Icons';

const DEFAULT_TEMPLATE =
  "Bonjour {{prenom}} ! Merci pour votre intérêt sur mon article ❤️\n\nIl est toujours dispo. Je fais un petit geste si vous prenez 2 pieces ou plus dans mon dressing. Bonne journée !";

const VARIABLES = ['{{prenom}}', '{{article}}', '{{prix}}', '{{marque}}', '{{reduction}}'];

const DEFAULT_CONFIG = {
  enabled: true,
  template: DEFAULT_TEMPLATE,
  delayMin: 5,
  delayMax: 15,
  dailyLimit: 30,
  ignoreRecent: true,
  noDuplicates: true,
  // New fields
  mode: 'live',
  timeRange: 'new_only',
  sendDiscount: false,
  discountPercent: 10,
  ignoredUsers: '',
  skipUsersWithoutRatings: false,
  minUserRating: 0,
  limitPerItem: false,
  maxPerItem: 10,
  limitPerUser: false,
  maxPerUser: 3,
  daysBeforeResend: 7,
};

/* ── Collapsible section ── */
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        className="sec-head"
        style={{
          padding: '4px 0 8px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="sec-title" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-flex',
              transition: 'transform 0.15s',
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          >
            <IconChevD />
          </span>
          {title}
        </div>
      </div>
      {open && children}
    </div>
  );
}

/* ── Inline row for settings ── */
function SettingRow({ label, note, children, borderBottom = true }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: borderBottom ? '1px solid var(--ext-line)' : 'none',
      }}
    >
      <div style={{ flex: 1, fontSize: 12 }}>
        <div>{label}</div>
        {note && (
          <div
            style={{
              fontSize: 9,
              color: 'var(--ext-fg-4)',
              fontFamily: 'var(--mono)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            {note}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Small select ── */
const selectStyle = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  padding: '2px 6px',
  border: '1px solid var(--ext-line)',
  borderRadius: 'var(--r-sm)',
  background: 'var(--ext-surface)',
  color: 'var(--ext-fg-3)',
  cursor: 'pointer',
};

/* ── Small number input ── */
const numInputStyle = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  padding: '2px 6px',
  border: '1px solid var(--ext-line)',
  borderRadius: 'var(--r-sm)',
  background: 'var(--ext-surface)',
  color: 'var(--ext-fg-3)',
  width: 48,
  textAlign: 'center',
};

/* ── Mode chip button ── */
function ModeChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: 20,
        border: '1px solid',
        borderColor: active ? 'var(--gold)' : 'var(--ext-line-strong)',
        background: active ? 'var(--gold-wash)' : 'transparent',
        color: active ? 'var(--ext-fg)' : 'var(--ext-fg-4)',
        cursor: 'pointer',
        transition: 'all 0.12s',
        lineHeight: 1.5,
      }}
    >
      {label}
    </button>
  );
}

export default function Automation() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [sentToday, setSentToday] = useState(0);

  // Read today's auto-reply count
  useEffect(() => {
    chrome.storage.local
      .get('revint_auto_reply_daily')
      .then((result) => {
        const counter = result.revint_auto_reply_daily;
        const today = new Date().toISOString().slice(0, 10);
        if (counter && counter.date === today) {
          setSentToday(counter.count || 0);
        }
      })
      .catch(() => {});
  }, []);

  // Load config from chrome.storage on mount
  useEffect(() => {
    chrome.storage.local.get('revint_auto_reply').then((result) => {
      if (result.revint_auto_reply) {
        setConfig((prev) => ({ ...prev, ...result.revint_auto_reply }));
      }
    });
  }, []);

  // Persist config changes
  const updateConfig = (patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      chrome.storage.local.set({ revint_auto_reply: next });
      return next;
    });
  };

  const textareaRef = React.useRef(null);

  const insertVariable = (variable) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart ?? config.template.length;
      const end = el.selectionEnd ?? start;
      const before = config.template.slice(0, start);
      const after = config.template.slice(end);
      const newTemplate = before + variable + after;
      updateConfig({ template: newTemplate });
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + variable.length;
        el.focus();
      });
    } else {
      updateConfig({ template: config.template + variable });
    }
  };

  // Build preview text
  const previewText = config.template
    .replace(/\{\{prenom\}\}/g, 'Marion')
    .replace(/\{\{article\}\}/g, 'Sneakers Nike Air Max 90')
    .replace(/\{\{prix\}\}/g, '75€')
    .replace(/\{\{marque\}\}/g, 'Nike')
    .replace(/\{\{reduction\}\}/g, `${config.discountPercent}%`);

  return (
    <div style={{ padding: 14 }}>
      {/* ═══ Main toggle card ═══ */}
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
          <IconZap />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Réponse auto aux favoris</div>
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
              ? `ACTIF · ${sentToday} envoyé${sentToday !== 1 ? 's' : ''} aujourd'hui`
              : 'DÉSACTIVÉ'}
          </div>
        </div>
        <Toggle on={config.enabled} onClick={() => updateConfig({ enabled: !config.enabled })} />
      </div>

      {/* ═══ Template section ═══ */}
      <Section title="Template du message">
        <textarea
          ref={textareaRef}
          className="inp"
          value={config.template}
          onChange={(e) => updateConfig({ template: e.target.value })}
          rows={6}
          style={{ fontFamily: 'var(--sans)', fontSize: 12, marginBottom: 8 }}
        />

        {/* Variable insert buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          {VARIABLES.map((v) => (
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
              onClick={() => insertVariable(v)}
            >
              + {v}
            </button>
          ))}
        </div>

        {/* Preview card */}
        <div className="sec-head" style={{ padding: '0 0 8px' }}>
          <div className="sec-title">Aperçu</div>
        </div>
        <div
          style={{
            background: 'var(--ext-surface)',
            border: '1px solid var(--ext-line)',
            borderRadius: 'var(--r)',
            padding: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: '1px solid var(--ext-line)',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--ext-bg-3)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--mono)',
                fontSize: 9,
                color: 'var(--ext-fg-3)',
              }}
            >
              MK
            </div>
            <div style={{ flex: 1, fontSize: 11 }}>
              <b style={{ fontWeight: 500 }}>@marion_k</b> a mis en favori
              <div style={{ fontSize: 10, color: 'var(--ext-fg-4)' }}>
                Sneakers Nike Air Max 90 &middot; il y a 4 min
              </div>
            </div>
            <span className="chip gold dot" style={{ fontSize: 8 }}>
              AUTO
            </span>
          </div>
          <div
            style={{
              background: 'var(--ext-bg-2)',
              padding: 10,
              borderRadius: 'var(--r-sm)',
              fontSize: 11.5,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: 'var(--ext-fg)',
            }}
          >
            {previewText}
          </div>
        </div>
      </Section>

      {/* ═══ Mode & Timing section (NEW) ═══ */}
      <Section title="Mode & timing">
        <div className="card">
          <SettingRow label="Mode de traitement" note="Live = temps réel, Backlog = historique">
            <div style={{ display: 'flex', gap: 4 }}>
              <ModeChip
                label="Live"
                active={config.mode === 'live'}
                onClick={() => updateConfig({ mode: 'live', timeRange: 'new_only' })}
              />
              <ModeChip
                label="Backlog"
                active={config.mode === 'backlog'}
                onClick={() => updateConfig({ mode: 'backlog' })}
              />
            </div>
          </SettingRow>

          {config.mode === 'backlog' && (
            <SettingRow label="Période à traiter" borderBottom={false}>
              <select
                style={selectStyle}
                value={config.timeRange}
                onChange={(e) => updateConfig({ timeRange: e.target.value })}
              >
                <option value="2h">2 heures</option>
                <option value="6h">6 heures</option>
                <option value="12h">12 heures</option>
                <option value="1d">1 jour</option>
                <option value="3d">3 jours</option>
                <option value="7d">7 jours</option>
              </select>
            </SettingRow>
          )}

          {config.mode === 'live' && (
            <SettingRow label="Période" borderBottom={false}>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ext-fg-4)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Nouvelles notifs uniquement
              </span>
            </SettingRow>
          )}
        </div>
      </Section>

      {/* ═══ Discount section (NEW) ═══ */}
      <Section title="Réduction automatique" defaultOpen={false}>
        <div className="card">
          <SettingRow label="Envoyer une offre de réduction" note="Propose un rabais après le message">
            <Toggle
              on={config.sendDiscount}
              onClick={() => updateConfig({ sendDiscount: !config.sendDiscount })}
            />
          </SettingRow>

          {config.sendDiscount && (
            <SettingRow label="Pourcentage de réduction" borderBottom={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={config.discountPercent}
                  onChange={(e) =>
                    updateConfig({ discountPercent: parseInt(e.target.value) })
                  }
                  style={{ width: 60, accentColor: 'var(--gold)', cursor: 'pointer' }}
                />
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: 'var(--ext-fg)',
                    fontWeight: 600,
                    minWidth: 30,
                    textAlign: 'right',
                  }}
                >
                  {config.discountPercent}%
                </span>
              </div>
            </SettingRow>
          )}
        </div>
      </Section>

      {/* ═══ User filters section (NEW) ═══ */}
      <Section title="Filtres utilisateurs" defaultOpen={false}>
        <div className="card">
          {/* Ignored users */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--ext-line)' }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Utilisateurs ignorés</div>
            <textarea
              className="inp"
              value={config.ignoredUsers}
              onChange={(e) => updateConfig({ ignoredUsers: e.target.value })}
              rows={2}
              placeholder="user1, user2, user3..."
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                resize: 'vertical',
                minHeight: 36,
              }}
            />
            <div
              style={{
                fontSize: 9,
                color: 'var(--ext-fg-4)',
                fontFamily: 'var(--mono)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              Séparés par des virgules
            </div>
          </div>

          {/* Skip users without ratings */}
          <SettingRow label="Ignorer sans avis" note="Exclure les profils sans évaluation">
            <Toggle
              on={config.skipUsersWithoutRatings}
              onClick={() =>
                updateConfig({ skipUsersWithoutRatings: !config.skipUsersWithoutRatings })
              }
            />
          </SettingRow>

          {/* Min user rating */}
          <SettingRow label="Note vendeur minimum" borderBottom={false}>
            <select
              style={selectStyle}
              value={config.minUserRating}
              onChange={(e) => updateConfig({ minUserRating: parseInt(e.target.value) })}
            >
              <option value={0}>Pas de min.</option>
              <option value={1}>1 étoile</option>
              <option value={2}>2 étoiles</option>
              <option value={3}>3 étoiles</option>
              <option value={4}>4 étoiles</option>
              <option value={5}>5 étoiles</option>
            </select>
          </SettingRow>
        </div>
      </Section>

      {/* ═══ Limits section (NEW) ═══ */}
      <Section title="Limites" defaultOpen={false}>
        <div className="card">
          {/* Limit per item */}
          <SettingRow label="Limite par article" note="Max messages par article unique">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {config.limitPerItem && (
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={config.maxPerItem}
                  onChange={(e) =>
                    updateConfig({ maxPerItem: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  style={numInputStyle}
                />
              )}
              <Toggle
                on={config.limitPerItem}
                onClick={() => updateConfig({ limitPerItem: !config.limitPerItem })}
              />
            </div>
          </SettingRow>

          {/* Limit per user */}
          <SettingRow label="Limite par utilisateur" note="Max messages par utilisateur">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {config.limitPerUser && (
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={config.maxPerUser}
                  onChange={(e) =>
                    updateConfig({ maxPerUser: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  style={numInputStyle}
                />
              )}
              <Toggle
                on={config.limitPerUser}
                onClick={() => updateConfig({ limitPerUser: !config.limitPerUser })}
              />
            </div>
          </SettingRow>

          {/* Days before re-send */}
          <SettingRow label="Jours avant re-message" note="Délai avant de recontacter un utilisateur" borderBottom={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min={1}
                max={30}
                value={config.daysBeforeResend}
                onChange={(e) =>
                  updateConfig({ daysBeforeResend: Math.max(1, parseInt(e.target.value) || 1) })
                }
                style={numInputStyle}
              />
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  color: 'var(--ext-fg-4)',
                  letterSpacing: '0.04em',
                }}
              >
                j
              </span>
            </div>
          </SettingRow>
        </div>
      </Section>

      {/* ═══ Conditions d'envoi section (existing, enhanced) ═══ */}
      <Section title="Conditions d'envoi">
        <div className="card">
          <SettingRow label="Délai avant envoi" note="Aléatoire, semble humain">
            <select
              style={selectStyle}
              value={`${config.delayMin}-${config.delayMax}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number);
                updateConfig({ delayMin: min, delayMax: max });
              }}
            >
              <option value="1-5">1-5 min</option>
              <option value="3-10">3-10 min</option>
              <option value="5-15">5-15 min</option>
              <option value="10-30">10-30 min</option>
            </select>
          </SettingRow>

          <SettingRow label="Max par jour">
            <select
              style={selectStyle}
              value={config.dailyLimit || 30}
              onChange={(e) => updateConfig({ dailyLimit: parseInt(e.target.value) })}
            >
              <option value="10">10 messages</option>
              <option value="20">20 messages</option>
              <option value="30">30 messages</option>
              <option value="50">50 messages</option>
            </select>
          </SettingRow>

          <SettingRow label="Ignorer si favori < 24h">
            <Toggle
              on={config.ignoreRecent}
              onClick={() => updateConfig({ ignoreRecent: !config.ignoreRecent })}
            />
          </SettingRow>

          <SettingRow label="Ne pas envoyer 2x" borderBottom={false}>
            <Toggle
              on={config.noDuplicates}
              onClick={() => updateConfig({ noDuplicates: !config.noDuplicates })}
            />
          </SettingRow>
        </div>
      </Section>
    </div>
  );
}
