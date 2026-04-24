import { useState, useEffect, useCallback } from 'react';

export default function useTheme() {
  const [dark, setDark] = useState(false);

  // Read initial value from chrome.storage.local on mount
  useEffect(() => {
    chrome.storage.local.get('revint_theme').then((result) => {
      if (result.revint_theme === 'dark') {
        setDark(true);
      }
    });
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      chrome.storage.local.set({ revint_theme: next ? 'dark' : 'light' });
      return next;
    });
  }, []);

  return { dark, toggle };
}
