import React, { useState } from 'react';
import Header from '../components/Header';
import { IconZap, IconTrash } from '../components/Icons';

export default function EditArticle({ article, onBack, onSave }) {
  const initialPrice = article.price_numeric ?? article.price ?? 0;
  const [price, setPrice] = useState(initialPrice);
  const [priceText, setPriceText] = useState(String(initialPrice));
  const [title, setTitle] = useState(article.title || '');
  const [desc, setDesc] = useState(article.description || '');

  const brand = article.brand_title ?? article.brand ?? '';
  const size = article.size_title ?? article.size ?? '\u2014';
  const cat = article.catalog_title ?? article.cat ?? 'Catégorie';
  const views = article.view_count ?? article.views ?? 0;
  const favs = article.favourite_count ?? article.favs ?? 0;
  const photos = article.photos || [];
  const days = article.days ?? (() => {
    const created = article.created_at_ts ?? article.created_at;
    if (!created) return 0;
    return Math.floor((Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24));
  })();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const fields = { title, price, description: desc };
    try {
      await chrome.runtime.sendMessage({
        type: 'revint:updateItem',
        itemId: article.id,
        fields,
      });
      if (onSave) onSave(fields);
    } catch (e) {
      setSaveError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    chrome.runtime.sendMessage({
      type: 'revint:deleteItem',
      itemId: article.id,
    }).then(() => {
      if (onSave) onSave();
    }).catch((e) => {
      setSaveError('Erreur lors de la suppression : ' + (e.message || 'inconnue'));
      setConfirmDelete(false);
    });
  };

  return (
    <>
      <Header
        title="Éditer l'annonce"
        onBack={onBack}
        right={
          <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        }
      />
      <div className="ext-main">
        <div style={{ padding: 14 }}>
          {/* Photos */}
          <label className="label">Photos &middot; {photos.length}/20</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
            {(photos.length > 0 ? photos.slice(0, 4) : [1, 2, 3, 4]).map((p, i) => {
              const url =
                typeof p === 'object'
                  ? p.thumbnails?.[0]?.url || p.url || p.full_size_url
                  : null;
              return (
                <div
                  key={i}
                  className="art-thumb"
                  style={{ width: 60, height: 60, flexShrink: 0, fontSize: 9 }}
                >
                  {url ? (
                    <img
                      src={url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    `IMG ${i + 1}`
                  )}
                </div>
              );
            })}
            <div
              style={{
                width: 60,
                height: 60,
                border: '1px dashed var(--line-strong)',
                borderRadius: 'var(--r-sm)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink-4)',
                flexShrink: 0,
                fontSize: 8,
                fontFamily: 'var(--mono)',
                textAlign: 'center',
                padding: 4,
                opacity: 0.6,
              }}
            >
              Modifier sur Vinted
            </div>
          </div>

          {/* Title */}
          <label className="label">Titre</label>
          <input
            className="inp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            style={{ marginBottom: 4 }}
          />
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              color: 'var(--ink-4)',
              textAlign: 'right',
              marginBottom: 14,
            }}
          >
            {title.length}/80
          </div>

          {/* Price + Category */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div>
              <label className="label">Prix (&euro;)</label>
              <input
                className="inp tabular"
                type="text"
                value={priceText}
                onChange={(e) => {
                  const v = e.target.value.replace(',', '.');
                  setPriceText(v);
                  const n = parseFloat(v);
                  if (!isNaN(n)) setPrice(n);
                }}
                onBlur={() => {
                  setPriceText(String(price));
                }}
                style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: '-0.4px',
                }}
              />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <div
                title="Non modifiable"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--r)',
                  background: 'var(--ext-surface)',
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                {cat} <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>(non modifiable)</span>
              </div>
            </div>
          </div>

          {/* Suggestion box */}
          <div
            style={{
              padding: 10,
              background: 'var(--gold-wash)',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--r)',
              marginBottom: 14,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ color: 'var(--gold-deep)', paddingTop: 1 }}>
              <IconZap />
            </div>
            <div style={{ fontSize: 11, flex: 1, color: 'var(--ink-2)' }}>
              <b>Suggestion ReVint :</b> baissez a {Math.max(1, price - 5)}&euro; pour entrer dans
              le top recherche.{' '}
              <u style={{ cursor: 'pointer' }} onClick={() => { const np = Math.max(1, price - 5); setPrice(np); setPriceText(String(np)); }}>
                Appliquer
              </u>
            </div>
          </div>

          {/* Description */}
          <label className="label">Description</label>
          <textarea
            className="inp"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={5}
            style={{ marginBottom: 14 }}
          />

          {/* Brand + Size (read-only) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div>
              <label className="label">Marque</label>
              <input className="inp" value={brand} readOnly title="Défini lors de la création sur Vinted" style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label className="label">Taille</label>
              <input className="inp" value={size} readOnly title="Défini lors de la création sur Vinted" style={{ opacity: 0.7 }} />
            </div>
          </div>

          {/* Stats bar */}
          <div
            style={{
              background: 'var(--cream-2)',
              padding: 12,
              borderRadius: 'var(--r)',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span>PUBLIÉ IL Y A</span>
              <span className="tabular">{days} JOURS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span>VUES</span>
              <span className="tabular">{views}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span>FAVORIS</span>
              <span className="tabular">{favs}</span>
            </div>
          </div>
          {saveError && (
            <div style={{ padding: '8px 12px', marginTop: 10, background: 'rgba(184,58,58,0.1)', color: 'var(--danger)', fontSize: 11, textAlign: 'center', borderRadius: 'var(--r)' }}>
              {saveError}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="ext-footer">
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
          <IconTrash /> {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
        </button>
        {confirmDelete && (
          <button className="btn btn-sm" onClick={() => setConfirmDelete(false)}>
            Annuler
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={onBack}>
          Annuler
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>
    </>
  );
}
