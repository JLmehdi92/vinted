import { useState, useEffect, useMemo } from 'react';

export default function useStats(articles) {
  const [snapshots, setSnapshots] = useState({});

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'revint:getSnapshots' })
      .then(res => setSnapshots(res?.snapshots || {}))
      .catch(e => console.warn('[useStats] snapshots fetch failed:', e));
  }, []);

  return useMemo(() => {
    const totalItems = articles?.length || 0;
    const totalViews = (articles || []).reduce((s, a) => s + (a.view_count ?? a.views ?? 0), 0);
    const totalFavs = (articles || []).reduce((s, a) => s + (a.favourite_count ?? a.favs ?? 0), 0);

    const topArticles = [...(articles || [])]
      .sort((a, b) => (b.view_count ?? b.views ?? 0) - (a.view_count ?? a.views ?? 0))
      .slice(0, 4);

    const dates = Object.keys(snapshots).sort();
    let viewData = [];
    if (dates.length >= 2) {
      const recent = dates.slice(-15); // 15 snapshots → 14 deltas
      for (let i = 1; i < recent.length; i++) {
        const prev = snapshots[recent[i - 1]]?.totals?.views || 0;
        const curr = snapshots[recent[i]]?.totals?.views || 0;
        viewData.push(Math.max(0, curr - prev));
      }
    }

    // Surface whether the chart is real or we don't have enough data yet.
    // The UI uses this flag to show a clear "not enough data" state instead
    // of a fake sine-wave curve that looks like real stats.
    const isEstimate = viewData.length === 0;
    viewData = viewData.slice(-14);

    const last7 = viewData.slice(-7).reduce((s, v) => s + v, 0);
    const prev7 = viewData.slice(0, 7).reduce((s, v) => s + v, 0);
    const deltaPercent = prev7 > 0 ? ((last7 - prev7) / prev7 * 100).toFixed(1) : null;

    return { totalItems, totalViews, totalFavs, topArticles, viewData, deltaPercent, isEstimate };
  }, [articles, snapshots]);
}
