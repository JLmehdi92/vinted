import React from 'react';
import { IconBack } from './Icons';

function Header({ title, onBack, right, connected }) {
  return (
    <div className="ext-header">
      <div className="ext-logo">
        {onBack ? (
          <button className="ext-iconbtn" onClick={onBack}>
            <IconBack />
          </button>
        ) : (
          <div className="ext-logo-mark">R</div>
        )}
        <span>{title || 'ReVint'}</span>
        {!onBack && connected != null && (
          <span className="chip" style={{ marginLeft: 6, fontSize: 8 }}>
            <span
              className="ext-status-dot"
              style={
                connected === false
                  ? { background: 'var(--danger)', boxShadow: '0 0 0 3px rgba(184,58,58,0.15)' }
                  : undefined
              }
            />
            {connected ? ' LIVE' : ' HORS LIGNE'}
          </span>
        )}
      </div>
      <div className="ext-header-actions">{right}</div>
    </div>
  );
}

export default Header;
