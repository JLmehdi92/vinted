// Supabase client for the extension background service worker
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      // Use chrome.storage.local as auth storage for MV3 service worker
      getItem: async (key) => {
        const data = await chrome.storage.local.get(key);
        return data[key] || null;
      },
      setItem: async (key, value) => {
        await chrome.storage.local.set({ [key]: value });
      },
      removeItem: async (key) => {
        await chrome.storage.local.remove(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Cache the current user id so every write doesn't round-trip getUser().
// onAuthStateChange fires on sign-in/out and token refresh — keeps cache fresh.
let cachedUserId = null;
supabase.auth.getUser().then(({ data }) => { cachedUserId = data?.user?.id || null; }).catch(() => {});
supabase.auth.onAuthStateChange((_evt, session) => {
  cachedUserId = session?.user?.id || null;
});

async function requireUserId() {
  if (cachedUserId) return cachedUserId;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user) throw new Error('NOT_LOGGED_IN');
  cachedUserId = data.user.id;
  return cachedUserId;
}

// PGRST116 = no rows returned (not an error for .single() when the row doesn't exist yet)
function isNoRows(error) {
  return error?.code === 'PGRST116';
}

// ─── Profile ─────────────────────────────────────
export async function getProfile() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && !isNoRows(error)) throw error;
  return data;
}

export async function updateProfile(fields) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Repost Logs ─────────────────────────────────
export async function logRepost({ oldItemId, newItemId, title, price, photosCount, status, error, durationMs }) {
  const userId = await requireUserId();
  const { error: insertError } = await supabase.from('repost_logs').insert({
    user_id: userId,
    old_item_id: oldItemId,
    new_item_id: newItemId,
    item_title: title,
    item_price: price,
    photos_count: photosCount,
    status: status || 'success',
    error_message: error,
    duration_ms: durationMs,
  });
  if (insertError) throw insertError;
}

export async function getRepostLogs(limit = 50) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return [];
  const { data, error } = await supabase
    .from('repost_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ─── Auto Message Logs ───────────────────────────
export async function logAutoMessage({ buyerUsername, buyerVintedId, itemTitle, itemId, conversationId, messageBody, triggerType, status, error }) {
  const userId = await requireUserId();
  const { error: insertError } = await supabase.from('auto_message_logs').insert({
    user_id: userId,
    buyer_username: buyerUsername,
    buyer_vinted_id: buyerVintedId,
    item_title: itemTitle,
    item_id: itemId,
    conversation_id: conversationId,
    message_body: messageBody,
    trigger_type: triggerType || 'favorite',
    status: status || 'sent',
    error_message: error,
  });
  if (insertError) throw insertError;
}

export async function getAutoMessageLogs(limit = 50) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return [];
  const { data, error } = await supabase
    .from('auto_message_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ─── Daily Stats ─────────────────────────────────
export async function upsertDailyStats(stats) {
  const userId = await requireUserId();
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase.from('daily_stats').upsert({
    user_id: userId,
    date: today,
    ...stats,
  }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function getDailyStats(days = 14) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ─── Message Templates ───────────────────────────
export async function getTemplates() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return [];
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveTemplate({ id, name, content, isDefault }) {
  const userId = await requireUserId();
  if (id) {
    const { data, error } = await supabase
      .from('message_templates')
      .update({ name, content, is_default: isDefault })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('message_templates')
    .insert({ user_id: userId, name, content, is_default: isDefault })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Auth helpers ────────────────────────────────
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
