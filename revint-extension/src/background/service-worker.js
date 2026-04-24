import {
  setState, getState, restoreState, refreshCsrf,
  getCurrentUser, getUserItems, getItemDetails,
  updateItem, deleteItem, repostItem, uploadPhoto, fetchImageAsBlob,
  getNotifications, sendMessage, getInbox, delay,
} from './vinted-api.js';

import {
  supabase, getSession, signIn, signUp, signOut,
  getProfile, updateProfile,
  logRepost, getRepostLogs,
  logAutoMessage, getAutoMessageLogs,
  upsertDailyStats, getDailyStats,
  getTemplates, saveTemplate,
} from './supabase.js';

// ─── Restore state on wake ──────────────────────────
restoreState();

// ─── Intercept Vinted requests to capture CSRF + anon-id tokens ───
const vintedApiPatterns = [
  'https://www.vinted.fr/api/*', 'https://www.vinted.be/api/*',
  'https://www.vinted.es/api/*', 'https://www.vinted.it/api/*',
  'https://www.vinted.de/api/*', 'https://www.vinted.nl/api/*',
  'https://www.vinted.pt/api/*', 'https://www.vinted.pl/api/*',
  'https://www.vinted.lt/api/*', 'https://www.vinted.co.uk/api/*',
  'https://www.vinted.com/api/*',
];

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    let csrf = null, anonId = null;
    for (const h of details.requestHeaders) {
      const name = h.name.toLowerCase();
      if (name === 'x-csrf-token') csrf = h.value;
      if (name === 'x-anon-id') anonId = h.value;
    }
    if (csrf) {
      const origin = new URL(details.url).origin;
      setState({ csrf, anonId, origin });
    }
  },
  { urls: vintedApiPatterns },
  ['requestHeaders', 'extraHeaders']
);

