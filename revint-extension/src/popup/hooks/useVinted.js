import { useState, useEffect, useCallback } from 'react';

export default function useVinted() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Silent background refresh — updates cached user data without blocking UI
  const silentRefresh = useCallback(async () => {
    try {
      const state = await chrome.runtime.sendMessage({ type: 'revint:getState' });
      if (state.csrf && state.origin) {
        const result = await chrome.runtime.sendMessage({ type: 'revint:connect' });
        if (result.connected) {
          setUser(result.user);
          setConnected(true);
        }
        // Don't disconnect if background refresh fails — keep cached data
      }
    } catch {
      // Silently fail — cached data remains valid
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. First, check chrome.storage.local for cached user (instant, no network)
      const stored = await chrome.storage.local.get('revint_user');
      if (stored.revint_user) {
        // We have a cached user — show dashboard immediately
        setUser(stored.revint_user);
        setConnected(true);
        setLoading(false);

        // Then silently refresh in the background (non-blocking)
        silentRefresh();
        return;
      }

      // 2. No cached user — try to connect via background
      const state = await chrome.runtime.sendMessage({ type: 'revint:getState' });

      if (state.csrf && state.origin) {
        const result = await chrome.runtime.sendMessage({ type: 'revint:connect' });

        if (result.connected) {
          setConnected(true);
          setUser(result.user);
          setLoading(false);
          return;
        }

        if (result.error) {
          setError(result.error);
        }
      }

      // 3. Not connected
      setConnected(false);
      setError((prev) => prev || 'Ouvrez Vinted dans un onglet et naviguez pour capturer la session.');
    } catch (e) {
      setError(e.message || 'Erreur de connexion');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [silentRefresh]);

  useEffect(() => {
    connect();
  }, [connect]);

  return { connected, user, loading, error, reconnect: connect };
}
