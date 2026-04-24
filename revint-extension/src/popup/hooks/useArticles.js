import { useState, useEffect, useCallback, useRef } from 'react';

const STALE_DAYS = 21;
const HOT_VIEWS = 500;
const HOT_FAVS = 30;
const STALE_MAX_VIEWS = 200;
const PER_PAGE = 96;

// Vinted's API returns created_at_ts as a Unix SECONDS timestamp (small
// numbers). new Date(number) expects milliseconds, so the raw value would be
// interpreted as 1970-01-20 and every article would be classified "stale".
function parseCreatedAt(article) {
  const ts = article.created_at_ts;
  if (typeof ts === 'number') return new Date(ts < 1e12 ? ts * 1000 : ts);
  return new Date(article.created_at ?? 0);
}

export function classifyArticle(article) {
  const views = article.view_count ?? article.views ?? 0;
  const favs = article.favourite_count ?? article.favs ?? 0;
  const createdAt = parseCreatedAt(article);
  const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (views > HOT_VIEWS || favs > HOT_FAVS) return 'hot';
  if (ageDays > STALE_DAYS && views < STALE_MAX_VIEWS) return 'stale';
  return 'active';
}

export default function useArticles(connected) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const pageRef = useRef(1);

  const loadPage = useCallback(async (page, append) => {
    const data = await chrome.runtime.sendMessage({
      type: 'revint:getItems', page, perPage: PER_PAGE,
    });
    if (data?.error) throw new Error(data.error);
    const items = Array.isArray(data?.items) ? data.items : [];
    const pagination = data?.pagination;
    const more = pagination ? pagination.current_page < pagination.total_pages : items.length >= PER_PAGE;
    setArticles(prev => append ? [...prev, ...items] : items);
    setHasMore(more);
    return items.length;
  }, []);

  const fetchArticles = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setError(null);
    pageRef.current = 1;
    try {
      await loadPage(1, false);
    } catch (e) {
      console.error('[useArticles] fetch error:', e);
      setArticles([]);
      setHasMore(false);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [connected, loadPage]);

  const fetchMore = useCallback(async () => {
    if (!connected || !hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const count = await loadPage(nextPage, true);
      if (count === 0) setHasMore(false);
      else pageRef.current = nextPage;
    } catch (e) {
      console.error('[useArticles] fetchMore error:', e);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [connected, hasMore, loadingMore, loadPage]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const filteredArticles = articles.filter((article) => {
    if (filter !== 'all' && classifyArticle(article) !== filter) return false;
    if (query) {
      const title = (article.title || '').toLowerCase();
      if (!title.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const toggleSelect = useCallback((id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }, []);

  const selectAll = useCallback(() => {
    setSelected(filteredArticles.map(a => a.id));
  }, [filteredArticles]);

  const clearSelection = useCallback(() => { setSelected([]); }, []);

  return {
    articles, filteredArticles, loading, loadingMore, hasMore, fetchMore,
    selected, toggleSelect, selectAll, clearSelection,
    filter, setFilter, query, setQuery, error, refresh: fetchArticles,
  };
}
