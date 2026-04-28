import React from 'react';
import { IconSearch, IconEye, IconHeart } from '../components/Icons';
import { classifyArticle } from '../hooks/useArticles';

const FILTER_CHIPS = [
  { id: 'all', label: 'Tous' },
  { id: 'hot', label: 'Hot' },
  { id: 'active', label: 'Actifs' },
  { id: 'stale', label: 'À booster' },
];

function statusChip(status) {
  if (status === 'hot') {
    return <span className="chip gold dot">Hot</span>;
  }
  if (status === 'stale') {
    return (
      <span className="chip dot" style={{ color: '#B83A3A' }}>
        Stale
      </span>
    );
  }
  return <span className="chip dot">Actif</span>;
}

function ArticleRow({ article, isSelected, onToggle, onClick }) {
  const views = article.view_count ?? article.views ?? 0;
  const favs = article.favourite_count ?? article.favs ?? 0;
  const price = article.price_numeric ?? article.price ?? 0;
  const brand = article.brand_title ?? article.brand ?? '';
  const size = article.size_title ?? article.size ?? '\u2014';
  const status = article.status ?? classifyArticle(article);
  const title = article.title || '';
  const thumbUrl =
    article.photos?.[0]?.thumbnails?.[0]?.url ||
    article.photos?.[0]?.url ||
    article.photo?.url ||
    null;

  return (
    <div
      className={`art-row${isSelected ? ' selected' : ''}`}
      onClick={() => onClick(article)}
    >
      <div
        className={`cb${isSelected ? ' checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(article.id);
        }}
      />
      <div className="art-thumb">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          'IMG'
        )}
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div className="art-meta-title">{title}</div>
        <div className="art-meta-sub">
          <span>{brand}</span>
          <span className="sep">&middot;</span>
          <span>T.{size}</span>
          <span className="sep">&middot;</span>
          {statusChip(status)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="art-price tabular">
          {typeof price === 'number' ? price : parseFloat(price) || 0}&euro;
        </div>
        <div
          style={{
            fontSize: 9,
            color: 'var(--ink-4)',
            fontFamily: 'var(--mono)',
            marginTop: 2,
            display: 'flex',
            gap: 6,
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <IconEye /> {views}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <IconHeart /> {favs}
          </span>
        </div>
      </div>
    </div>
  );
}

// Excel / Google Sheets interpret leading =, +, -, @, tab or CR in a cell
// as a formula. A title like "=CMD|\u2026" could trigger code execution when the
// CSV is opened. Prefix those with a single quote so the cell stays literal.
function csvEscape(value) {
  const s = String(value ?? '');
  const needsFormulaGuard = /^[=+\-@\t\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return `"${needsFormulaGuard ? "'" + escaped : escaped}"`;
}

function exportCSVFromArticles(items) {
  const headers = ['Titre', 'Prix', 'Marque', 'Taille', 'Vues', 'Favoris', 'Statut', 'URL'];
  const rows = items.map(a => [
    csvEscape(a.title || ''),
    csvEscape(a.price_numeric ?? a.price ?? ''),
    csvEscape(a.brand_title ?? a.brand ?? ''),
    csvEscape(a.size_title ?? a.size ?? ''),
    csvEscape(a.view_count ?? a.views ?? 0),
    csvEscape(a.favourite_count ?? a.favs ?? 0),
    csvEscape(classifyArticle(a)),
    csvEscape(a.url || ''),
  ].join(','));
  const csv = [headers.map(csvEscape).join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `revint-articles-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Articles({ articles, go }) {
  const {
    filteredArticles = [],
    articles: allArticles = [],
    selected = [],
    toggleSelect,
    filter = 'all',
    setFilter,
    query = '',
    setQuery,
    hasMore = false,
    fetchMore,
    loadingMore = false,
  } = articles || {};

  const totalCount = allArticles.length;

  const exportCSV = () => {
    const items = filteredArticles.length > 0 ? filteredArticles : allArticles;
    exportCSVFromArticles(items);
  };

  // Compute counts per filter
  const counts = {
    all: allArticles.length,
    hot: allArticles.filter((a) => classifyArticle(a) === 'hot').length,
    active: allArticles.filter((a) => classifyArticle(a) === 'active').length,
    stale: allArticles.filter((a) => classifyArticle(a) === 'stale').length,
  };

  return (
    <>
      {/* Search + Filters */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--ext-bg)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-4)',
            }}
          >
            <IconSearch />
          </span>
          <input
            className="inp"
            placeholder={`Rechercher parmi ${totalCount} articles\u2026`}
            style={{ paddingLeft: 28 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
          {FILTER_CHIPS.map((f) => (
            <button
              key={f.id}
              className={`chip${filter === f.id ? ' dark' : ''}`}
              style={{
                cursor: 'pointer',
                border: 'none',
                padding: '4px 10px',
                fontSize: 10,
                whiteSpace: 'nowrap',
              }}
              onClick={() => setFilter(f.id)}
            >
              {f.label}{' '}
              <span style={{ opacity: 0.6, marginLeft: 2 }}>{counts[f.id] || 0}</span>
            </button>
          ))}
          <button className="chip" onClick={exportCSV} style={{cursor:'pointer', border:'none', fontSize:10, whiteSpace:'nowrap', marginLeft:'auto'}}>
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Article list */}
      <div>
        {filteredArticles.map((a) => (
          <ArticleRow
            key={a.id}
            article={a}
            isSelected={selected.includes(a.id)}
            onToggle={toggleSelect}
            onClick={(article) => go('edit', article)}
          />
        ))}
      </div>
      {hasMore && (
        <div style={{ padding: 14, textAlign: 'center' }}>
          <button
            className="btn btn-sm"
            onClick={fetchMore}
            disabled={loadingMore}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loadingMore ? 'Chargement...' : "Charger plus d'articles"}
          </button>
        </div>
      )}
    </>
  );
}
