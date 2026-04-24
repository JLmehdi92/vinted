import React, { useState, useEffect } from 'react';
import Toggle from '../components/Toggle';
import { IconZap, IconPlus, IconChev } from '../components/Icons';

const DEFAULT_TEMPLATE =
  "Bonjour ! Merci pour votre intérêt sur mon article \u2764\ufe0f\n\nIl est toujours dispo. Je fais un petit geste si vous prenez 2 pieces ou plus dans mon dressing. Bonne journée !";

const VARIABLES = ['{{prenom}}', '{{article}}', '{{prix}}', '{{marque}}'];

const DEFAULT_CONFIG = {
  enabled: true,
  template: DEFAULT_TEMPLATE,
  delayMin: 5,
  delayMax: 15,
  dailyLimit: 30,
  ignoreRecent: true,
  noDuplicates: true,
};

export default function Automation() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [sentToday, setSentToday] = useState(0);

  // Read today's auto-reply count
  useEffect(() => {
    chrome.storage.local.get('revint_auto_reply_daily').then(result => {
      const counter = result.revint_auto_reply_daily;
      const today = new Date().toISOString().slice(0, 10);
      if (counter && counter.date === today) {
        setSentToday(counter.count || 0);
      }
    }).catch(() => {});
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
      // Restore cursor position after React re-render
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
    .replace(/\{\{prix\}\}/g, '75\u20ac')
    .replace(/\{\{marque\}\}/g, 'Nike');

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
            {config.enabled ? `ACTIF \u00b7 ${sentToday} envoyé${sentToday !== 1 ? 's' : ''} aujourd'hui` : 'DÉSACTIVÉ'}
          </div>
        </div>
        <Toggle
          on={config.enabled}
          onClick={() => updateConfig({ enabled: !config.enabled })}
        />
      </div>

      {/* Template section */}
      <div className="sec-head" style={{ padding: '4px 0 8px' }}>
        <div className="sec-title">Template du message</div>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          textareaRef.current?.focus();
        }}>
          <IconPlus /> Variable
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="inp"
        value={config.template}
        onChange={(e) => updateConfig({ template: e.target.value })}
        rows={6}
        style={{ fontFamily: 'var(--sans)', fontSize: 12, marginBottom: 8 }}
      />

      {/* Variable insert buttons */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
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
          border: '1px solid var(--line)',
          borderRadius: 'var(--r)',
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--cream-3)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--mono)',
              fontSize: 9,
              color: 'var(--ink-3)',
            }}
          >
            MK
          </div>
          <div style={{ flex: 1, fontSize: 11 }}>
            <b style={{ fontWeight: 500 }}>@marion_k</b> a mis en favori
            <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>
              Sneakers Nike Air Max 90 &middot; il y a 4 min
            </div>
          </div>
          <span className="chip gold dot" style={{ fontSize: 8 }}>
            AUTO
          </span>
        </div>
        <div
          style={{
            background: 'var(--cream-2)',
            padding: 10,
            borderRadius: 'var(--r-sm)',
            fontSize: 11.5,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            color: 'var(--ink-2)',
          }}
        >
          {previewText}
        </div>
      </div>

      {/* Conditions */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Conditions d'envoi</div>
      </div>
      <div className="card">
        {[
          {
            label: 'Délai avant envoi',
            selectType: 'delay',
            note: 'Aléatoire, semble humain',
          },
          { label: 'Max par jour', selectType: 'dailyLimit' },
          { label: 'Ignorer si favori < 24h', toggle: true, key: 'ignoreRecent' },
          { label: 'Ne pas envoyer 2x', toggle: true, key: 'noDuplicates' },
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
            ) : s.selectType === 'delay' ? (
              <select
                style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 6px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', background: 'var(--ext-surface)', color: 'var(--ink-3)', cursor: 'pointer' }}
                value={`${config.delayMin}-${config.delayMax}`}
                onChange={e => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  updateConfig({ delayMin: min, delayMax: max });
                }}
              >
                <option value="1-5">1-5 min</option>
                <option value="3-10">3-10 min</option>
                <option value="5-15">5-15 min</option>
                <option value="10-30">10-30 min</option>
              </select>
            ) : s.selectType === 'dailyLimit' ? (
              <select
                style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 6px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', background: 'var(--ext-surface)', color: 'var(--ink-3)', cursor: 'pointer' }}
                value={config.dailyLimit || 30}
                onChange={e => updateConfig({ dailyLimit: parseInt(e.target.value) })}
              >
                <option value="10">10 messages</option>
                <option value="20">20 messages</option>
                <option value="30">30 messages</option>
                <option value="50">50 messages</option>
              </select>
            ) : (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                {s.val} <IconChev />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
