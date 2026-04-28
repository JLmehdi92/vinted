import React, { useMemo, useState, useEffect } from 'react';
import StatTile from '../components/StatTile';
import { IconBoost, IconZap } from '../components/Icons';

function formatDate() {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} \u00b7 ${hh}h${mm}`;
}


export default function Dashboard({ user, articles, go }) {
  const allItems = articles?.articles || [];

  const [activity, setActivity] = useState([]);
  const [autoCount, setAutoCount] = useState(0);
  const [sales, setSales] = useState(null);

  // Read today's auto-reply count
  useEffect(() => {
    chrome.storage.local.get('revint_auto_reply_daily').then(result => {
      const counter = result.revint_auto_reply_daily;
      const today = new Date().toISOString().slice(0, 10);
      if (counter && counter.date === today) {
        setAutoCount(counter.count || 0);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'revint:getNotifications', page: 1 })
      .then(res => {
        const notifs = res?.notifications || [];

        // Count sales from notifications
        const salesCount = notifs.filter(n =>
          n.body?.includes('vendu') || n.body?.includes('sold') || n.body?.includes('achet')
        ).length;
        setSales(salesCount);

        const parsed = notifs.slice(0, 5).map(n => {
          // Parse type from link/body
          let type = 'Notification';
          if (n.link?.includes('offering_id')) type = 'Favori';
          else if (n.link?.includes('/inbox/')) type = 'Message';
          else if (n.body?.includes('vendu') || n.body?.includes('sold')) type = 'Vendu';

          // Extract username from body HTML
          const nameMatch = n.body?.match(/>([^<]+)<\/a>/);
          const who = nameMatch ? '@' + nameMatch[1] : '';

          // Extract time
          const time = n.timestamp ? new Date(n.timestamp * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

          // Extract article name (text after the link)
          const artMatch = n.body?.match(/<\/a>\s*(.+)/);
          const art = artMatch ? artMatch[1].replace(/<[^>]*>/g, '').trim() : '';

          return { t: time, e: type, who, art, auto: type === 'Favori' };
        });
        if (parsed.length > 0) setActivity(parsed);
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const active = allItems.length;
    const views = allItems.reduce((s, a) => s + (a.view_count ?? a.views ?? 0), 0);
    const favs = allItems.reduce((s, a) => s + (a.favourite_count ?? a.favs ?? 0), 0);
    return { active, views, favs };
  }, [allItems]);

  const login = user?.login || 'vendeur';

  return (
    <div style={{ padding: '14px 14px 16px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--ext-fg-4)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {formatDate()}
        </div>
        <div
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: -0.8,
            lineHeight: 1.15,
          }}
        >
          Bonjour <em>{login}</em>.
          <br />
          <span style={{ color: 'var(--ext-fg-3)' }}>{stats.active} articles en ligne.</span>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <StatTile label="Articles actifs" value={stats.active} />
        <StatTile
          label="Vues totales"
          value={stats.views.toLocaleString('fr-FR')}
        />
        <StatTile label="Favoris" value={stats.favs} />
        <StatTile label="Ventes / mois" value={sales !== null ? sales : '--'} />
      </div>

      {/* Quick actions */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Actions rapides</div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <button
          className="btn"
          style={{
            justifyContent: 'flex-start',
            padding: 12,
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 6,
            height: 'auto',
          }}
          onClick={() => { if (articles?.selected?.length > 0) go('repost'); else go('articles'); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-deep)' }}>
            <IconBoost />
          </div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Reposter articles</div>
          <div style={{ fontSize: 10, color: 'var(--ext-fg-4)', fontFamily: 'var(--mono)' }}>
            {articles?.selected?.length || 0} sélectionnés
          </div>
        </button>
        <button
          className="btn"
          style={{
            justifyContent: 'flex-start',
            padding: 12,
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 6,
            height: 'auto',
          }}
          onClick={() => go('automation')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-deep)' }}>
            <IconZap />
          </div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Auto-réponses</div>
          <div style={{ fontSize: 10, color: 'var(--ext-fg-4)', fontFamily: 'var(--mono)' }}>
            {autoCount} envoyée{autoCount !== 1 ? 's' : ''}
          </div>
        </button>
      </div>

      {/* Activity feed */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Activité récente</div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ext-fg-4)' }}>RECENT</span>
      </div>
      <div className="card" style={{ fontSize: 12 }}>
        {activity.length > 0 ? (
          activity.map((e, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              borderBottom: i < activity.length - 1 ? '1px solid var(--line)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ext-fg-4)',
                width: 36,
              }}
            >
              {e.t}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, color: 'var(--ext-fg-3)' }}>
                <b style={{ color: 'var(--ext-fg)', fontWeight: 500 }}>{e.e}</b> · {e.who}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--ext-fg-4)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {e.art}
              </div>
            </div>
            {e.auto && (
              <span className="chip gold" style={{ fontSize: 8 }}>
                AUTO
              </span>
            )}
          </div>
          ))
        ) : (
          <div style={{padding: '20px 14px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ext-fg-4)', letterSpacing: '0.08em'}}>
            Aucune activité récente
          </div>
        )}
      </div>
    </div>
  );
}
