// Bridge between chrome.storage (isolated world) and form-filler.js (MAIN world).
// Runs only on /items/new.
(function() {
  if (!window.location.pathname.includes('/items/new')) return;

  chrome.storage.local.get('revint_sell_similar', (result) => {
    if (chrome.runtime.lastError) {
      console.warn('[ReVint bridge] storage read failed:', chrome.runtime.lastError.message);
      return;
    }
    const data = result.revint_sell_similar;
    if (!data) return;

    // Expire stale payloads (>5 min old). Nothing to dispatch in that case.
    if (Date.now() - (data.timestamp || 0) > 5 * 60 * 1000) {
      chrome.storage.local.remove('revint_sell_similar');
      return;
    }

    // MAIN-world and ISOLATED-world content scripts load in undefined relative
    // order. If we dispatch before form-filler.js has added its listener, the
    // event is lost (CustomEvent doesn't queue). Retry until we get the
    // fillFormResult ack, max 10× at 500ms intervals.
    let attempts = 0;
    const maxAttempts = 10;
    let acknowledged = false;
    let retryInterval = null;

    function dispatch() {
      window.dispatchEvent(new CustomEvent('revint:fillNewItemForm', { detail: data }));
      attempts++;
    }

    window.addEventListener('revint:fillFormResult', () => {
      acknowledged = true;
      if (retryInterval) clearInterval(retryInterval);
      // Only clear storage AFTER the MAIN world has confirmed receipt — if
      // the user reloads the form we still want the data to survive.
      chrome.storage.local.remove('revint_sell_similar');
    }, { once: true });

    dispatch();
    retryInterval = setInterval(() => {
      if (acknowledged || attempts >= maxAttempts) {
        clearInterval(retryInterval);
        retryInterval = null;
        // After max retries without ack, clear the payload anyway so future
        // /items/new visits aren't stuck with stale data.
        if (!acknowledged) chrome.storage.local.remove('revint_sell_similar');
        return;
      }
      dispatch();
    }, 500);
  });
})();
