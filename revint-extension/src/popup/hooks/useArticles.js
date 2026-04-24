import { useState, useEffect, useCallback, useRef } from 'react';

const STALE_DAYS = 21;
const HOT_VIEWS = 500;
const HOT_FAVS = 30;
const STALE_MAX_VIEWS = 200;
const PER_PAGE = 96;

export function classifyArticle(article) {
  const views = article.view_count ?? article.views ?? 0;
  const favs = article.favourite_count ?? article.favs ?? 0;
  const createdAt = new Date(article.created_at_ts ?? article.created_at ?? 0);
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
  const pageRef = useRef(1);

  const fetchArticles = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    pageRef.current = 1;
    try {
      const data = await chrome.runtime.sendMessage({
        type: 'revint:getItems', page: 1, perPage: PER_PAGE,
      });
      const items = data?.items || [];
      const arr = Array.isArray(items) ? items : [];
      setArticles(arr);
      const pagination = data?.pagination;
      setHasMore(pagination ? pagination.current_page < pagination.total_pages : arr.length >= PER_PAGE);
    } catch (e) {
      console.error('[useArticles] fetch error:', e);
      setArticles([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [connected]);

  const fetchMore = useCallback(async () => {
    if (!connected || !hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const data = await chrome.runtime.sendMessage({
        type: 'revint:getItems', page: nextPage, perPage: PER_PAGE,
      });
      const items = data?.items || [];
      const arr = Array.isArray(items) ? items : [];
      if (arr.length === 0) {
        setHasMore(false);
      } else {
        pageRef.current = nextPage;
        setArticles(prev => [...prev, ...arr]);
        const pagination = data?.pagination;
        setHasMore(pagination ? pagination.current_page < pagination.total_pages : arr.length >= PER_PAGE);
      }
    } catch (e) {
      console.error('[useArticles] fetchMore error:', e);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [connected, hasMore, loadingMore]);

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
    filter, setFilter, query, setQuery, refresh: fetchArticles,
  };
}
