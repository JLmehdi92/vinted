// Injecte un bouton "Vendre un similaire" sur les pages article Vinted
// DOM analysé sur le vrai rendu Vinted (avril 2026) :
//   - Boutons "Acheter" (button), "Faire une offre" (button), "Message" (a)
//   - Parent commun : <div class="u-grid u-gap-regular">
//   - Grand-parent : <div class="details-list__item details-list--actions">

(function () {
  let itemId = null;
  let lastUrl = location.href;
  let injectRetries = 0;
  const MAX_RETRIES = 20;

  // Debounce the re-check: Vinted re-renders aggressively, so the observer
  // fires dozens of times per second. We coalesce into a single scheduled pass.
  let scheduled = false;
  function schedule(fn, ms = 150) {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; fn(); }, ms);
  }

  function getItemId() {
    const m = window.location.pathname.match(/\/items\/(\d+)/);
    return m ? m[1] : null;
  }

  function tryInject() {
    if (document.getElementById('revint-sell-similar')) return;

    itemId = getItemId();
    if (!itemId) return;

    // Strategy 1: exact Vinted 2026 action container
    let container = document.querySelector('.details-list--actions .u-grid');

    // Strategy 2: locate by action button text in multiple languages
    if (!container) {
      const actionTexts = [
        'acheter', 'buy', 'kaufen', 'comprar', 'acquista', 'kopen',
        'faire une offre', 'make an offer', 'angebot machen',
        'message', 'envoyer un message', 'send message', 'nachricht',
      ];
      const allClickable = document.querySelectorAll('button, a');
      let lastMatch = null;
      for (const el of allClickable) {
        const text = el.textContent.trim().toLowerCase();
        if (actionTexts.some(t => text === t)) lastMatch = el;
      }
      if (lastMatch) {
        container = lastMatch.closest('.u-grid') || lastMatch.parentElement;
      }
    }

    // Strategy 3: generic sidebar fallback
    if (!container) {
      container = document.querySelector(
        '[class*="details-list--actions"], [class*="item-sidebar"], aside'
      );
    }

    if (!container) {
      if (injectRetries < MAX_RETRIES) {
        injectRetries++;
        setTimeout(tryInject, 500);
      }
      return;
    }
    injectRetries = 0;

    const btn = document.createElement('button');
    btn.id = 'revint-sell-similar';
    btn.type = 'button';
    // Static icon + label built via DOM APIs to avoid innerHTML churn.
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:8px;';
    const badge = document.createElement('span');
    badge.style.cssText = 'width:20px;height:20px;background:#E8C547;color:#1A1D3A;display:inline-grid;place-items:center;border-radius:5px;font-weight:900;font-size:11px;line-height:1;flex-shrink:0;';
    badge.textContent = 'R';
    const labelText = document.createTextNode('Vendre un similaire');
    wrap.append(badge, labelText);
    btn.appendChild(wrap);

    btn.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 11px 16px;
      margin-top: 8px;
      background: #1A1D3A;
      color: #FAF7F2;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      letter-spacing: -0.2px;
      box-shadow: 0 2px 8px rgba(26,29,58,0.15);
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#2B2F5B';
      btn.style.boxShadow = '0 4px 12px rgba(26,29,58,0.25)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#1A1D3A';
      btn.style.boxShadow = '0 2px 8px rgba(26,29,58,0.15)';
    });
    btn.addEventListener('click', handleClick);

    container.appendChild(btn);
  }

  // Extract all article data from the page (JSON-LD + breadcrumbs + DOM).
  // No API call needed — everything is in the page HTML.
  function extractArticleFromPage() {
    const data = {
      title: '', description: '', price: '', brand: '', currency: 'EUR',
      category: '', color: '', size: '', state: '',
      catalog_id: null, catalog_path: [], brand_id: null,
      material: '', style: '', pattern: '',
    };

    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const json = JSON.parse(s.textContent);
        if (json.offers || json['@type'] === 'Product') {
          if (json.name) data.title = json.name;
          if (json.description) data.description = json.description;
          if (json.offers?.price) data.price = json.offers.price;
          if (json.offers?.priceCurrency) data.currency = json.offers.priceCurrency;
          if (json.category) data.category = json.category;
          if (json.color) data.color = json.color;
          if (json.brand?.name) data.brand = json.brand.name;
        }
      } catch {}
    });

    // Breadcrumbs — catalog IDs (category + sub-categories) + brand id
    const breadcrumbs = [];
    document.querySelectorAll('a[href*="/catalog"]').forEach(a => {
      const catalogMatch = a.href.match(/\/catalog\/(\d+)/);
      const brandMatch = a.href.match(/\/brand\/(\d+)/);
      if (catalogMatch) {
        breadcrumbs.push({
          text: a.textContent.trim(),
          catalogId: parseInt(catalogMatch[1]),
        });
      }
      if (brandMatch && !data.brand_id) data.brand_id = parseInt(brandMatch[1]);
    });
    data.catalog_path = breadcrumbs;
    if (breadcrumbs.length > 0) {
      // Dedupe by catalogId and use the last unique entry as the leaf category.
      const unique = breadcrumbs.filter((b, i, arr) =>
        i === arr.findIndex(x => x.catalogId === b.catalogId)
      );
      data.catalog_id = unique[unique.length - 1]?.catalogId || null;
    }

    // Sidebar details parsed from innerText
    const body = document.body.innerText;
    const detailsMap = {
      'Taille': 'size', 'État': 'state', 'Couleur': 'color', 'Marque': 'brand',
      'Matière': 'material', 'Style': 'style', 'Motif': 'pattern',
      'Coupe': 'cut', 'Longueur': 'length',
    };
    for (const [label, key] of Object.entries(detailsMap)) {
      const rx = new RegExp(label + '\\s+([^\\n]+)');
      const m = body.match(rx);
      if (m && (!data[key] || data[key] === '')) {
        data[key] = m[1].trim();
      }
    }

    // DOM fallback for title
    if (!data.title) {
      const headings = document.querySelectorAll('h1, h2');
      for (const h of headings) {
        const text = h.textContent.trim();
        if (text.length > 3 && text.length < 200 &&
            !text.includes('Articles similaires') &&
            !text.includes('Dressing') &&
            !text.includes('Protection')) {
          data.title = text;
          break;
        }
      }
    }

    return data;
  }

  async function handleClick() {
    const btn = document.getElementById('revint-sell-similar');
    if (!btn || btn.disabled) return;

    const originalChildren = Array.from(btn.childNodes).map(n => n.cloneNode(true));
    btn.textContent = 'Chargement…';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.style.cursor = 'wait';

    try {
      const extracted = extractArticleFromPage();
      if (!extracted.title) throw new Error("Impossible de lire les données de l'article");

      const sellSimilarData = {
        title: extracted.title,
        description: extracted.description || '',
        price: extracted.price || '',
        brand: extracted.brand || '',
        brand_id: extracted.brand_id || null,
        category: extracted.category || '',
        catalog_id: extracted.catalog_id || null,
        catalog_path: extracted.catalog_path || [],
        color: extracted.color || '',
        size: extracted.size || '',
        state: extracted.state || '',
        material: extracted.material || '',
        style: extracted.style || '',
        pattern: extracted.pattern || '',
        cut: extracted.cut || '',
        length: extracted.length || '',
        currency: extracted.currency || 'EUR',
        source_item_id: parseInt(itemId),
        source_url: window.location.href,
        timestamp: Date.now(),
      };

      try {
        await chrome.storage.local.set({ revint_sell_similar: sellSimilarData });
      } catch (storageErr) {
        // If we can't persist, don't navigate — otherwise user lands on an
        // empty /items/new and thinks the feature is broken.
        throw new Error('Impossible de sauvegarder les données : ' + storageErr.message);
      }

      window.location.href = `${window.location.origin}/items/new`;
    } catch (e) {
      btn.textContent = 'Erreur : ' + (e.message || 'Réessayez');
      btn.style.color = '#FF6B6B';
      btn.style.background = '#2a1515';
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      setTimeout(() => {
        btn.textContent = '';
        originalChildren.forEach(n => btn.appendChild(n));
        btn.style.color = '#FAF7F2';
        btn.style.background = '#1A1D3A';
      }, 3000);
    }
  }

  // ── Init & lifecycle ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryInject, 800));
  } else {
    setTimeout(tryInject, 800);
  }

  // Vinted is an SPA — re-render without reload. Watch URL changes (debounced)
  // and re-inject if our button disappeared. subtree:true on document.body
  // is expensive; the debounce in schedule() is what keeps it cheap.
  const observer = new MutationObserver(() => {
    schedule(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        const existing = document.getElementById('revint-sell-similar');
        if (existing) existing.remove();
        if (getItemId()) {
          injectRetries = 0;
          tryInject();
        }
        return;
      }
      if (getItemId() && !document.getElementById('revint-sell-similar')) {
        injectRetries = 0;
        tryInject();
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Cleanup on page teardown so we don't leak the observer.
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();
