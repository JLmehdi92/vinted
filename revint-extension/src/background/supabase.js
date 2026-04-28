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

// ─── Cloud Backup (before repost) ────────────────
export async function backupItemToCloud(itemData) {
  const userId = await requireUserId();
  const { data, error } = await supabase.from('item_backups').upsert({
    user_id: userId,
    vinted_item_id: itemData.id,
    title: itemData.title,
    description: itemData.description,
    price: itemData.price_numeric || parseFloat(itemData.price) || 0,
    currency: itemData.price_currency || 'EUR',
    brand: itemData.brand_title || itemData.brand || '',
    size_id: itemData.size_id,
    catalog_id: itemData.catalog_id,
    status_id: itemData.status_id,
    color_ids: itemData.color_ids || [],
    photo_urls: (itemData.photos || []).map(p => p.full_size_url || p.url).filter(Boolean),
    full_payload: itemData,
  }, { onConflict: 'user_id,vinted_item_id' }).select().single();
  if (error) throw error;
  return data;
}

export async function getCloudBackups(limit = 50) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return [];
  const { data, error } = await supabase
    .from('item_backups')
    .select('id, vinted_item_id, title, price, currency, brand, photo_urls, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function deleteCloudBackup(backupId) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('item_backups')
    .delete()
    .eq('id', backupId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Feature Usage / Credits ────────────────────
// Atomic upsert — avoids race condition where two concurrent calls both read
// the same count and only increment by 1 instead of 2.
export async function incrementFeatureUsage(feature) {
  const userId = await requireUserId();
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  const { error } = await supabase.rpc('increment_feature_usage', {
    p_user_id: userId,
    p_feature: feature,
    p_date: today,
    p_month: month,
  });

  if (error) {
    // Fallback to upsert if RPC doesn't exist yet (migration not applied)
    const { error: upsertError } = await supabase.from('feature_usage').upsert({
      user_id: userId,
      feature,
      date: today,
      month,
      daily_count: 1,
      monthly_count: 1,
    }, { onConflict: 'user_id,feature,date' });
    if (upsertError) throw upsertError;
  }
}

export async function getFeatureUsage(feature) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return { daily: 0, monthly: 0 };
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  const { data } = await supabase
    .from('feature_usage')
    .select('daily_count, monthly_count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('date', today)
    .maybeSingle();

  return { daily: data?.daily_count || 0, monthly: data?.monthly_count || 0 };
}

export async function getFeatureLimits() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('plan, daily_repost_limit, daily_message_limit, monthly_repost_limit')
    .eq('id', userId)
    .single();
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
