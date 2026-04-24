import React from 'react';
import { IconSun, IconMoon } from './Icons';

function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      className="ext-iconbtn ext-theme-toggle"
      title={dark ? 'Mode clair' : 'Mode sombre'}
      onClick={onToggle}
    >
      <span className="ic-swap" key={dark ? 'moon' : 'sun'}>
        {dark ? <IconSun /> : <IconMoon />}
      </span>
    </button>
  );
}

export default ThemeToggle;
