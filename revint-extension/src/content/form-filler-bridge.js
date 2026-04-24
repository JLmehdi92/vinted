// Bridge entre chrome.storage (isolated world) et form-filler.js (main world)
// S'active uniquement sur /items/new

(function() {
  if (!window.location.pathname.includes('/items/new')) return;

  // Lire les données sell_similar depuis chrome.storage
  chrome.storage.local.get('revint_sell_similar', (result) => {
    const data = result.revint_sell_similar;
    if (!data) return;

    // Vérifier que les données sont récentes (< 5 minutes)
    if (Date.now() - (data.timestamp || 0) > 5 * 60 * 1000) {
      chrome.storage.local.remove('revint_sell_similar');
      return;
    }

    // Envoyer les données au MAIN world via CustomEvent
    // Retry mechanism: the MAIN world script may not have registered its listener yet
    let attempts = 0;
    const maxAttempts = 10;
    function dispatchToMainWorld() {
      window.dispatchEvent(new CustomEvent('revint:fillNewItemForm', { detail: data }));
      attempts++;
    }

    // Listen for acknowledgement from MAIN world
    let acknowledged = false;
    window.addEventListener('revint:fillFormResult', () => {
      acknowledged = true;
    }, { once: true });

    dispatchToMainWorld();

    // Retry every 500ms if not acknowledged
    const retryInterval = setInterval(() => {
      if (acknowledged || attempts >= maxAttempts) {
        clearInterval(retryInterval);
        return;
      }
      dispatchToMainWorld();
    }, 500);

    // Nettoyer après utilisation
    chrome.storage.local.remove('revint_sell_similar');
  });
})();
