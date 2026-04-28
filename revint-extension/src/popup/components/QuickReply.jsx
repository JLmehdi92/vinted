import React, { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconClose, IconCheck, IconMsg } from './Icons';

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function QuickReply({ onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | templateId
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load templates from storage
  useEffect(() => {
    chrome.storage.local.get('revint_quick_replies').then((result) => {
      const data = result.revint_quick_replies || [];
      setTemplates(data);
    }).catch(() => {});
  }, []);

  // Persist templates
  const persist = (next) => {
    chrome.storage.local.set({ revint_quick_replies: next });
    setTemplates(next);
  };

  // Sort by usageCount descending
  const sorted = [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  const handleNew = () => {
    setEditing('new');
    setFormTitle('');
    setFormText('');
    setConfirmDelete(null);
  };

  const handleEdit = (tpl) => {
    setEditing(tpl.id);
    setFormTitle(tpl.title);
    setFormText(tpl.text);
    setConfirmDelete(null);
  };

  const handleCancel = () => {
    setEditing(null);
    setFormTitle('');
    setFormText('');
  };

  const handleSave = () => {
    const title = formTitle.trim();
    const text = formText.trim();
    if (!title || !text) return;

    if (editing === 'new') {
      const newTpl = {
        id: crypto.randomUUID(),
        title,
        text,
        usageCount: 0,
      };
      persist([...templates, newTpl]);
    } else {
      persist(
        templates.map((t) =>
          t.id === editing ? { ...t, title, text } : t
        )
      );
    }
    setEditing(null);
    setFormTitle('');
    setFormText('');
  };

  const handleDelete = (id) => {
    persist(templates.filter((t) => t.id !== id));
    setConfirmDelete(null);
    if (editing === id) {
      setEditing(null);
      setFormTitle('');
      setFormText('');
    }
  };

  const handleSelect = (tpl) => {
    if (!onSelect) return;
    // Increment usageCount
    const updated = templates.map((t) =>
      t.id === tpl.id ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t
    );
    persist(updated);
    onSelect(tpl.text);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--ext-bg)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--ext-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconMsg style={{ color: 'var(--gold)' }} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Réponses rapides</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {editing === null && (
            <button
              className="btn btn-sm btn-gold"
              onClick={handleNew}
            >
              <IconPlus /> Ajouter
            </button>
          )}
          {onClose && (
            <button
              className="ext-iconbtn"
              onClick={onClose}
              title="Fermer"
            >
              <IconClose />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Inline form for new/edit */}
        {editing !== null && (
          <div
            style={{
              padding: 14,
              borderBottom: '1px solid var(--ext-line)',
              background: 'var(--ext-bg-2)',
            }}
          >
            <label className="label">Titre</label>
            <input
              className="inp"
              placeholder="ex: Délai livraison"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <label className="label">Message</label>
            <textarea
              className="inp"
              placeholder="Bonjour @username ! Merci pour..."
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              rows={4}
              style={{ marginBottom: 6 }}
            />
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 9,
                color: 'var(--ext-fg-4)',
                letterSpacing: '0.05em',
                marginBottom: 10,
              }}
            >
              @username sera remplacé par le pseudo
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSave}
                disabled={!formTitle.trim() || !formText.trim()}
              >
                <IconCheck /> Enregistrer
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleCancel}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Template list */}
        {sorted.length === 0 && editing === null && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ext-fg-4)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Aucun modèle
            </div>
            <div style={{ fontSize: 12, color: 'var(--ext-fg-3)' }}>
              Créez votre premier modèle de réponse rapide.
            </div>
          </div>
        )}

        {sorted.map((tpl) => (
          <div
            key={tpl.id}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--ext-line)',
              cursor: onSelect ? 'pointer' : 'default',
              transition: 'background 0.1s',
            }}
            onClick={() => {
              if (onSelect && editing === null && confirmDelete !== tpl.id) {
                handleSelect(tpl);
              }
            }}
            onMouseEnter={(e) => {
              if (onSelect) e.currentTarget.style.background = 'var(--ext-bg-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Confirm delete inline */}
            {confirmDelete === tpl.id ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                }}
              >
                <span style={{ flex: 1, color: 'var(--danger)' }}>
                  Supprimer ce modèle ?
                </span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(tpl.id);
                  }}
                >
                  Supprimer
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ext-fg)' }}>
                    {tpl.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      className="chip"
                      style={{
                        fontSize: 8,
                        padding: '1px 6px',
                      }}
                    >
                      {tpl.usageCount || 0}x
                    </span>
                    <button
                      className="ext-iconbtn"
                      style={{ width: 22, height: 22 }}
                      title="Modifier"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(tpl);
                      }}
                    >
                      <IconEdit />
                    </button>
                    <button
                      className="ext-iconbtn"
                      style={{ width: 22, height: 22, color: 'var(--danger)' }}
                      title="Supprimer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(tpl.id);
                      }}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ext-fg-3)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {truncate(tpl.text, 80)}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
