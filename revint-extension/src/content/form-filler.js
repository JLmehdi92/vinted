// Form filler pour /items/new — MAIN WORLD
// Reçoit les données de l'annonce source via CustomEvent dispatché par
// form-filler-bridge.js (monde isolé → monde principal).

(function() {
  'use strict';

  // React controlled inputs ignore `input.value = x` because React compares
  // against its internal _valueTracker. To force a real change event:
  //   1. Call the prototype's NATIVE value setter so React's wrapper doesn't
  //      intercept.
  //   2. Reset _valueTracker to the OLD value so React's "did it change?"
  //      check during the synthetic event sees a real diff.
  //   3. Dispatch bubbling input + change events so React picks them up.
  // Removing any step breaks Vinted's form silently.
  function setNativeValue(element, value) {
    const isTextarea = element instanceof HTMLTextAreaElement;
    const prototype = isTextarea ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const lastValue = element.value;
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    nativeSetter.call(element, value);
    const tracker = element._valueTracker;
    if (tracker) tracker.setValue(lastValue);
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    // Verify the write actually landed — if React (or a form library like
    // Formik/RHF) ignored it, surface that instead of silently looking fine.
    return element.value === value;
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  let formFillInProgress = false;
  window.addEventListener('revint:fillNewItemForm', async (e) => {
    const data = e.detail;
    if (!data) return;
    if (formFillInProgress) return;
    formFillInProgress = true;

    const results = { filled: [], errors: [] };

    // Wait for the React form to mount
    await delay(2000);

    // ── Titre ──
    try {
      const target =
        document.querySelector('input[data-testid*="title"], input[name*="title"], input[placeholder*="titre"], input[placeholder*="Titre"], input[placeholder*="title"]')
        || document.querySelector('form input[type="text"], form input:not([type])');
      if (target) {
        if (setNativeValue(target, data.title)) results.filled.push('title');
        else results.errors.push('title: setNativeValue did not persist');
      } else {
        results.errors.push('title not found');
      }
    } catch (err) { results.errors.push('title: ' + err.message); }

    await delay(300);

    // ── Description ──
    try {
      const descArea =
        document.querySelector('textarea[data-testid*="description"], textarea[name*="description"], textarea[placeholder*="description"], textarea[placeholder*="Description"]')
        || document.querySelector('form textarea');
      if (descArea) {
        if (setNativeValue(descArea, data.description)) results.filled.push('description');
        else results.errors.push('description: setNativeValue did not persist');
      } else {
        results.errors.push('description not found');
      }
    } catch (err) { results.errors.push('description: ' + err.message); }

    await delay(300);

    // ── Prix ──
    try {
      const priceInput = document.querySelector(
        'input[data-testid*="price"], input[name*="price"], input[placeholder*="prix"], input[placeholder*="Prix"], input[placeholder*="0,00"]'
      );
      if (priceInput && setNativeValue(priceInput, String(data.price))) {
        results.filled.push('price');
      }
    } catch (err) { results.errors.push('price: ' + err.message); }

    await delay(300);

    // ── Marque ──
    if (data.brand) {
      try {
        const brandInputs = document.querySelectorAll(
          'input[data-testid*="brand"], input[placeholder*="marque"], input[placeholder*="Marque"], input[placeholder*="brand"]'
        );
        for (const input of brandInputs) {
          setNativeValue(input, data.brand);
          await delay(600);
          const suggestion = document.querySelector(
            '[class*="option"], [class*="suggestion"], [class*="dropdown"] [class*="item"], [role="option"]'
          );
          if (suggestion) {
            suggestion.click();
            results.filled.push('brand');
          } else {
            results.filled.push('brand (typed, no suggestion clicked)');
          }
          break;
        }
      } catch (err) { results.errors.push('brand: ' + err.message); }
    }

    console.log('[ReVint] Form fill results:', results);
    buildHelperPanel(data, results.filled.length);

    // Ack the isolated-world bridge so it stops retrying the dispatch.
    // (detail payload is unused on the receiving side.)
    window.dispatchEvent(new CustomEvent('revint:fillFormResult', { detail: results }));
  });

  // Built via DOM APIs (textContent / setAttribute) instead of innerHTML so
  // that data from the source page (catalog_path[].text, source_url, etc.)
  // cannot inject HTML or script into the current page.
  function buildHelperPanel(data, filledCount) {
    ensurePanelStylesInjected();

    const panel = document.createElement('div');
    panel.id = 'revint-sell-similar-panel';
    panel.style.cssText = `
      position: fixed; bottom: 24px; left: 24px; z-index: 99999;
      background: #FAF7F2; color: #1A1D3A;
      border: 1px solid rgba(26,29,58,0.12); border-radius: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      box-shadow: 0 16px 48px rgba(26,29,58,0.18), 0 4px 12px rgba(26,29,58,0.08);
      width: 320px; max-height: 80vh; overflow: hidden;
      animation: revint-panel-in 0.35s cubic-bezier(0.16,1,0.3,1);
    `;

    // Header
    const header = el('div', 'display:flex;align-items:center;gap:10px;padding:14px 16px;background:#1A1D3A;color:#FAF7F2;border-radius:14px 14px 0 0;');
    const logo = el('div', 'width:28px;height:28px;background:#E8C547;color:#1A1D3A;display:grid;place-items:center;border-radius:7px;font-weight:900;font-size:15px;flex-shrink:0;');
    logo.textContent = 'R';
    const titleWrap = el('div', 'flex:1;');
    const title = el('div', 'font-weight:700;font-size:13px;letter-spacing:-0.2px;');
    title.textContent = 'Vendre un similaire';
    const subtitle = el('div', 'font-size:10px;opacity:0.6;margin-top:1px;');
    subtitle.textContent = `${filledCount} champs remplis automatiquement`;
    titleWrap.append(title, subtitle);
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:rgba(255,255,255,0.1);border:none;color:#FAF7F2;cursor:pointer;font-size:14px;width:24px;height:24px;border-radius:6px;display:grid;place-items:center;transition:background 0.15s;';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = 'rgba(255,255,255,0.2)');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'rgba(255,255,255,0.1)');
    closeBtn.addEventListener('click', () => panel.remove());
    header.append(logo, titleWrap, closeBtn);
    panel.appendChild(header);

    // Body
    const body = el('div', 'padding:12px 16px;overflow-y:auto;max-height:calc(80vh - 80px);');

    const successBadge = el('div', 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(47,125,91,0.08);border:1px solid rgba(47,125,91,0.15);border-radius:8px;margin-bottom:12px;');
    const check = el('span', 'color:#2F7D5B;font-size:14px;');
    check.textContent = '✓';
    const successText = el('span', 'font-size:11px;color:#2F7D5B;font-weight:500;');
    successText.textContent = 'Titre, description et prix pré-remplis';
    successBadge.append(check, successText);
    body.appendChild(successBadge);

    const infoWrap = el('div', 'margin-bottom:10px;');
    const infoLabel = el('div', 'font-size:9px;font-weight:700;color:#C9A82E;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;');
    infoLabel.textContent = 'À sélectionner dans le formulaire';
    infoWrap.appendChild(infoLabel);

    if (Array.isArray(data.catalog_path) && data.catalog_path.length > 0) {
      const breadcrumbs = el('div', 'font-size:10px;color:#4A4F7A;padding:6px 8px;background:rgba(26,29,58,0.04);border-radius:4px;margin-bottom:10px;line-height:1.5;');
      data.catalog_path.forEach((c, i) => {
        if (i > 0) {
          const sep = el('span', 'color:#C9A82E;margin:0 2px;');
          sep.textContent = ' › ';
          breadcrumbs.appendChild(sep);
        }
        const part = document.createElement('span');
        part.textContent = String(c?.text ?? '');
        breadcrumbs.appendChild(part);
      });
      infoWrap.appendChild(breadcrumbs);
    }

    const rowsBox = el('div', 'background:#fff;border:1px solid rgba(26,29,58,0.08);border-radius:8px;padding:4px 12px;');
    const ROWS = [
      ['📂', 'Catégorie', data.category],
      ['🏷', 'Marque', data.brand],
      ['📏', 'Taille', data.size],
      ['✨', 'État', data.state],
      ['🎨', 'Couleur', data.color],
      ['🧵', 'Matière', data.material],
      ['👔', 'Style', data.style],
      ['🔲', 'Motif', data.pattern],
      ['✂', 'Coupe', data.cut],
    ];
    let rowCount = 0;
    for (const [icon, label, value] of ROWS) {
      if (!value) continue;
      rowCount++;
      const row = el('div', 'display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(26,29,58,0.08);');
      const iconEl = el('span', 'font-size:12px;width:20px;text-align:center;flex-shrink:0;');
      iconEl.textContent = icon;
      const labelEl = el('span', 'font-size:11px;color:#4A4F7A;flex:1;');
      labelEl.textContent = label;
      const valEl = el('span', 'font-size:11px;font-weight:600;color:#1A1D3A;text-align:right;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
      valEl.textContent = String(value);
      row.append(iconEl, labelEl, valEl);
      rowsBox.appendChild(row);
    }
    if (rowCount === 0) {
      const empty = el('div', 'padding:8px 0;opacity:0.4;font-size:11px;');
      empty.textContent = 'Aucune info supplémentaire';
      rowsBox.appendChild(empty);
    }
    infoWrap.appendChild(rowsBox);
    body.appendChild(infoWrap);

    // Link to source article — only accept http(s) URLs to prevent
    // javascript:/data: URI injection via a crafted source page.
    if (typeof data.source_url === 'string' && /^https?:\/\//i.test(data.source_url)) {
      const link = document.createElement('a');
      link.setAttribute('href', data.source_url);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:10px;color:#4A4F7A;text-decoration:none;padding:6px 0;transition:color 0.15s;';
      const arrow = el('span', 'opacity:0.5;');
      arrow.textContent = '↗';
      const linkText = document.createElement('span');
      linkText.textContent = "Voir l'article original";
      link.append(arrow, linkText);
      body.appendChild(link);
    }

    panel.appendChild(body);
    document.body.appendChild(panel);
  }

  function el(tag, cssText) {
    const n = document.createElement(tag);
    n.style.cssText = cssText;
    return n;
  }

  function ensurePanelStylesInjected() {
    if (document.getElementById('revint-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'revint-panel-styles';
    style.textContent = `
      @keyframes revint-panel-in {
        from { transform: translateY(20px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
})();
