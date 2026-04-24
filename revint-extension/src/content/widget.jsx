// ReVint Floating Widget — injected into Vinted pages via content script
// Renders inside a Shadow DOM to isolate styles from Vinted's page
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../popup/App.jsx';

// ─── Widget Shell ────────────────────────────────────
function Widget() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [panelSide, setPanelSide] = useState('left'); // panel opens left or right of FAB
  const fabRef = useRef(null);
  const panelRef = useRef(null);

  // Load saved position
  useEffect(() => {
    chrome.storage.local.get('revint_widget_pos').then((result) => {
      if (result.revint_widget_pos) {
        setPosition(result.revint_widget_pos);
      }
    });
  }, []);

  // NOTE: open/closed state is intentionally NOT persisted across pages.
  // Persisting it would cause the panel to flash open on every new Vinted
  // tab or SPA navigation, which is unexpected and annoying UX.
  // Only the FAB *position* is persisted.

  // Compute which side to show the panel
  useEffect(() => {
    if (position.x !== null) {
      setPanelSide(position.x > window.innerWidth / 2 ? 'left' : 'right');
    } else {
      setPanelSide('left'); // default: FAB is bottom-right, panel opens left
    }
  }, [position.x]);

  // ─── Drag handling ───
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setDragging(true);
    setHasMoved(false);
    const fab = fabRef.current;
    const rect = fab.getBoundingClientRect();
    setDragStart({
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!dragging || !dragStart) return;

    const handleMouseMove = (e) => {
      setHasMoved(true);
      const x = e.clientX - dragStart.offsetX;
      const y = e.clientY - dragStart.offsetY;
      const clampedX = Math.max(0, Math.min(window.innerWidth - 52, x));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 52, y));
      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setDragging(false);
      setPosition((pos) => {
        chrome.storage.local.set({ revint_widget_pos: pos });
        return pos;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStart]);

  const handleFabClick = useCallback(() => {
    if (!hasMoved) {
      setOpen((prev) => !prev);
    }
  }, [hasMoved]);

  // Close panel on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  // FAB position style
  const fabStyle = {
    position: 'fixed',
    zIndex: 2147483646,
    cursor: dragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    transition: dragging ? 'none' : 'box-shadow 0.2s ease',
  };

  if (position.x !== null && position.y !== null) {
    fabStyle.left = `${position.x}px`;
    fabStyle.top = `${position.y}px`;
  } else {
    fabStyle.right = '20px';
    fabStyle.bottom = '20px';
  }

  // Panel position style
  const getPanelStyle = () => {
    const style = {
      position: 'fixed',
      zIndex: 2147483645,
      animation: 'revint-panel-in 0.2s ease-out',
    };

    if (position.x !== null && position.y !== null) {
      if (panelSide === 'left') {
        // Panel opens to the left of FAB
        const panelRight = window.innerWidth - position.x + 12;
        style.right = `${Math.max(8, panelRight)}px`;
      } else {
        // Panel opens to the right of FAB
        style.left = `${position.x + 60}px`;
      }
      // Vertically center on FAB, clamped to viewport
      const panelTop = Math.max(10, Math.min(window.innerHeight - 610, position.y - 276));
      style.top = `${panelTop}px`;
    } else {
      // Default: FAB is bottom-right
      style.right = '80px';
      style.bottom = '20px';
    }

    return style;
  };

  return (
    <>
      {/* Floating Action Button */}
      <div
        ref={fabRef}
        className="revint-fab"
        style={fabStyle}
        onMouseDown={handleMouseDown}
        onClick={handleFabClick}
        title={open ? 'Fermer ReVint' : 'Ouvrir ReVint'}
      >
        <div className={`revint-fab-inner${open ? ' revint-fab-open' : ''}`}>
          {open ? (
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : (
            <span className="revint-fab-logo">R</span>
          )}
        </div>
        {!open && (
          <div className="revint-fab-pulse" />
        )}
      </div>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="revint-panel"
          style={getPanelStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Note: App creates its own useVinted instance, independent from the popup.
              This is intentional — the widget and popup can run simultaneously without conflict. */}
          <App />
        </div>
      )}
    </>
  );
}

