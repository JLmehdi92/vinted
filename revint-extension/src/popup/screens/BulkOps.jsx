import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { IconEye, IconEdit, IconHeart, IconBoost } from '../components/Icons';

const PRICE_ACTIONS = [
  { id: 'decrease', label: 'Baisser' },
  { id: 'increase', label: 'Augmenter' },
  { id: 'set', label: 'Fixer' },
];

const PRICE_TYPES = [
  { id: 'percent', label: '%' },
  { id: 'amount', label: '€' },
];

const ROUNDING_OPTIONS = [
  { id: 'none', label: 'Aucun' },
  { id: 'cents10', label: '10 centimes' },
  { id: 'unit', label: 'Unité' },
];

const TEXT_FIELDS = [
  { id: 'title', label: 'Titre' },
  { id: 'description', label: 'Description' },
];

const TEXT_ACTIONS = [
  { id: 'replace', label: 'Remplacer' },
  { id: 'prepend', label: 'Ajouter au début' },
  { id: 'append', label: 'Ajouter à la fin' },
];

export default function BulkOps({ onBack, articles }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);

  // Price state
  const [priceAction, setPriceAction] = useState('decrease');
  const [priceValue, setPriceValue] = useState('');
  const [priceType, setPriceType] = useState('percent');
  const [rounding, setRounding] = useState('none');

  // Text state
  const [textField, setTextField] = useState('title');
  const [textAction, setTextAction] = useState('replace');
  const [textValue, setTextValue] = useState('');

  // Load selected items from storage
  useEffect(() => {
    chrome.storage.local.get('revint_selected_items').then((res) => {
      if (res.revint_selected_items) {
        setSelectedIds(res.revint_selected_items);
      }
    }).catch(() => {});

    const listener = (changes) => {
      if (changes.revint_selected_items) {
        setSelectedIds(changes.revint_selected_items.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Listen for bulk operation progress
  useEffect(() => {
    const listener = (changes) => {
      if (changes.revint_bulk_progress) {
        const p = changes.revint_bulk_progress.newValue;
        setProgress(p);
        if (p?.status === 'complete') {
          setRunning(false);
          setResult(p);
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const count = selectedIds.length;

  const startOp = async (type, payload) => {
    if (count === 0) return;
    setRunning(true);
    setResult(null);
    setProgress({ total: count, done: 0, status: 'running' });
    try {
      const res = await chrome.runtime.sendMessage({
        type,
        itemIds: selectedIds,
        ...payload,
      });
      if (res?.error) throw new Error(res.error);
      if (res?.results) {
        const p = { total: count, done: count, status: 'complete', results: res.results };
        setProgress(p);
        setResult(p);
        setRunning(false);
      }
    } catch (e) {
      setRunning(false);
      setProgress(null);
      setResult({ error: e.message });
    }
  };

  const handleHide = (isHidden) => {
    startOp('revint:bulkHide', { isHidden });
  };

  const handlePrice = () => {
    const val = parseFloat(priceValue);
    if (isNaN(val) || val <= 0) return;
    startOp('revint:bulkPrice', {
      action: priceAction,
      value: val,
      valueType: priceType,
      rounding,
    });
  };

  const handleText = () => {
    if (!textValue.trim()) return;
    startOp('revint:bulkText', {
      field: textField,
      action: textAction,
      value: textValue,
    });
  };

  const handleFollow = (action) => {
    startOp('revint:bulkFollow', { action });
  };

  const dismissResult = () => setResult(null);

  const selectStyle = {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    padding: '6px 8px',
    border: '1px solid var(--ext-line-strong)',
    borderRadius: 'var(--r-sm)',
    background: 'var(--ext-surface)',
    color: 'var(--ext-fg-3)',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <>
      <Header title="Opérations en masse" onBack={onBack} />
      <div className="ext-main">
        <div style={{ padding: 14 }}>
          {/* Selection count */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ext-fg-4)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            {count} ARTICLE{count !== 1 ? 'S' : ''} SÉLECTIONNÉ{count !== 1 ? 'S' : ''}
          </div>

          {/* Progress bar */}
          {running && progress && progress.status === 'running' && (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                background: 'var(--ext-bg-2)',
                border: '1px solid var(--ext-line)',
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
                  background: 'var(--ext-line)',
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

          {/* Result summary */}
          {result && !running && (
            <div
              style={{
                marginBottom: 14,
                padding: 12,
                background: result.error ? 'rgba(184,58,58,0.08)' : 'var(--gold-wash)',
                border: `1px solid ${result.error ? 'var(--danger)' : 'var(--gold)'}`,
                borderRadius: 'var(--r)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                {result.error ? (
                  <span style={{ color: 'var(--danger)' }}>{result.error}</span>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Opération terminée</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-3)' }}>
                      {result.results ? `${result.results.filter(r => r.success).length}/${result.results.length} réussis` : `${result.done}/${result.total} traités`}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={dismissResult}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ext-fg-4)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* ── Section: Visibilité ── */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="sec-head">
              <div className="sec-title">Visibilité</div>
              <IconEye style={{ color: 'var(--ext-fg-4)' }} />
            </div>
            <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={running || count === 0}
                onClick={() => handleHide(true)}
              >
                Masquer ({count})
              </button>
              <button
                className="btn btn-sm btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={running || count === 0}
                onClick={() => handleHide(false)}
              >
                Rendre visible ({count})
              </button>
            </div>
          </div>

          {/* ── Section: Prix ── */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="sec-head">
              <div className="sec-title">Prix</div>
              <IconBoost style={{ color: 'var(--ext-fg-4)' }} />
            </div>
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {PRICE_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    className={`btn btn-sm${priceAction === a.id ? ' btn-primary' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setPriceAction(a.id)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                <input
                  className="inp tabular"
                  type="text"
                  placeholder="Valeur"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value.replace(',', '.'))}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--display)',
                    fontWeight: 700,
                    fontSize: 16,
                    letterSpacing: '-0.3px',
                  }}
                />
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                  style={selectStyle}
                >
                  {PRICE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: 'var(--ext-fg-4)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Arrondi :
                </span>
                <select
                  value={rounding}
                  onChange={(e) => setRounding(e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}
                >
                  {ROUNDING_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-gold btn-sm btn-full"
                disabled={running || count === 0 || !priceValue}
                onClick={handlePrice}
              >
                Appliquer le prix ({count})
              </button>
            </div>
          </div>

          {/* ── Section: Texte ── */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="sec-head">
              <div className="sec-title">Texte</div>
              <IconEdit style={{ color: 'var(--ext-fg-4)' }} />
            </div>
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {TEXT_FIELDS.map((f) => (
                  <button
                    key={f.id}
                    className={`btn btn-sm${textField === f.id ? ' btn-primary' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setTextField(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 10 }}>
                <select
                  value={textAction}
                  onChange={(e) => setTextAction(e.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  {TEXT_ACTIONS.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>
              <input
                className="inp"
                placeholder={textAction === 'replace' ? 'Nouveau texte…' : 'Texte à ajouter…'}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <button
                className="btn btn-gold btn-sm btn-full"
                disabled={running || count === 0 || !textValue.trim()}
                onClick={handleText}
              >
                Appliquer ({count})
              </button>
            </div>
          </div>

          {/* ── Section: Suivi ── */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="sec-head">
              <div className="sec-title">Suivi</div>
              <IconHeart style={{ color: 'var(--ext-fg-4)' }} />
            </div>
            <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm btn-gold"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={running}
                onClick={() => handleFollow('followBack')}
              >
                Follow back mes followers
              </button>
              <button
                className="btn btn-sm btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={running}
                onClick={() => handleFollow('unfollowAll')}
              >
                Unfollow all
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
