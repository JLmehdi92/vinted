// Form filler pour /items/new — MAIN WORLD
// Lit revint_sell_similar depuis un CustomEvent envoyé par le content script

(function() {
  'use strict';

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
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Écouter les données depuis le content script (isolated world)
  let formFillInProgress = false;
  window.addEventListener('revint:fillNewItemForm', async (e) => {
    const data = e.detail;
    if (!data) return;
    if (formFillInProgress) return;
    formFillInProgress = true;

    const results = { filled: [], errors: [] };

    // Attendre que le formulaire React soit monté
    await delay(2000);

    // ── Titre ──
    try {
      const titleInput = document.querySelector(
        'input[data-testid*="title"], input[name*="title"], input[placeholder*="titre"], input[placeholder*="Titre"], input[placeholder*="title"]'
      );
      if (titleInput) {
        setNativeValue(titleInput, data.title);
        results.filled.push('title');
      } else {
        // Fallback : chercher le premier input text dans le formulaire
        const inputs = document.querySelectorAll('form input[type="text"], form input:not([type])');
        if (inputs.length > 0) {
          setNativeValue(inputs[0], data.title);
          results.filled.push('title (fallback)');
        } else {
          results.errors.push('title not found');
        }
      }
    } catch (err) { results.errors.push('title: ' + err.message); }

    await delay(300);

    // ── Description ──
    try {
      const descArea = document.querySelector(
        'textarea[data-testid*="description"], textarea[name*="description"], textarea[placeholder*="description"], textarea[placeholder*="Description"]'
      );
      if (descArea) {
        setNativeValue(descArea, data.description);
        results.filled.push('description');
      } else {
        const textareas = document.querySelectorAll('form textarea');
        if (textareas.length > 0) {
          setNativeValue(textareas[0], data.description);
          results.filled.push('description (fallback)');
        } else {
          results.errors.push('description not found');
        }
      }
    } catch (err) { results.errors.push('description: ' + err.message); }

    await delay(300);

    // ── Prix ──
    try {
      const priceInput = document.querySelector(
        'input[data-testid*="price"], input[name*="price"], input[placeholder*="prix"], input[placeholder*="Prix"], input[placeholder*="0,00"]'
      );
      if (priceInput) {
        setNativeValue(priceInput, String(data.price));
        results.filled.push('price');
      }
    } catch (err) { results.errors.push('price: ' + err.message); }

    await delay(300);

    // ── Marque (tentative via le champ de recherche du dropdown) ──
    if (data.brand) {
      try {
        const brandInputs = document.querySelectorAll(
          'input[data-testid*="brand"], input[placeholder*="marque"], input[placeholder*="Marque"], input[placeholder*="brand"]'
        );
        for (const input of brandInputs) {
          setNativeValue(input, data.brand);
          await delay(600);
          // Cliquer sur la première suggestion
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

    // ── Panneau d'aide ReVint — Design system cohérent ──
    console.log('[ReVint] Form fill results:', results);

    const filledCount = results.filled.length;

    // Construire les lignes d'infos
    const infoLines = [];
    if (data.category) infoLines.push({ label: 'Catégorie', value: data.category, icon: '📂' });
    if (data.brand) infoLines.push({ label: 'Marque', value: data.brand, icon: '🏷' });
    if (data.size) infoLines.push({ label: 'Taille', value: data.size, icon: '📏' });
    if (data.state) infoLines.push({ label: 'État', value: data.state, icon: '✨' });
    if (data.color) infoLines.push({ label: 'Couleur', value: data.color, icon: '🎨' });
    if (data.material) infoLines.push({ label: 'Matière', value: data.material, icon: '🧵' });
    if (data.style) infoLines.push({ label: 'Style', value: data.style, icon: '👔' });
    if (data.pattern) infoLines.push({ label: 'Motif', value: data.pattern, icon: '🔲' });
    if (data.cut) infoLines.push({ label: 'Coupe', value: data.cut, icon: '✂' });

    const rowsHTML = infoLines.map(l =>
      `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(26,29,58,0.08);">
        <span style="font-size:12px;width:20px;text-align:center;flex-shrink:0;">${l.icon}</span>
        <span style="font-size:11px;color:#4A4F7A;flex:1;">${l.label}</span>
        <span style="font-size:11px;font-weight:600;color:#1A1D3A;text-align:right;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.value}</span>
      </div>`
    ).join('');

    // Chemin catégorie
    const pathHTML = data.catalog_path?.length > 0
      ? `<div style="font-size:10px;color:#4A4F7A;padding:6px 8px;background:rgba(26,29,58,0.04);border-radius:4px;margin-bottom:10px;line-height:1.5;">
          ${data.catalog_path.map(c => c.text).join(' <span style="color:#C9A82E;margin:0 2px;">›</span> ')}
        </div>`
      : '';

    const panel = document.createElement('div');
    panel.id = 'revint-sell-similar-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 99999;
      background: #FAF7F2;
      color: #1A1D3A;
      border: 1px solid rgba(26,29,58,0.12);
      border-radius: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      box-shadow: 0 16px 48px rgba(26,29,58,0.18), 0 4px 12px rgba(26,29,58,0.08);
      width: 320px;
      max-height: 80vh;
      overflow: hidden;
      animation: revint-panel-in 0.35s cubic-bezier(0.16,1,0.3,1);
    `;
    panel.innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;background:#1A1D3A;color:#FAF7F2;border-radius:14px 14px 0 0;">
        <div style="width:28px;height:28px;background:#E8C547;color:#1A1D3A;display:grid;place-items:center;border-radius:7px;font-weight:900;font-size:15px;flex-shrink:0;">R</div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13px;letter-spacing:-0.2px;">Vendre un similaire</div>
          <div style="font-size:10px;opacity:0.6;margin-top:1px;">${filledCount} champs remplis automatiquement</div>
        </div>
        <button id="revint-panel-close" style="background:rgba(255,255,255,0.1);border:none;color:#FAF7F2;cursor:pointer;font-size:14px;width:24px;height:24px;border-radius:6px;display:grid;place-items:center;transition:background 0.15s;">✕</button>
      </div>

      <!-- Contenu -->
      <div style="padding:12px 16px;overflow-y:auto;max-height:calc(80vh - 80px);">
        <!-- Badge succès -->
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(47,125,91,0.08);border:1px solid rgba(47,125,91,0.15);border-radius:8px;margin-bottom:12px;">
          <span style="color:#2F7D5B;font-size:14px;">✓</span>
          <span style="font-size:11px;color:#2F7D5B;font-weight:500;">Titre, description et prix pré-remplis</span>
        </div>

        <!-- Infos à sélectionner -->
        <div style="margin-bottom:10px;">
          <div style="font-size:9px;font-weight:700;color:#C9A82E;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">À sélectionner dans le formulaire</div>
          ${pathHTML}
          <div style="background:#fff;border:1px solid rgba(26,29,58,0.08);border-radius:8px;padding:4px 12px;">
            ${rowsHTML || '<div style="padding:8px 0;opacity:0.4;font-size:11px;">Aucune info supplémentaire</div>'}
          </div>
        </div>

        <!-- Lien article original -->
        ${data.source_url ? `<a href="${data.source_url}" target="_blank" style="display:flex;align-items:center;gap:6px;font-size:10px;color:#4A4F7A;text-decoration:none;padding:6px 0;transition:color 0.15s;">
          <span style="opacity:0.5;">↗</span> Voir l'article original
        </a>` : ''}
      </div>
    `;
    document.body.appendChild(panel);

    // Hover effect sur le bouton fermer
    const closeBtn = document.getElementById('revint-panel-close');
    closeBtn?.addEventListener('mouseenter', () => closeBtn.style.background = 'rgba(255,255,255,0.2)');
    closeBtn?.addEventListener('mouseleave', () => closeBtn.style.background = 'rgba(255,255,255,0.1)');
    closeBtn?.addEventListener('click', () => panel.remove());

    // Animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes revint-panel-in {
        from { transform: translateY(20px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Notifier le content script du résultat
    window.dispatchEvent(new CustomEvent('revint:fillFormResult', { detail: results }));
  });
})();
