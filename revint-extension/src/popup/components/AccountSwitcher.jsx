import React, { useState, useEffect, useRef } from 'react';
import { IconClose, IconPlus, IconChevD } from './Icons';

export default function AccountSwitcher() {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const wrapRef = useRef(null);

  // Load accounts on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'revint:getAccounts' })
      .then((res) => {
        if (res?.accounts) {
          setAccounts(res.accounts);
          const active = res.accounts.find((a) => a.active);
          if (active) setActiveId(active.id);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = accounts.find((a) => a.id === activeId);
  const initial = current ? current.login.charAt(0).toUpperCase() : '?';

  const switchAccount = (accountId) => {
    chrome.runtime.sendMessage({ type: 'revint:switchAccount', accountId })
      .then(() => {
        setActiveId(accountId);
        setOpen(false);
      })
      .catch(() => {});
  };

  const removeAccount = (accountId, e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: 'revint:removeAccount', accountId })
      .then(() => {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      })
      .catch(() => {});
  };

  const addAccount = () => {
    chrome.runtime.sendMessage({ type: 'revint:addVintedAccount' }).catch(() => {});
  };

  // Styles
  const triggerStyle = {
    width: 26,
    height: 26,
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--r-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 2px',
    color: 'var(--ext-fg-3)',
  };

  const avatarStyle = (size = 20) => ({
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'var(--ext-fg)',
    color: 'var(--gold)',
    display: 'grid',
    placeItems: 'center',
    fontFamily: 'var(--mono)',
    fontSize: size === 20 ? 9 : 10,
    fontWeight: 600,
    flexShrink: 0,
    lineHeight: 1,
  });

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    width: 240,
    background: 'var(--ext-surface)',
    border: '1px solid var(--ext-line)',
    borderRadius: 'var(--r)',
    boxShadow: 'var(--shadow-pop)',
    zIndex: 100,
    overflow: 'hidden',
  };

  const rowStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    cursor: 'pointer',
    background: isActive ? 'var(--ext-bg-2)' : 'transparent',
    borderBottom: '1px solid var(--ext-line)',
    transition: 'background 0.1s',
  });

  const removeBtnStyle = {
    width: 18,
    height: 18,
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--r-sm)',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--ext-fg-4)',
    flexShrink: 0,
    padding: 0,
  };

  const addBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--ext-fg-3)',
    transition: 'background 0.1s',
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        style={triggerStyle}
        onClick={() => setOpen((v) => !v)}
        title="Changer de compte"
      >
        <div style={avatarStyle(20)}>{initial}</div>
        <IconChevD style={{ opacity: 0.5 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={dropdownStyle}>
          {/* Header */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid var(--ext-line)',
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ext-fg-4)',
            }}
          >
            Comptes Vinted
          </div>

          {/* Account list */}
          {accounts.map((acc) => {
            const isActive = acc.id === activeId;
            return (
              <div
                key={acc.id}
                style={rowStyle(isActive)}
                onClick={() => !isActive && switchAccount(acc.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--ext-bg-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive ? 'var(--ext-bg-2)' : 'transparent';
                }}
              >
                {/* Avatar */}
                <div style={avatarStyle(24)}>
                  {acc.login.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--ext-fg)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {acc.login}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--mono)',
                      color: 'var(--ext-fg-4)',
                    }}
                  >
                    {acc.domain || 'vinted.fr'}
                  </div>
                </div>

                {/* Active dot */}
                {isActive && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--success)',
                      boxShadow: '0 0 0 3px rgba(47,125,91,0.15)',
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Remove button (non-active only) */}
                {!isActive && (
                  <button
                    style={removeBtnStyle}
                    onClick={(e) => removeAccount(acc.id, e)}
                    title="Retirer ce compte"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--danger)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--ext-fg-4)';
                    }}
                  >
                    <IconClose />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add account button */}
          <button
            style={addBtnStyle}
            onClick={addAccount}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ext-bg-2)';
              e.currentTarget.style.color = 'var(--ext-fg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--ext-fg-3)';
            }}
          >
            <IconPlus /> Ajouter ce compte
          </button>
        </div>
      )}
    </div>
  );
}
