import { useState, useEffect, useCallback } from 'react';

export default function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    chrome.storage.local.get('revint_theme')
      .then((result) => { if (result.revint_theme === 'dark') setDark(true); })
      .catch(e => console.warn('[useTheme] storage read failed:', e));

    // Sync across popup + widget: when theme flips anywhere, update here too.
    const listener = (changes) => {
      if (changes.revint_theme) {
        setDark(changes.revint_theme.newValue === 'dark');
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      chrome.storage.local.set({ revint_theme: next ? 'dark' : 'light' })
        .catch(e => console.warn('[useTheme] storage write failed:', e));
      return next;
    });
  }, []);

  return { dark, toggle };
}