// ─── Message handler for popup / content scripts ────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg)
    .then(sendResponse)
    .catch(e => sendResponse({ error: e.message }));
  return true;
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'revint:getState':
      return getState();

    case 'revint:tokensFromContent': {
      if (msg.csrf) setState({ csrf: msg.csrf, anonId: msg.anonId, origin: msg.origin });
      return { ok: true };
    }

    case 'revint:connect': {
      let st = getState();

      // Si pas de CSRF, tenter de le récupérer depuis les onglets Vinted ouverts
      if (!st.csrf || !st.origin) {
        // Essayer d'extraire le CSRF depuis un onglet Vinted actif
        try {
          const tabs = await chrome.tabs.query({ url: [
            'https://www.vinted.fr/*', 'https://www.vinted.be/*', 'https://www.vinted.es/*',
            'https://www.vinted.it/*', 'https://www.vinted.de/*', 'https://www.vinted.nl/*',
            'https://www.vinted.pt/*', 'https://www.vinted.pl/*', 'https://www.vinted.lt/*',
            'https://www.vinted.co.uk/*', 'https://www.vinted.com/*',
          ] });
          if (tabs.length > 0) {
            const origin = new URL(tabs[0].url).origin;
            await refreshCsrf(origin);
            st = getState();
          }
        } catch { /* ignore tab query errors */ }
      }

      // Si toujours pas de CSRF, tenter un fetch direct
      if (!st.csrf || !st.origin) {
        const refreshed = await refreshCsrf('https://www.vinted.fr');
        if (refreshed) st = getState();
      }

      if (!st.csrf || !st.origin) {
        return { connected: false, error: 'Ouvrez Vinted dans un onglet et naviguez pour capturer la session.' };
      }

      try {
        const user = await getCurrentUser();
        setState({ userId: user.id });
        await chrome.storage.local.set({
          revint_user: {
            id: user.id,
            login: user.login,
            photo: user.photo?.url,
            item_count: user.item_count,
          },
        });
        return { connected: true, user };
      } catch (e) {
        // Si l'appel échoue, le CSRF est peut-être périmé — tenter un refresh
        const refreshed = await refreshCsrf(st.origin);
        if (refreshed) {
          try {
            const user = await getCurrentUser();
            setState({ userId: user.id });
            await chrome.storage.local.set({
              revint_user: {
                id: user.id,
                login: user.login,
                photo: user.photo?.url,
                item_count: user.item_count,
              },
            });
            return { connected: true, user };
          } catch (e2) {
            return { connected: false, error: e2.message };
          }
        }
        return { connected: false, error: e.message };
      }
    }

    case 'revint:getItems': {
      const st = getState();
      if (!st.userId) throw new Error('NOT_CONNECTED');
      return getUserItems(st.userId, msg.page || 1, msg.perPage || 96);
    }

    case 'revint:getItemDetails':
      return getItemDetails(msg.itemId);

    case 'revint:updateItem':
      return updateItem(msg.itemId, msg.fields);

    case 'revint:deleteItem':
      return deleteItem(msg.itemId);

    case 'revint:repost': {
      const result = await repostItem(msg.itemId, (step, id, a, b) => {
        chrome.storage.local.set({
          revint_repost_progress: { step, itemId: id, a, b },
        });
      });
      return { success: true, newItem: result };
    }

    case 'revint:repostBatch': {
      const results = [];
      const total = msg.itemIds.length;
      for (let i = 0; i < total; i++) {
        const itemId = msg.itemIds[i];
        await chrome.storage.local.set({
          revint_repost_progress: { total, done: i, current: itemId, status: 'running' },
        });
        const startTime = Date.now();
        try {
          const result = await repostItem(itemId);
          results.push({ itemId, success: true, newId: result.item?.id });
          logRepost({
            oldItemId: itemId,
            newItemId: result.item?.id,
            title: result.item?.title,
            price: result.item?.price,
            photosCount: result.item?.photos?.length || 0,
            status: 'success',
            durationMs: Date.now() - startTime,
          }).catch(() => {});
        } catch (e) {
          results.push({ itemId, success: false, error: e.message });
          logRepost({
            oldItemId: itemId,
            status: 'failed',
            error: e.message,
            durationMs: Date.now() - startTime,
          }).catch(() => {});
        }
        // Random delay between reposts (anti-spam)
        if (i < total - 1) {
          const minMs = (msg.delayMin || 3) * 60000;
          const maxMs = (msg.delayMax || 12) * 60000;
          await delay(minMs + Math.random() * (maxMs - minMs));
        }
      }
      await chrome.storage.local.set({
        revint_repost_progress: { total, done: total, status: 'complete', results },
      });
      return { results };
    }

    case 'revint:getNotifications':
      return getNotifications(msg.page || 1);

    case 'revint:sendMessage':
      return sendMessage(msg.conversationId, msg.body);

    case 'revint:getInbox':
      return getInbox(msg.page || 1);

    case 'revint:fetchImage': {
      const blob = await fetchImageAsBlob(msg.url);
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onload = () => resolve({ ok: true, dataUrl: reader.result });
        reader.readAsDataURL(blob);
      });
    }

    // ─── Supabase handlers ─────────────────────────────
    case 'revint:supaSignUp': {
      const result = await signUp(msg.email, msg.password);
      return { ok: true, user: result.user };
    }

    case 'revint:supaSignIn': {
      const result = await signIn(msg.email, msg.password);
      return { ok: true, user: result.user, session: result.session };
    }

    case 'revint:supaSignOut': {
      await signOut();
      return { ok: true };
    }

    case 'revint:supaGetSession': {
      const session = await getSession();
      return { session };
    }

    case 'revint:supaGetProfile': {
      const profile = await getProfile();
      return { profile };
    }

    case 'revint:supaUpdateProfile': {
      const profile = await updateProfile(msg.fields);
      return { profile };
    }

    case 'revint:supaGetTemplates': {
      const templates = await getTemplates();
      return { templates };
    }

    case 'revint:supaSaveTemplate': {
      const template = await saveTemplate(msg.template);
      return { template };
    }

    case 'revint:supaGetRepostLogs': {
      const logs = await getRepostLogs(msg.limit);
      return { logs };
    }

    case 'revint:supaGetAutoMessageLogs': {
      const logs = await getAutoMessageLogs(msg.limit);
      return { logs };
    }

    case 'revint:supaGetDailyStats': {
      const stats = await getDailyStats(msg.days);
      return { stats };
    }

    case 'revint:bulkEdit': {
      const results = [];
      for (const itemId of msg.itemIds) {
        try {
          await updateItem(itemId, msg.fields);
          results.push({ itemId, success: true });
        } catch (e) {
          results.push({ itemId, success: false, error: e.message });
        }
        // 2-5s delay between edits
        if (msg.itemIds.indexOf(itemId) < msg.itemIds.length - 1) {
          await delay(2000 + Math.random() * 3000);
        }
      }
      return { results };
    }

    case 'revint:scheduleRepost': {
      await chrome.storage.local.set({
        revint_scheduled_repost: {
          itemIds: msg.itemIds,
          delayMin: msg.delayMin,
          delayMax: msg.delayMax,
        },
      });
      chrome.alarms.create('revint:scheduledRepost', { when: msg.when });
      return { scheduled: true, when: msg.when };
    }

    case 'revint:getSnapshots': {
      const { revint_snapshots: snapshots } = await chrome.storage.local.get('revint_snapshots');
      return { snapshots: snapshots || {} };
    }

    default:
      throw new Error(`UNKNOWN_MSG: ${msg.type}`);
  }
}

