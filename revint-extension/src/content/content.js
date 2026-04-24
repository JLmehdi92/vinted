// Content script — CSRF / ANON_ID extraction from Vinted pages.
//
// Vinted uses Next.js SSR and embeds config in __NEXT_DATA__ as a stringified
// JSON inside another JSON string. Quotes appear in three forms depending on
// the layer: ", \\", and \". We unescape in that specific order — reversing
// steps 2 and 3 would collapse \\" to " before the inner layer is resolved
// and corrupt the payload.
(function () {
  function extractTokenFromText(text, key) {
    if (!text || !text.includes(key)) return null;
    const unescaped = text
      .replace(/\\u0022/g, '"')
      .replace(/\\\\"/g, '"')
      .replace(/\\"/g, '"');
    const keyRe = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`);
    const m = unescaped.match(keyRe);
    if (m) return m[1];
    const uuidRe = new RegExp(`${key}[^a-f0-9-]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})`, 'i');
    const m2 = text.match(uuidRe);
    return m2 ? m2[1] : null;
  }

  function extractCsrf() {
    for (const s of document.querySelectorAll('script')) {
      const t = extractTokenFromText(s.textContent, 'CSRF_TOKEN');
      if (t) return t;
    }
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : null;
  }

  function extractAnonId() {
    for (const s of document.querySelectorAll('script')) {
      const t = extractTokenFromText(s.textContent, 'ANON_ID');
      if (t) return t;
    }
    return null;
  }

  function sendTokens() {
    const csrf = extractCsrf();
    const anonId = extractAnonId();
    if (!csrf) return;
    chrome.runtime.sendMessage({
      type: 'revint:tokensFromContent',
      csrf,
      anonId,
      origin: window.location.origin,
    }).catch(e => {
      console.warn('[ReVint content] token send failed:', e);
    });
  }

  sendTokens();

  // Vinted is an SPA; re-extract when the URL changes. Debounce to coalesce
  // rapid React re-renders into a single extraction.
  let lastUrl = location.href;
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; sendTokens(); }, 1000);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });

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
