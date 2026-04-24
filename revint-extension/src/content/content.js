// Content script — CSRF token extraction + page integration
// Vinted uses Next.js SSR — CSRF is inside JSON-escaped strings in <script> tags
(function () {
  function extractCsrf() {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const t = s.textContent;
      if (!t.includes('CSRF_TOKEN')) continue;

      // Unescape d'abord (gère le double-échappement Next.js)
      const unescaped = t.replace(/\\"/g, '"').replace(/\\\\"/g, '"');

      // Regex simple sur le texte nettoyé
      const m = unescaped.match(/"CSRF_TOKEN"\s*:\s*"([^"]+)"/);
      if (m) return m[1];

      // Fallback : chercher directement un UUID après CSRF_TOKEN
      const m2 = t.match(/CSRF_TOKEN[^a-f0-9-]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (m2) return m2[1];
    }
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.content;
    return null;
  }

  function extractAnonId() {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const t = s.textContent;
      if (!t.includes('ANON_ID')) continue;

      const unescaped = t.replace(/\\"/g, '"').replace(/\\\\"/g, '"');
      const m = unescaped.match(/"ANON_ID"\s*:\s*"([^"]+)"/);
      if (m) return m[1];

      const m2 = t.match(/ANON_ID[^a-f0-9-]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (m2) return m2[1];
    }
    return null;
  }

  // Send tokens on page load
  const csrf = extractCsrf();
  const anonId = extractAnonId();
  if (csrf) {
    chrome.runtime.sendMessage({
      type: 'revint:tokensFromContent',
      csrf,
      anonId,
      origin: window.location.origin,
    });
  }

  // Re-extract on SPA navigation (Vinted is a Next.js SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        const newCsrf = extractCsrf();
        const newAnonId = extractAnonId();
        if (newCsrf) {
          chrome.runtime.sendMessage({
            type: 'revint:tokensFromContent',
            csrf: newCsrf,
            anonId: newAnonId,
            origin: window.location.origin,
          });
        }
      }, 1000);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Respond to token extraction requests
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'revint:extractTokens') {
      sendResponse({
        csrf: extractCsrf(),
        anonId: extractAnonId(),
        origin: window.location.origin,
      });
    }
  });
})();