// ─── Auto-reply alarm ───────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'revint:autoReply') {
    await processAutoReply();
  }
  if (alarm.name === 'revint:dailyStatsSync') {
    await syncDailyStats();
  }
  if (alarm.name === 'revint:snapshot') {
    await captureSnapshot();
  }
  if (alarm.name === 'revint:scheduledRepost') {
    const { revint_scheduled_repost: sched } = await chrome.storage.local.get('revint_scheduled_repost');
    if (sched?.itemIds) {
      for (const itemId of sched.itemIds) {
        try { await repostItem(itemId); } catch (e) { console.error('[ReVint] Scheduled repost failed:', itemId, e); }
        const minMs = (sched.delayMin || 5) * 60000;
        const maxMs = (sched.delayMax || 15) * 60000;
        await delay(minMs + Math.random() * (maxMs - minMs));
      }
      await chrome.storage.local.remove('revint_scheduled_repost');
    }
  }
});

async function processAutoReply() {
  const { revint_auto_reply: config } = await chrome.storage.local.get('revint_auto_reply');
  if (!config?.enabled) return;

  const { revint_settings: settings } = await chrome.storage.local.get('revint_settings');
  const hour = new Date().getHours();
  const actStart = settings?.activity_start ?? 9;
  const actEnd = settings?.activity_end ?? 22;
  if (hour < actStart || hour >= actEnd) {
    console.log('[ReVint] Hors fenetre activite, skip auto-reply');
    return;
  }

  try {
    // ── Rate limit: max 18 notification reads per hour ──
    const { revint_notif_hourly: hourly } = await chrome.storage.local.get('revint_notif_hourly');
    const currentHour = new Date().toISOString().slice(0, 13); // "2026-04-21T14"
    let notifReadsThisHour = (hourly?.hour === currentHour) ? hourly.count : 0;

    if (notifReadsThisHour >= 18) {
      console.log('[ReVint] Notification read limit reached for this hour, skipping');
      return;
    }

    // ── M9: persistent daily counter ──
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const { revint_auto_reply_daily: dailyData } =
      await chrome.storage.local.get('revint_auto_reply_daily');
    let dailyCount = (dailyData && dailyData.date === today) ? dailyData.count : 0;

    const dailyLimit = config.dailyLimit || settings?.daily_msg_limit || 30;

    if (dailyCount >= dailyLimit) return;

    const { notifications } = await getNotifications(1);
    notifReadsThisHour++;
    await chrome.storage.local.set({ revint_notif_hourly: { hour: currentHour, count: notifReadsThisHour } });
    const favoriteNotifs = (notifications || []).filter(
      n => n.link && n.link.includes('?offering_id=')
    );

    let filteredNotifs = favoriteNotifs;
    if (config.ignoreRecent) {
      filteredNotifs = filteredNotifs.filter(n => {
        const ts = n.created_at || n.timestamp || 0;
        const ageSeconds = (Date.now() / 1000) - (typeof ts === 'number' ? ts : new Date(ts).getTime() / 1000);
        return ageSeconds > 86400;
      });
    }

    const { revint_replied_ids: existing } = await chrome.storage.local.get('revint_replied_ids');
    const repliedIds = new Set(existing || []);

    for (const notif of filteredNotifs) {
      if (config.noDuplicates !== false && repliedIds.has(notif.id)) continue;
      if (dailyCount >= dailyLimit) break;

      const match = notif.link.match(/\/inbox\/(\d+)/);
      if (!match) continue;

      const offeringMatch = notif.link.match(/offering_id=(\d+)/);
      const itemId = offeringMatch ? offeringMatch[1] : null;

      let itemTitle = '', itemPrice = '', itemBrand = '';
      if (itemId) {
        try {
          const { item } = await getItemDetails(parseInt(itemId));
          itemTitle = item?.title || '';
          itemPrice = (item?.price_numeric || item?.price || '') + '€';
          itemBrand = item?.brand_title || item?.brand || '';
        } catch {
          // silently fail — send message without item details
        }
      }

      let message = config.template || '';
      const name = extractName(notif.body);
      message = resolveVariations(message);
      message = message
        .replace(/\{\{prenom\}\}/g, name || '')
        .replace(/\{\{article\}\}/g, itemTitle)
        .replace(/\{\{prix\}\}/g, itemPrice)
        .replace(/\{\{marque\}\}/g, itemBrand);

      const msgStart = Date.now();
      try {
        await sendMessage(match[1], message);
        repliedIds.add(notif.id);
        dailyCount++;
        await chrome.storage.local.set({
          revint_auto_reply_daily: { date: today, count: dailyCount },
        });

        logAutoMessage({
          buyerUsername: name || undefined,
          conversationId: match[1],
          itemId: itemId || undefined,
          itemTitle: itemTitle || undefined,
          messageBody: message,
          triggerType: 'favorite',
          status: 'success',
        }).catch(() => {});
      } catch (msgErr) {
        logAutoMessage({
          buyerUsername: name || undefined,
          conversationId: match[1],
          itemId: itemId || undefined,
          itemTitle: itemTitle || undefined,
          messageBody: message,
          triggerType: 'favorite',
          status: 'failed',
          error: msgErr.message,
        }).catch(() => {});
      }

      // Configurable delay between messages
      const minDelaySec = (config.delayMin || 1) * 60;
      const maxDelaySec = (config.delayMax || 5) * 60;
      await delay((minDelaySec + Math.random() * (maxDelaySec - minDelaySec)) * 1000);
    }

    await chrome.storage.local.set({ revint_replied_ids: [...repliedIds] });
  } catch (e) {
    console.error('[ReVint] Auto-reply error:', e);
  }
}

