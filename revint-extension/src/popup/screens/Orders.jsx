import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

// Excel / Google Sheets interpret leading =, +, -, @, tab or CR in a cell
// as a formula. Prefix those with a single quote so the cell stays literal.
function csvEscape(value) {
  const s = String(value ?? '');
  const needsFormulaGuard = /^[=+\-@\t\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return `"${needsFormulaGuard ? "'" + escaped : escaped}"`;
}

function statusChip(status) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  if (s === 'shipped' || s === 'envoyé' || s === 'expédié') {
    return (
      <span className="chip gold dot" style={{ fontSize: 8 }}>
        Expédié
      </span>
    );
  }
  if (s === 'delivered' || s === 'livré' || s === 'reçu') {
    return (
      <span className="chip dot" style={{ fontSize: 8, color: 'var(--success)' }}>
        Livré
      </span>
    );
  }
  if (s === 'cancelled' || s === 'annulé') {
    return (
      <span className="chip dot" style={{ fontSize: 8, color: 'var(--danger)' }}>
        Annulé
      </span>
    );
  }
  if (s === 'completed' || s === 'terminé') {
    return (
      <span className="chip dot" style={{ fontSize: 8, color: 'var(--success)' }}>
        Terminé
      </span>
    );
  }
  if (s === 'pending' || s === 'en attente') {
    return (
      <span className="chip dot" style={{ fontSize: 8 }}>
        En attente
      </span>
    );
  }
  return (
    <span className="chip dot" style={{ fontSize: 8 }}>
      {status}
    </span>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OrderRow({ order, onShipment, onFeedback }) {
  const thumbUrl =
    order.item?.photos?.[0]?.thumbnails?.[0]?.url ||
    order.item?.photos?.[0]?.url ||
    order.item?.photo?.url ||
    order.photo?.url ||
    null;
  const title = order.item?.title || order.title || 'Article';
  const price = order.item?.price || order.price || order.total || '—';
  const buyer = order.buyer?.login || order.buyer_login || '';
  const date = formatDate(order.created_at_ts || order.created_at || order.date);
  const status = order.status || order.transaction_status || '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr auto',
        gap: 10,
        padding: '10px 12px',
        alignItems: 'center',
        borderBottom: '1px solid var(--ext-line)',
        transition: 'background 0.1s',
      }}
    >
      {/* Thumbnail */}
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

      {/* Info */}
      <div style={{ overflow: 'hidden' }}>
        <div className="art-meta-title">{title}</div>
        <div className="art-meta-sub">
          <span>{buyer ? `@${buyer}` : ''}</span>
          {date && (
            <>
              <span className="sep">&middot;</span>
              <span>{date}</span>
            </>
          )}
          <span className="sep">&middot;</span>
          {statusChip(status)}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginTop: 6,
          }}
        >
          <button
            className="btn btn-sm btn-ghost"
            style={{ padding: '3px 7px', fontSize: 10 }}
            onClick={() => onShipment(order)}
          >
            Étiquette
          </button>
          <button
            className="btn btn-sm btn-ghost"
            style={{ padding: '3px 7px', fontSize: 10 }}
            onClick={() => onFeedback(order)}
          >
            Avis
          </button>
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'right' }}>
        <div className="art-price tabular">
          {typeof price === 'number' ? price : parseFloat(price) || price}&euro;
        </div>
      </div>
    </div>
  );
}

export default function Orders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async (p) => {
    const isFirst = p === 1;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'revint:getOrders',
        page: p,
        orderType: 'sold',
      });
      if (res?.error) throw new Error(res.error);
      const newOrders = res?.my_orders || res?.orders || [];
      if (isFirst) {
        setOrders(newOrders);
      } else {
        setOrders((prev) => [...prev, ...newOrders]);
      }
      setHasMore(newOrders.length >= 20);
      setPage(p);
    } catch (e) {
      setError(e.message || 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1);
    }
  };

  const handleShipment = async (order) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'revint:getShipmentLabel',
        shipmentId: order.shipment_id || order.shipment?.id || order.transaction_id || order.id,
      });
    } catch (e) {
      console.warn('[Orders] getShipmentLabel failed:', e);
    }
  };

  const handleFeedback = async (order) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'revint:leaveFeedback',
        orderId: order.id,
        transactionId: order.transaction_id || order.id,
      });
    } catch (e) {
      console.warn('[Orders] leaveFeedback failed:', e);
    }
  };

  const exportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Titre', 'Prix', 'Date', 'Acheteur', 'Transporteur', 'Suivi', 'Statut'];
    const rows = orders.map((o) =>
      [
        csvEscape(o.item?.title || o.title || ''),
        csvEscape(o.item?.price || o.price || o.total || ''),
        csvEscape(o.created_at_ts || o.created_at || o.date || ''),
        csvEscape(o.buyer?.login || o.buyer_login || ''),
        csvEscape(o.shipment?.carrier_name || o.carrier_name || ''),
        csvEscape(o.shipment?.tracking_code || o.tracking_code || ''),
        csvEscape(o.status || o.transaction_status || ''),
      ].join(',')
    );
    const csv = [headers.map(csvEscape).join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revint-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header
        title="Commandes"
        onBack={onBack}
        right={
          <button
            className="btn btn-sm"
            onClick={exportCSV}
            disabled={orders.length === 0}
            style={{ fontSize: 10 }}
          >
            Exporter CSV
          </button>
        }
      />
      <div className="ext-main">
        {/* Loading state */}
        {loading && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ext-fg-4)',
                letterSpacing: '0.1em',
              }}
            >
              CHARGEMENT...
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(184,58,58,0.08)',
              borderBottom: '1px solid var(--danger)',
              fontSize: 11,
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
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
              Aucune commande
            </div>
            <div style={{ fontSize: 12, color: 'var(--ext-fg-3)' }}>
              Vos ventes apparaitront ici une fois effectuées.
            </div>
          </div>
        )}

        {/* Orders list */}
        {!loading && orders.length > 0 && (
          <>
            {/* Count header */}
            <div
              style={{
                padding: '10px 14px 6px',
                fontFamily: 'var(--mono)',
                fontSize: 9,
                color: 'var(--ext-fg-4)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {orders.length} COMMANDE{orders.length !== 1 ? 'S' : ''} CHARGÉE{orders.length !== 1 ? 'S' : ''}
            </div>

            <div>
              {orders.map((order, i) => (
                <OrderRow
                  key={order.id || i}
                  order={order}
                  onShipment={handleShipment}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div style={{ padding: 14, textAlign: 'center' }}>
                <button
                  className="btn btn-sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loadingMore ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