// ─── Widget CSS (injected into Shadow DOM) ───────────
const WIDGET_CSS = `
/* Re-scope :root variables to :host so they resolve inside the Shadow DOM */
:host {
  --cream: #FAF7F2;
  --cream-2: #F2EDE4;
  --cream-3: #E8E1D4;
  --ink: #1A1D3A;
  --ink-2: #2B2F5B;
  --ink-3: #4A4F7A;
  --ink-4: #8A8FAE;
  --gold: #E8C547;
  --gold-deep: #C9A82E;
  --gold-wash: #F9EFC8;
  --line: rgba(26, 29, 58, 0.12);
  --line-strong: rgba(26, 29, 58, 0.22);
  --success: #2F7D5B;
  --danger: #B83A3A;
  --sans: 'Satoshi', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --serif: 'Cabinet Grotesk', 'Satoshi', sans-serif;
  --display: 'Cabinet Grotesk', 'Satoshi', sans-serif;
  --r-sm: 4px;
  --r: 6px;
  --r-lg: 10px;
  --shadow-1: 0 1px 0 rgba(26,29,58,0.04), 0 1px 2px rgba(26,29,58,0.06);
  --shadow-2: 0 2px 4px rgba(26,29,58,0.06), 0 8px 24px rgba(26,29,58,0.08);
  --shadow-pop: 0 12px 40px rgba(26,29,58,0.18), 0 2px 6px rgba(26,29,58,0.1);
}

/* FAB button */
.revint-fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}

.revint-fab-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1A1D3A;
  color: #E8C547;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(26,29,58,0.3), 0 2px 4px rgba(26,29,58,0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  position: relative;
  z-index: 2;
}

.revint-fab-inner.revint-fab-open {
  background: #E8C547;
  color: #1A1D3A;
}

.revint-fab:hover .revint-fab-inner {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(26,29,58,0.35), 0 2px 6px rgba(26,29,58,0.25);
}

.revint-fab-logo {
  font-family: 'Cabinet Grotesk', 'Satoshi', ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
  letter-spacing: -1px;
}

.revint-fab-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #E8C547;
  animation: revint-pulse 2s ease-out infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes revint-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  70% { transform: scale(1.3); opacity: 0; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* Panel container */
.revint-panel {
  width: 400px;
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(26,29,58,0.22), 0 4px 12px rgba(26,29,58,0.12);
  border: 1px solid rgba(26,29,58,0.08);
  animation: revint-panel-in 0.2s ease-out;
}

@keyframes revint-panel-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Override ext-popup border radius in widget context */
.revint-panel .ext-popup {
  border-radius: 12px;
}
`;

// Store root for potential cleanup
let root = null;

// ─── Mount into Shadow DOM ───────────────────────────
function mountWidget() {
  // Avoid double-mount
  if (document.getElementById('revint-widget-host')) return;

  const host = document.createElement('div');
  host.id = 'revint-widget-host';
  // Host is zero-size, fixed, and non-interactive — children handle their own pointer-events
  host.style.cssText = 'position:fixed;z-index:2147483647;top:0;left:0;width:0;height:0;pointer-events:none;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // Inject widget-specific CSS
  const widgetStyle = document.createElement('style');
  widgetStyle.textContent = WIDGET_CSS;
  shadow.appendChild(widgetStyle);

  // Inject the popup CSS (inlined at build time via __POPUP_CSS__)
  const popupStyle = document.createElement('style');
  popupStyle.textContent = __POPUP_CSS__;
  shadow.appendChild(popupStyle);

  // Load web fonts (may be blocked by CSP on some Vinted domains — graceful degradation via CSS fallback fonts)
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&f[]=cabinet-grotesk@400,500,700,800,900&f[]=jetbrains-mono@400,500&display=swap';
  shadow.appendChild(fontLink);

  // Inject fonts in document.head as well (some browsers need this for Shadow DOM)
  if (!document.querySelector('link[href*="fontshare"]')) {
    const headFontLink = document.createElement('link');
    headFontLink.rel = 'stylesheet';
    headFontLink.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&f[]=cabinet-grotesk@400,500,700,800,900&f[]=jetbrains-mono@400,500&display=swap';
    document.head.appendChild(headFontLink);
  }

  // React mount container
  const container = document.createElement('div');
  container.style.cssText = 'pointer-events:auto;';
  shadow.appendChild(container);

  root = createRoot(container);
  root.render(<Widget />);

  // Add cleanup on extension unload
  if (chrome.runtime?.onSuspend) {
    chrome.runtime.onSuspend.addListener(() => {
      if (root) root.unmount();
    });
  }
}

// Wait a tick to ensure content.js has extracted and sent tokens
// Mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(mountWidget, 100));
} else {
  setTimeout(mountWidget, 100);
}
