import React, { useState, useEffect, useCallback } from 'react';
import { IconSearch, IconMsg, IconTrash, IconCheck, IconChevD } from '../components/Icons';
import QuickReply from '../components/QuickReply';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const ts = typeof timestamp === 'number' && timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days}j`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

function truncate(str, len) {
  if (!str) return '';
  // Strip any HTML tags from message preview
  const clean = str.replace(/<[^>]*>/g, '').trim();
  return clean.length > len ? clean.slice(0, len) + '…' : clean;
}

function getInitial(username) {
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
}

const STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

const FILTER_CHIPS = [
  { id: 'all', label: 'Tous' },
  { id: 'unread', label: 'Non lus' },
  { id: 'todo', label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
];

const selectStyle = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  padding: '3px 6px',
  border: '1px solid var(--ext-line-strong)',
  borderRadius: 'var(--r-sm)',
  background: 'var(--ext-surface)',
  color: 'var(--ext-fg-3)',
  cursor: 'pointer',
};

function ConversationRow({ conv, isExpanded, onToggle, statuses, notes, onStatusChange, onNoteChange, onMarkRead, onDelete, onQuickReply }) {
  const username = conv.user?.login || conv.username || '';
  const lastMsg = conv.last_message?.body || conv.last_message_body || '';
  const ts = conv.last_message?.created_at_ts || conv.last_message_created_at_ts || conv.updated_at_ts || conv.updated_at || null;
  const isUnread = conv.unread || conv.is_unread || false;
  const convId = conv.id;
  const status = statuses[convId] || '';
  const note = notes[convId] || '';

  return (
    <div
      style={{
        borderBottom: '1px solid var(--ext-line)',
        transition: 'background 0.1s',
      }}
    >
      {/* Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr auto',
          gap: 10,
          padding: '10px 12px',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => onToggle(convId)}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ext-bg-2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Avatar circle */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--ext-fg)',
            color: 'var(--gold)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--display)',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {getInitial(username)}
        </div>

        {/* Content */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: isUnread ? 600 : 500,
                color: 'var(--ext-fg)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {username || 'Utilisateur'}
            </span>
            {isUnread && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  flexShrink: 0,
                }}
              />
            )}
            {status && (
              <span
                className="chip"
                style={{
                  fontSize: 8,
                  padding: '1px 5px',
                  color:
                    status === 'done'
                      ? 'var(--success)'
                      : status === 'cancelled'
                        ? 'var(--danger)'
                        : status === 'in_progress'
                          ? 'var(--gold)'
                          : 'var(--ext-fg-3)',
                }}
              >
                {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: isUnread ? 'var(--ext-fg-3)' : 'var(--ext-fg-4)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {truncate(lastMsg, 60) || 'Pas de message'}
          </div>
        </div>

        {/* Time + chevron */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              color: 'var(--ext-fg-4)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            {timeAgo(ts)}
          </span>
          <IconChevD
            style={{
              color: 'var(--ext-fg-4)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.15s',
            }}
          />
        </div>
      </div>

      {/* Expanded actions */}
      {isExpanded && (
        <div
          style={{
            padding: '8px 12px 12px',
            background: 'var(--ext-bg-2)',
            borderTop: '1px solid var(--ext-line)',
          }}
        >
          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              onClick={() => onMarkRead(convId)}
            >
              <IconCheck /> Marquer lu
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(convId)}
            >
              <IconTrash /> Supprimer
            </button>
            <button
              className="btn btn-sm btn-gold"
              onClick={() => onQuickReply(convId, username)}
            >
              <IconMsg /> Réponse rapide
            </button>
          </div>

          {/* Status dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <label
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 9,
                letterSpacing: '0.08em',
                color: 'var(--ext-fg-4)',
                textTransform: 'uppercase',
              }}
            >
              Statut
            </label>
            <select
              style={selectStyle}
              value={status}
              onChange={(e) => onStatusChange(convId, e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Private note */}
          <label className="label">Note privée</label>
          <textarea
            className="inp"
            placeholder="Ajouter une note..."
            value={note}
            onChange={(e) => onNoteChange(convId, e.target.value)}
            rows={2}
            style={{ fontSize: 11 }}
          />
        </div>
      )}
    </div>
  );
}

export default function InboxManager() {
  const [conversations, setConversations] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [notes, setNotes] = useState({});

  // QuickReply overlay state
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [quickReplyTarget, setQuickReplyTarget] = useState(null); // { convId, username }

  // Load statuses from storage
  useEffect(() => {
    chrome.storage.local.get('revint_inbox_statuses').then((result) => {
      if (result.revint_inbox_statuses) {
        setStatuses(result.revint_inbox_statuses);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    chrome.storage.local.get(['revint_inbox_notes', 'revint_inbox_statuses']).then((result) => {
      if (result.revint_inbox_notes) setNotes(result.revint_inbox_notes);
      if (result.revint_inbox_statuses) setStatuses(result.revint_inbox_statuses);
    }).catch(() => {});
  }, []);

  // Fetch conversations
  const fetchInbox = useCallback(async (p) => {
    const isFirst = p === 1;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'revint:getInbox',
        page: p,
      });
      if (res?.error) throw new Error(res.error);
      const newConvs = res?.conversations || res?.inbox || [];
      if (isFirst) {
        setConversations(newConvs);
      } else {
        setConversations((prev) => [...prev, ...newConvs]);
      }
      setHasMore(newConvs.length >= 20);
      setPage(p);
    } catch (e) {
      setError(e.message || 'Impossible de charger la messagerie');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox(1);
  }, [fetchInbox]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchInbox(page + 1);
    }
  };

  // Toggle expanded row
  const handleToggle = (convId) => {
    setExpanded((prev) => (prev === convId ? null : convId));
  };

  // Status change
  const handleStatusChange = (convId, value) => {
    setStatuses((prev) => {
      const next = { ...prev, [convId]: value };
      chrome.storage.local.set({ revint_inbox_statuses: next });
      return next;
    });
  };

  // Note change (debounced persist)
  const handleNoteChange = (convId, value) => {
    setNotes((prev) => {
      const next = { ...prev, [convId]: value };
      chrome.storage.local.set({ revint_inbox_notes: next });
      return next;
    });
  };

  // Mark as read
  const handleMarkRead = async (convId) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'revint:markConversationRead',
        conversationId: convId,
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, unread: false, is_unread: false } : c
        )
      );
    } catch (e) {
      console.warn('[InboxManager] markRead failed:', e);
    }
  };

  // Delete conversation
  const handleDelete = async (convId) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'revint:deleteConversation',
        conversationId: convId,
      });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (expanded === convId) setExpanded(null);
    } catch (e) {
      console.warn('[InboxManager] deleteConversation failed:', e);
    }
  };

  // Quick reply
  const handleQuickReply = (convId, username) => {
    setQuickReplyTarget({ convId, username });
    setQuickReplyOpen(true);
  };

  const handleQuickReplySelect = async (text) => {
    if (!quickReplyTarget) return;
    const finalText = text.replace(/@username/g, quickReplyTarget.username || '');
    try {
      await chrome.runtime.sendMessage({
        type: 'revint:sendMessage',
        conversationId: quickReplyTarget.convId,
        body: finalText,
      });
      // Update last message preview locally
      setConversations((prev) =>
        prev.map((c) =>
          c.id === quickReplyTarget.convId
            ? {
                ...c,
                last_message: { ...c.last_message, body: finalText },
                last_message_body: finalText,
              }
            : c
        )
      );
    } catch (e) {
      console.warn('[InboxManager] sendMessage failed:', e);
    }
    setQuickReplyOpen(false);
    setQuickReplyTarget(null);
  };

  // Filter + search
  const filtered = conversations.filter((conv) => {
    const username = (conv.user?.login || conv.username || '').toLowerCase();
    const itemTitle = (conv.item?.title || conv.title || '').toLowerCase();
    const lastMsg = (conv.last_message?.body || conv.last_message_body || '').toLowerCase();
    const q = query.toLowerCase().trim();

    // Search filter
    if (q && !username.includes(q) && !itemTitle.includes(q) && !lastMsg.includes(q)) {
      return false;
    }

    // Status filter
    if (filter === 'unread') {
      return conv.unread || conv.is_unread;
    }
    if (filter === 'todo') {
      return statuses[conv.id] === 'todo';
    }
    if (filter === 'in_progress') {
      return statuses[conv.id] === 'in_progress';
    }
    return true;
  });

  // Compute filter counts
  const counts = {
    all: conversations.length,
    unread: conversations.filter((c) => c.unread || c.is_unread).length,
    todo: conversations.filter((c) => statuses[c.id] === 'todo').length,
    in_progress: conversations.filter((c) => statuses[c.id] === 'in_progress').length,
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Search + filter bar */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--ext-line)',
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
              color: 'var(--ext-fg-4)',
            }}
          >
            <IconSearch />
          </span>
          <input
            className="inp"
            placeholder="Rechercher par pseudo ou article..."
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
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center' }}>
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
      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
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
            {query || filter !== 'all' ? 'Aucun résultat' : 'Aucune conversation'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ext-fg-3)' }}>
            {query || filter !== 'all'
              ? 'Essayez un autre filtre ou terme de recherche.'
              : 'Vos conversations apparaitront ici.'}
          </div>
        </div>
      )}

      {/* Conversation count */}
      {!loading && filtered.length > 0 && (
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
          {filtered.length} CONVERSATION{filtered.length !== 1 ? 'S' : ''}
        </div>
      )}

      {/* Conversation list */}
      {!loading &&
        filtered.map((conv) => (
          <ConversationRow
            key={conv.id}
            conv={conv}
            isExpanded={expanded === conv.id}
            onToggle={handleToggle}
            statuses={statuses}
            notes={notes}
            onStatusChange={handleStatusChange}
            onNoteChange={handleNoteChange}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
            onQuickReply={handleQuickReply}
          />
        ))}

      {/* Load more */}
      {!loading && hasMore && (
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

      {/* QuickReply overlay */}
      {quickReplyOpen && (
        <QuickReply
          onSelect={handleQuickReplySelect}
          onClose={() => {
            setQuickReplyOpen(false);
            setQuickReplyTarget(null);
          }}
        />
      )}
    </div>
  );
}
