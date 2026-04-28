import React, { useState } from 'react';
import Header from '../components/Header';
import { IconZap, IconTrash, IconPlus } from '../components/Icons';

export default function EditArticle({ article, onBack, onSave }) {
  const initialPrice = article.price_numeric ?? article.price ?? 0;
  const [price, setPrice] = useState(initialPrice);
  const [priceText, setPriceText] = useState(String(initialPrice));
  const [title, setTitle] = useState(article.title || '');
  const [desc, setDesc] = useState(article.description || '');

  const brand = article.brand_title ?? article.brand ?? '';
  const size = article.size_title ?? article.size ?? '—';
  const cat = article.catalog_title ?? article.cat ?? 'Categorie';
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

  const suggestedPrice = Math.max(1, price - 5);

  return (
    <>
      <Header
        title="Editer l'annonce"
        onBack={onBack}
        right={
          <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        }
      />
      <div className="ext-main">
        <div style={{ padding: 14 }}>
          {/* Photos row */}
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
            {/* Add photo button */}
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
                cursor: 'pointer',
              }}
              title="Modifier les photos sur Vinted"
              onClick={() => {
                if (article.url) window.open(article.url, '_blank');
              }}
            >
              <IconPlus />
            </div>
          </div>

          {/* Title input + counter */}
          <label className="label">Titre</label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              className="inp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
            <span style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: 'var(--mono)',
              fontSize: 9,
              color: 'var(--ink-4)',
              pointerEvents: 'none',
            }}>
              {title.length}/80
            </span>
          </div>

          {/* Price + Category — 2-column grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 14,
          }}>
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
              <label className="label">Categorie</label>
              <div
                className="inp"
                title="Non modifiable"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.7,
                  cursor: 'default',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                <span style={{
                  fontSize: 8,
                  color: 'var(--ink-4)',
                  fontFamily: 'var(--mono)',
                  flexShrink: 0,
                  marginLeft: 4,
                }}>LOCK</span>
              </div>
            </div>
          </div>

          {/* Suggestion ReVint */}
          <div
            className="card"
            style={{
              padding: '10px 12px',
              background: 'var(--gold-wash)',
              borderColor: 'var(--gold)',
              marginBottom: 14,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ color: 'var(--gold-deep)', paddingTop: 1, flexShrink: 0 }}>
              <IconZap />
            </div>
            <div style={{ fontSize: 11, flex: 1, color: 'var(--ink-2)', lineHeight: 1.45 }}>
              <b>Suggestion ReVint :</b> baissez a {suggestedPrice}&euro; pour entrer dans
              le top recherche.{' '}
              <u
                style={{ cursor: 'pointer', color: 'var(--gold-deep)', fontWeight: 600 }}
                onClick={() => {
                  setPrice(suggestedPrice);
                  setPriceText(String(suggestedPrice));
                }}
              >
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

          {/* Brand + Size — 2-column grid (readonly) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 14,
          }}>
            <div>
              <label className="label">Marque</label>
              <input
                className="inp"
                value={brand}
                readOnly
                title="Defini lors de la creation sur Vinted"
                style={{ opacity: 0.7, cursor: 'default' }}
              />
            </div>
            <div>
              <label className="label">Taille</label>
              <input
                className="inp"
                value={size}
                readOnly
                title="Defini lors de la creation sur Vinted"
                style={{ opacity: 0.7, cursor: 'default' }}
              />
            </div>
          </div>

          {/* Stats box */}
          <div style={{
            background: 'var(--cream-2)',
            padding: 12,
            borderRadius: 'var(--r)',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--ink-3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
              <span>PUBLIE IL Y A</span>
              <span className="tabular" style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{days} JOURS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
              <span>VUES</span>
              <span className="tabular" style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{views}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>FAVORIS</span>
              <span className="tabular" style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{favs}</span>
            </div>
          </div>

          {/* Save error banner */}
          {saveError && (
            <div style={{
              padding: '8px 12px',
              marginTop: 10,
              background: 'rgba(184,58,58,0.1)',
              color: 'var(--danger)',
              fontSize: 11,
              textAlign: 'center',
              borderRadius: 'var(--r)',
            }}>
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
