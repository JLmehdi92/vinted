import React from 'react';
import useStats from '../hooks/useStats';

export default function Stats({ articles }) {
  const { totalViews, totalFavs, topArticles, viewData, deltaPercent, isEstimate } = useStats(articles);

  const data = viewData && viewData.length > 0 ? viewData : new Array(14).fill(0);
  const max = Math.max(...data, 1);

  const displayViews = totalViews;
  const displayFavs = totalFavs;
  const displayTop = topArticles || [];

  // Funnel data — VUES and FAVORIS are real, MESSAGES and VENDUS are estimated
  const funnelMessages = Math.round(displayFavs * 0.29);
  const funnelSold = Math.round(funnelMessages * 0.22);
  const funnel = [
    { label: 'VUES', v: displayViews.toLocaleString('fr-FR'), w: 100, estimated: false },
    { label: 'FAVORIS', v: displayFavs.toLocaleString('fr-FR'), w: displayViews > 0 ? Math.round((displayFavs / displayViews) * 100) : 0, estimated: false },
    { label: 'MESSAGES', v: funnelMessages.toString(), w: displayViews > 0 ? Math.round((funnelMessages / displayViews) * 100) : 0, estimated: true },
    { label: 'VENDUS', v: funnelSold.toString(), w: displayViews > 0 ? Math.round((funnelSold / displayViews) * 100) : 0, estimated: true },
  ];

  return (
    <div style={{ padding: 14 }}>
      {/* ── Period label ── */}
      <div className="mono" style={{
        fontSize: 10,
        color: 'var(--ink-4)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 14,
      }}>
        14 derniers jours
      </div>

      {/* ── Bar chart card ── */}
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
        }}>
          <div>
            <div className="mono" style={{
              fontSize: 9,
              color: 'var(--ink-4)',
              letterSpacing: '0.1em',
            }}>
              VUES TOTALES
            </div>
            <div style={{
              fontFamily: 'var(--display)',
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: -1.2,
              lineHeight: 1,
            }}>
              {displayViews.toLocaleString('fr-FR')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{
              fontSize: 10,
              color: deltaPercent !== null && parseFloat(deltaPercent) >= 0
                ? 'var(--success)' : 'var(--danger)',
            }}>
              {deltaPercent !== null
                ? (parseFloat(deltaPercent) >= 0 ? '+' : '') + deltaPercent + '%'
                : '--'}
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>
              vs 14j précédents
            </div>
          </div>
        </div>

        {/* SVG bar chart */}
        {isEstimate ? (
          <div className="mono" style={{
            padding: '20px 8px',
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--ink-4)',
            letterSpacing: '0.08em',
          }}>
            Accumulez 2+ jours de snapshots pour voir la courbe de vues.
          </div>
        ) : (
          <svg viewBox="0 0 300 80" style={{ width: '100%', height: 80, display: 'block' }}>
            {data.map((v, i) => {
              const h = (v / max) * 60;
              const x = i * (300 / data.length);
              const w = 300 / data.length - 2;
              const last = i === data.length - 1;
              return (
                <rect
                  key={i}
                  x={x}
                  y={70 - h}
                  width={w}
                  height={h}
                  fill={last ? '#E8C547' : '#1A1D3A'}
                  rx={1}
                />
              );
            })}
            <line x1="0" y1="70" x2="300" y2="70" stroke="var(--ext-line)" strokeWidth="1" />
          </svg>
        )}
      </div>

      {/* ── Top articles ── */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Top articles</div>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>PAR VUES</span>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        {displayTop.length === 0 && (
          <div className="mono" style={{
            padding: '20px 14px',
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--ink-4)',
            letterSpacing: '0.08em',
          }}>
            Aucun article pour le moment
          </div>
        )}
        {displayTop.map((a, i) => {
          const views = a.view_count ?? a.views ?? 0;
          const favs = a.favourite_count ?? a.favs ?? 0;
          const price = a.price_numeric ?? a.price ?? 0;
          const brand = a.brand_title ?? a.brand ?? '';
          const title = a.title || '';
          const thumbUrl =
            a.photos?.[0]?.thumbnails?.[0]?.url || a.photos?.[0]?.url || null;

          return (
            <div
              key={a.id}
              style={{
                padding: '10px 12px',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                borderBottom: i < displayTop.length - 1 ? '1px solid var(--ext-line)' : 'none',
              }}
            >
              {/* Number */}
              <div className="mono" style={{
                fontSize: 11,
                color: 'var(--ink-4)',
                width: 18,
                fontWeight: 500,
                flexShrink: 0,
              }}>
                {i + 1}
              </div>

              {/* Thumbnail */}
              <div className="art-thumb" style={{ width: 32, height: 32, fontSize: 7, flexShrink: 0 }}>
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  brand.slice(0, 3).toUpperCase()
                )}
              </div>

              {/* Title + stats */}
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{
                  fontWeight: 500,
                  fontSize: 11,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {title}
                </div>
                <div className="mono" style={{
                  fontSize: 9,
                  color: 'var(--ink-4)',
                  marginTop: 2,
                }}>
                  {views} vues &middot; {favs} fav
                </div>
              </div>

              {/* Price */}
              <div style={{
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '-0.3px',
                flexShrink: 0,
              }}>
                {price}&euro;
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Conversion funnel ── */}
      <div className="sec-head" style={{ padding: '0 0 8px' }}>
        <div className="sec-title">Entonnoir de conversion</div>
      </div>
      <div style={{
        background: 'var(--ext-fg)',
        color: 'var(--ext-bg)',
        borderRadius: 'var(--r)',
        padding: 14,
        fontFamily: 'var(--mono)',
        fontSize: 11,
      }}>
        {funnel.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
            }}
          >
            <div style={{
              width: 70,
              opacity: 0.6,
              letterSpacing: '0.08em',
              fontSize: 9,
            }}>
              {r.label}
            </div>
            <div style={{
              flex: 1,
              height: 12,
              background: 'rgba(250,247,242,0.08)',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${r.w}%`,
                background: i === funnel.length - 1 ? 'var(--gold)' : 'var(--ext-bg)',
                borderRadius: 2,
              }} />
            </div>
            <div style={{ width: 50, textAlign: 'right' }}>
              {r.v}
              {r.estimated && (
                <div style={{ fontSize: 8, opacity: 0.5, fontStyle: 'italic' }}>estimé</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
