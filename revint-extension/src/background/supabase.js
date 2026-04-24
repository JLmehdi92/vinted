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

// ─── Profile ─────────────────────────────────────
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return data;
}

export async function updateProfile(fields) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_LOGGED_IN');
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Repost Logs ─────────────────────────────────
export async function logRepost({ oldItemId, newItemId, title, price, photosCount, status, error, durationMs }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('repost_logs').insert({
    user_id: user.id,
    old_item_id: oldItemId,
    new_item_id: newItemId,
    item_title: title,
    item_price: price,
    photos_count: photosCount,
    status: status || 'success',
    error_message: error,
    duration_ms: durationMs,
  });
}

export async function getRepostLogs(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('repost_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ─── Auto Message Logs ───────────────────────────
export async function logAutoMessage({ buyerUsername, buyerVintedId, itemTitle, itemId, conversationId, messageBody, triggerType, status, error }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('auto_message_logs').insert({
    user_id: user.id,
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
}

export async function getAutoMessageLogs(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('auto_message_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ─── Daily Stats ─────────────────────────────────
export async function upsertDailyStats(stats) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('daily_stats').upsert({
    user_id: user.id,
    date: today,
    ...stats,
  }, { onConflict: 'user_id,date' });
}

export async function getDailyStats(days = 14) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });
  return data || [];
}

// ─── Message Templates ───────────────────────────
export async function getTemplates() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('message_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function saveTemplate({ id, name, content, isDefault }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_LOGGED_IN');
  if (id) {
    const { data, error } = await supabase
      .from('message_templates')
      .update({ name, content, is_default: isDefault })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('message_templates')
    .insert({ user_id: user.id, name, content, is_default: isDefault })
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
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
