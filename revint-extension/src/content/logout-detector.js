// Logout detector — monitors Vinted session changes and notifies the service worker.
// Dotb pattern: poll URL every 1s + detect logout button clicks.
(() => {
  let lastUrl = location.href;

  const checkUrl = () => {
    const current = location.href;
    if (current !== lastUrl) {
      const wasLoggedIn = !lastUrl.includes('/auth/login') && !lastUrl.includes('/auth/signup');
      const isLoggedOut = current.includes('/auth/login') || current.includes('/auth/signup');
      if (wasLoggedIn && isLoggedOut) {
        chrome.runtime.sendMessage({ type: 'revint:vintedLogout', oldUrl: lastUrl, newUrl: current }).catch(() => {});
      }
      lastUrl = current;
    }
  };

  setInterval(checkUrl, 1000);

  const attachLogoutListener = () => {
    const logoutLinks = document.querySelectorAll('a[href*="log_out"], a[href*="logout"], button[data-testid="logout"]');
    logoutLinks.forEach(el => {
      if (el.dataset.revintLogout) return;
      el.dataset.revintLogout = '1';
      el.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'revint:vintedLogout', trigger: 'button' }).catch(() => {});
      });
    });
  };

  attachLogoutListener();
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; attachLogoutListener(); }, 500);
  }).observe(document.body, { childList: true, subtree: true });
})();