async function syncDailyStats() {
  try {
    const st = getState();
    if (!st.userId) return;
    const data = await getUserItems(st.userId, 1, 96);
    const items = data.items || [];
    let totalViews = 0;
    let totalFavs = 0;
    for (const item of items) {
      totalViews += item.view_count || 0;
      totalFavs += item.favourite_count || 0;
    }
    await upsertDailyStats({
      totalItems: items.length,
      totalViews,
      totalFavs,
    });
  } catch (e) {
    console.error('[ReVint] Daily stats sync error:', e);
  }
}

async function captureSnapshot() {
  try {
    const st = getState();
    if (!st.userId || !st.csrf) return;

    const data = await getUserItems(st.userId, 1, 96);
    const items = data?.items || [];

    const today = new Date().toISOString().split('T')[0];
    const totals = { views: 0, favs: 0, items: items.length };

    for (const item of items) {
      totals.views += item.view_count ?? 0;
      totals.favs += item.favourite_count ?? 0;
    }

    // Read existing snapshots
    const { revint_snapshots: existing } = await chrome.storage.local.get('revint_snapshots');
    const snapshots = existing || {};

    // Store today's snapshot (overwrite if already exists today)
    snapshots[today] = { timestamp: Date.now(), totals };

    // Keep only last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    for (const key of Object.keys(snapshots)) {
      if (key < cutoffStr) delete snapshots[key];
    }

    await chrome.storage.local.set({ revint_snapshots: snapshots });
  } catch (e) {
    console.error('[ReVint] Snapshot error:', e);
  }
}

function resolveVariations(text) {
  return text.replace(/\{([^}]+)\}/g, (match, group) => {
    // Skip template variables like {{prenom}}
    if (match.startsWith('{{')) return match;
    const options = group.split('|');
    return options[Math.floor(Math.random() * options.length)];
  });
}

function extractName(html) {
  if (!html) return null;
  const m = html.match(/>([^<]+)<\/a>/);
  return m ? m[1].split('_')[0] : null;
}

// ─── Install / startup ──────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('revint:autoReply', { periodInMinutes: 5 });
  chrome.alarms.create('revint:dailyStatsSync', { periodInMinutes: 360 });
  chrome.alarms.create('revint:snapshot', { periodInMinutes: 240 });
});

// Re-create alarms on service worker startup (they may have been lost)
chrome.alarms.get('revint:autoReply', (alarm) => {
  if (!alarm) {
    chrome.alarms.create('revint:autoReply', { periodInMinutes: 5 });
  }
});
chrome.alarms.get('revint:dailyStatsSync', (alarm) => {
  if (!alarm) {
    chrome.alarms.create('revint:dailyStatsSync', { periodInMinutes: 360 });
  }
});
chrome.alarms.get('revint:snapshot', (alarm) => {
  if (!alarm) {
    chrome.alarms.create('revint:snapshot', { periodInMinutes: 240 });
  }
});
