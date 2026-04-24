// Injecte un bouton "Vendre un similaire" sur les pages article Vinted
// Analysé sur le vrai DOM Vinted (avril 2026) :
//   - Boutons "Acheter" (button), "Faire une offre" (button), "Message" (a)
//   - Parent commun : <div class="u-grid u-gap-regular">
//   - Grand-parent : <div class="details-list__item details-list--actions">

(function () {
  let itemId = null;
  let lastUrl = location.href;
  let injectRetries = 0;
  const MAX_RETRIES = 20;

  function getItemId() {
    const m = window.location.pathname.match(/\/items\/(\d+)/);
    return m ? m[1] : null;
  }

  function tryInject() {
    // Ne pas injecter si déjà présent
    if (document.getElementById('revint-sell-similar')) return;

    itemId = getItemId();
    if (!itemId) return;

    // Stratégie 1 : Chercher le conteneur d'actions par sa classe exacte (Vinted 2026)
    let container = document.querySelector('.details-list--actions .u-grid');

    // Stratégie 2 : Chercher les boutons par texte (toutes langues) dans <button> ET <a>
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
        if (actionTexts.some(t => text === t)) {
          lastMatch = el;
        }
      }
      if (lastMatch) {
        // Le conteneur parent est le grid qui contient tous les boutons
        container = lastMatch.closest('.u-grid') || lastMatch.parentElement;
      }
    }

    // Stratégie 3 : Fallback générique
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

    // Créer le bouton
    const btn = document.createElement('button');
    btn.id = 'revint-sell-similar';
    btn.type = 'button';
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="width:20px;height:20px;background:#E8C547;color:#1A1D3A;display:inline-grid;place-items:center;border-radius:5px;font-weight:900;font-size:11px;line-height:1;flex-shrink:0;">R</span>
        Vendre un similaire
      </span>
    `;
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

    // Injecter dans le conteneur (après les boutons existants)
    container.appendChild(btn);
  }

  // Extract ALL article data from the page DOM + JSON-LD + breadcrumbs
  // No API call needed — everything is in the page HTML
  function extractArticleFromPage() {
    const data = {
      title: '', description: '', price: '', brand: '', currency: 'EUR',
      category: '', color: '', size: '', state: '',
      catalog_id: null, catalog_path: [], brand_id: null,
      material: '', style: '', pattern: '',
    };

    // ── 1. JSON-LD (Schema.org) — titre, description, prix, marque, couleur, catégorie ──
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

    // ── 2. Breadcrumbs — catalog IDs (catégorie + sous-catégories) ──
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
      if (brandMatch && !data.brand_id) {
        data.brand_id = parseInt(brandMatch[1]);
      }
    });
    data.catalog_path = breadcrumbs;
    // Le dernier breadcrumb avec un catalog_id unique est la catégorie feuille
    if (breadcrumbs.length > 0) {
      // Prendre l'avant-dernier si le dernier est une marque-catégorie combinée
      const unique = breadcrumbs.filter((b, i, arr) =>
        i === arr.findIndex(x => x.catalogId === b.catalogId)
      );
      data.catalog_id = unique[unique.length - 1]?.catalogId || null;
    }

    // ── 3. Détails de la sidebar (innerText parsing) ──
    const body = document.body.innerText;
    const detailsMap = {
      'Taille': 'size',
      'État': 'state',
      'Couleur': 'color',
      'Marque': 'brand',
      'Matière': 'material',
      'Style': 'style',
      'Motif': 'pattern',
      'Coupe': 'cut',
      'Longueur': 'length',
    };
    for (const [label, key] of Object.entries(detailsMap)) {
      const rx = new RegExp(label + '\\s+([^\\n]+)');
      const m = body.match(rx);
      if (m) {
        const val = m[1].trim();
        // Ne pas écraser les valeurs déjà trouvées sauf si vides
        if (!data[key] || data[key] === '') data[key] = val;
      }
    }

    // ── 4. DOM fallback pour le titre ──
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

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;">Chargement\u2026</span>';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.style.cursor = 'wait';

    try {
      // Extract data from the page directly (no API call needed)
      const extracted = extractArticleFromPage();
      if (!extracted.title) throw new Error('Impossible de lire les données de l\'article');

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

      await chrome.storage.local.set({ revint_sell_similar: sellSimilarData });

      window.location.href = `${window.location.origin}/items/new`;
    } catch (e) {
      btn.textContent = 'Erreur : ' + (e.message || 'Réessayez');
      btn.style.color = '#FF6B6B';
      btn.style.background = '#2a1515';
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.color = '#FAF7F2';
        btn.style.background = '#1A1D3A';
      }, 3000);
    }
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryInject, 800));
  } else {
    setTimeout(tryInject, 800);
  }

  // ── SPA navigation handler ──
  // Vinted est une SPA — le DOM se re-render sans rechargement
  // On observe les changements d'URL et on réinjecte le bouton
  const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) {
      // Même URL mais le DOM a peut-être été re-rendu (React)
      // Vérifier si notre bouton a disparu
      if (getItemId() && !document.getElementById('revint-sell-similar')) {
        injectRetries = 0;
        tryInject();
      }
      return;
    }
    // URL a changé (navigation SPA)
    lastUrl = currentUrl;
    const existing = document.getElementById('revint-sell-similar');
    if (existing) existing.remove();
    if (getItemId()) {
      injectRetries = 0;
      setTimeout(tryInject, 800);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ── Safety net: vérification périodique toutes les 3s ──
  // Au cas où le MutationObserver rate un re-render React
  setInterval(() => {
    if (getItemId() && !document.getElementById('revint-sell-similar')) {
      injectRetries = 0;
      tryInject();
    }
  }, 3000);
})();
