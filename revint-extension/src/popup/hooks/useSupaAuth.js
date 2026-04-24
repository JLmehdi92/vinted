import { useState, useEffect, useCallback } from 'react';

export default function useSupaAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionRes = await chrome.runtime.sendMessage({ type: 'revint:supaGetSession' });
      if (sessionRes?.error) throw new Error(sessionRes.error);
      setSession(sessionRes?.session || null);
      if (sessionRes?.session) {
        const profileRes = await chrome.runtime.sendMessage({ type: 'revint:supaGetProfile' });
        if (profileRes?.error) throw new Error(profileRes.error);
        setProfile(profileRes?.profile || null);
      }
    } catch (e) {
      console.error('[useSupaAuth]', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'revint:supaSignIn', email, password,
      });
      if (result.error) throw new Error(result.error);
      await checkSession();
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [checkSession]);

  const signUp = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'revint:supaSignUp', email, password,
      });
      if (result.error) throw new Error(result.error);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await chrome.runtime.sendMessage({ type: 'revint:supaSignOut' });
    setSession(null);
    setProfile(null);
  }, []);

  return { session, profile, loading, error, signIn, signUp, signOut, refresh: checkSession };
}
