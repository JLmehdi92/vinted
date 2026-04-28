import {
  setState, getState, restoreState, refreshCsrf,
  getCurrentUser, getUserItems, getItemDetails,
  updateItem, deleteItem, repostItem, fetchImageAsBlob,
  getNotifications, sendMessage, getInbox, delay,
  withKeyMutex,
  getConversation, acceptOffer, rejectOffer, sendCounterOffer,
  sendDiscountOffer, uploadPhotoWithRetry, transformImageIterative,
} from './vinted-api.js';

import {
  getSession, signIn, signUp, signOut,
  getProfile, updateProfile,
  logRepost, getRepostLogs,
  logAutoMessage, getAutoMessageLogs,
  upsertDailyStats, getDailyStats,
  getTemplates, saveTemplate,
  backupItemToCloud, getCloudBackups, deleteCloudBackup,
  incrementFeatureUsage, getFeatureUsage, getFeatureLimits,
} from './supabase.js';

// ─── Restore state on wake ──────────────────────────
restoreState();

// ─── Background error channel ────────────────────────
// Persist any background-task failure so the popup can surface a banner
// to the user. Alarms run without an open console; without this the user
// never learns that auto-reply was blocked by DataDome, stats failed to
// sync, etc.
async function recordBackgroundError(scope, error) {
  try {
    await chrome.storage.local.set({
      revint_last_error: {
        scope,
        message: error?.message || String(error),
        timestamp: Date.now(),
      },
    });
  } catch {
    // Nothing we can do if storage itself is broken — log and move on.
    console.error('[ReVint]', scope, error);
  }
}

// ─── Intercept Vinted requests to capture CSRF + anon-id tokens ───
const vintedApiPatterns = [
  'https://www.vinted.fr/api/*', 'https://www.vinted.be/api/*',
  'https://www.vinted.es/api/*', 'https://www.vinted.it/api/*',
  'https://www.vinted.de/api/*', 'https://www.vinted.nl/api/*',
  'https://www.vinted.pt/api/*', 'https://www.vinted.pl/api/*',
  'https://www.vinted.lt/api/*', 'https://www.vinted.co.uk/api/*',
  'https://www.vinted.com/api/*', 'https://www.vinted.lu/api/*',
  'https://www.vinted.at/api/*', 'https://www.vinted.cz/api/*',
  'https://www.vinted.sk/api/*', 'https://www.vinted.se/api/*',
  'https://www.vinted.hu/api/*', 'https://www.vinted.ro/api/*',
  'https://www.vinted.dk/api/*', 'https://www.vinted.fi/api/*',
  'https://www.vinted.hr/api/*', 'https://www.vinted.gr/api/*',
  'https://www.vinted.net/api/*',
];

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    try {
      let csrf = null, anonId = null;
      for (const h of details.requestHeaders) {
        const name = h.name.toLowerCase();
        if (name === 'x-csrf-token') csrf = h.value;
        if (name === 'x-anon-id') anonId = h.value;
      }
      if (csrf) {
        const origin = new URL(details.url).origin;
        const st = getState();
        // Only write to storage when something actually changed — the hot
        // path here would otherwise hammer storage.session on every API call.
        if (csrf !== st.csrf || anonId !== st.anonId || origin !== st.origin) {
          setState({ csrf, anonId, origin });
        }
      }
    } catch (e) {
      console.warn('[ReVint] webRequest handler error:', e);
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

async function ensureConnectedUser() {
  let st = getState();

  if (!st.csrf || !st.origin) {
    try {
      const tabs = await chrome.tabs.query({ url: [
        'https://www.vinted.fr/*', 'https://www.vinted.be/*', 'https://www.vinted.es/*',
        'https://www.vinted.it/*', 'https://www.vinted.de/*', 'https://www.vinted.nl/*',
        'https://www.vinted.pt/*', 'https://www.vinted.pl/*', 'https://www.vinted.lt/*',
        'https://www.vinted.co.uk/*', 'https://www.vinted.com/*', 'https://www.vinted.lu/*',
        'https://www.vinted.at/*', 'https://www.vinted.cz/*', 'https://www.vinted.sk/*',
        'https://www.vinted.se/*', 'https://www.vinted.hu/*', 'https://www.vinted.ro/*',
        'https://www.vinted.dk/*', 'https://www.vinted.fi/*', 'https://www.vinted.hr/*',
        'https://www.vinted.gr/*', 'https://www.vinted.net/*',
      ] });
      if (tabs.length > 0) {
        const origin = new URL(tabs[0].url).origin;
        await refreshCsrf(origin);
        st = getState();
      }
    } catch { /* ignore tab query errors */ }
  }

  if (!st.csrf || !st.origin) {
    const refreshed = await refreshCsrf('https://www.vinted.fr');
    if (refreshed?.ok) st = getState();
    else if (refreshed?.reason === 'datadome') {
      throw new Error('DATADOME_CHALLENGE: Ouvrez Vinted et resolvez le CAPTCHA, puis reessayez.');
    }
  }

  if (!st.csrf || !st.origin) {
    throw new Error('NO_SESSION: Ouvrez Vinted dans un onglet et naviguez pour capturer la session.');
  }

  try {
    return await getCurrentUser();
  } catch (firstError) {
    // CSRF may just be stale — refresh once and retry.
    const refreshed = await refreshCsrf(st.origin);
    if (!refreshed?.ok) throw firstError;
    return await getCurrentUser();
  }
}

async function persistUser(user) {
  setState({ userId: user.id });
  await chrome.storage.local.set({
    revint_user: {
      id: user.id,
      login: user.login,
      photo: user.photo?.url,
      item_count: user.item_count,
    },
  });
}

async function handleMessage(msg) {
  switch (msg.type) {
    case 'revint:getState':
      return getState();

    case 'revint:tokensFromContent': {
      if (msg.csrf) setState({ csrf: msg.csrf, anonId: msg.anonId, origin: msg.origin });
      return { ok: true };
    }

    case 'revint:connect': {
      try {
        const user = await ensureConnectedUser();
        await persistUser(user);
        return { connected: true, user };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    }

    case 'revint:getItems': {
      let st = getState();
      if (!st.userId) {
        // Try to connect first — the widget/popup may have opened before
        // the user navigated on Vinted, so userId was never set.
        try {
          const user = await ensureConnectedUser();
          await persistUser(user);
          st = getState();
        } catch {
          // Still no user — return empty list instead of crashing.
          return { items: [], pagination: null };
        }
      }
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

    // repostBatch and scheduledRepost both persist state to storage and
    // drive the batch from chained one-shot alarms. This survives SW
    // termination and MV3 lifecycle resets, which a `await delay()` loop
    // inside a single handler does not.
    case 'revint:repostBatch': {
      await chrome.storage.local.set({
        revint_repost_batch: {
          itemIds: msg.itemIds,
          currentIndex: 0,
          results: [],
          delayMin: msg.delayMin || 3,
          delayMax: msg.delayMax || 12,
          status: 'running',
          startedAt: Date.now(),
        },
        revint_repost_progress: { total: msg.itemIds.length, done: 0, status: 'running' },
      });
      // Kick off immediately via a 1s alarm so the response promise resolves first.
      chrome.alarms.create('revint:batchTick', { when: Date.now() + 1000 });
      return { started: true };
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
      return new Promise((resolve, reject) => {
        reader.onload = () => resolve({ ok: true, dataUrl: reader.result });
        reader.onerror = () => reject(reader.error || new Error('IMG_READ_FAILED'));
        reader.readAsDataURL(blob);
      });
    }

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
      // Kick off a background alarm-driven batch. Popup polls storage for progress.
      await chrome.storage.local.set({
        revint_bulk_edit: {
          itemIds: msg.itemIds,
          fields: msg.fields,
          currentIndex: 0,
          results: [],
          status: 'running',
        },
      });
      chrome.alarms.create('revint:bulkEditTick', { when: Date.now() + 500 });
      return { started: true };
    }

    case 'revint:scheduleRepost': {
      if (!msg.when || msg.when <= Date.now()) {
        throw new Error('SCHEDULE_IN_PAST');
      }
      if (!Array.isArray(msg.itemIds) || msg.itemIds.length === 0) {
        throw new Error('SCHEDULE_NO_ITEMS');
      }
      await chrome.storage.local.set({
        revint_scheduled_repost: {
          itemIds: msg.itemIds,
          total: msg.itemIds.length,
          results: [],
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

    case 'revint:getLastError': {
      const { revint_last_error } = await chrome.storage.local.get('revint_last_error');
      return { error: revint_last_error || null };
    }

    case 'revint:clearLastError': {
      await chrome.storage.local.remove('revint_last_error');
      return { ok: true };
    }

    // ─── Conversations ────────────────────────────────
    case 'revint:getConversation':
      return getConversation(msg.conversationId);

    // ─── Offer management ─────────────────────────────
    case 'revint:acceptOffer':
      return acceptOffer(msg.transactionId, msg.offerId);

    case 'revint:rejectOffer':
      return rejectOffer(msg.transactionId, msg.offerId);

    case 'revint:counterOffer':
      return sendCounterOffer(msg.transactionId, msg.price);

    case 'revint:sendDiscount':
      return sendDiscountOffer(msg.itemId, msg.buyerUserId, msg.price);

    // ─── Cloud backup ─────────────────────────────────
    case 'revint:backupToCloud': {
      const backup = await backupItemToCloud(msg.itemData);
      return { ok: true, backup };
    }

    case 'revint:getCloudBackups': {
      const backups = await getCloudBackups(msg.limit);
      return { backups };
    }

    case 'revint:deleteCloudBackup': {
      await deleteCloudBackup(msg.backupId);
      return { ok: true };
    }

    // ─── Feature usage / credits ──────────────────────
    case 'revint:incrementUsage': {
      await incrementFeatureUsage(msg.feature);
      return { ok: true };
    }

    case 'revint:getUsage': {
      const usage = await getFeatureUsage(msg.feature);
      return usage;
    }

    case 'revint:getFeatureLimits': {
      const limits = await getFeatureLimits();
      return { limits };
    }

    default:
      throw new Error(`UNKNOWN_MSG: ${msg.type}`);
  }
}

// ─── Alarm router ───────────────────────────────────
// Every long-running background flow is a state machine persisted in
// chrome.storage.local and driven by alarms. Each alarm handler performs
// ONE step and schedules its next step with chrome.alarms.create({ when }).
// This is the only way MV3 service workers can sustain multi-minute
// operations without being killed between setTimeout() calls.
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === 'revint:autoReply') await processAutoReplyTick();
    else if (alarm.name === 'revint:dailyStatsSync') await syncDailyStats();
    else if (alarm.name === 'revint:snapshot') await captureSnapshot();
    else if (alarm.name === 'revint:scheduledRepost') await processScheduledRepostTick();
    else if (alarm.name === 'revint:batchTick') await processRepostBatchTick();
    else if (alarm.name === 'revint:bulkEditTick') await processBulkEditTick();
    else if (alarm.name === 'revint:pendingDeletions') await processPendingDeletions();
  } catch (e) {
    console.error('[ReVint] alarm handler error:', alarm.name, e);
    recordBackgroundError(alarm.name, e);
  }
});

// ─── Repost batch state machine ─────────────────────
async function processRepostBatchTick() {
  const { revint_repost_batch: batch } = await chrome.storage.local.get('revint_repost_batch');
  if (!batch || batch.status !== 'running') return;

  const i = batch.currentIndex;
  if (i >= batch.itemIds.length) {
    await chrome.storage.local.set({
      revint_repost_batch: { ...batch, status: 'complete' },
      revint_repost_progress: {
        total: batch.itemIds.length,
        done: batch.itemIds.length,
        status: 'complete',
        results: batch.results,
      },
    });
    return;
  }

  const itemId = batch.itemIds[i];
  const startTime = Date.now();
  let result;
  try {
    const r = await repostItem(itemId);
    result = { itemId, success: true, newId: r.item?.id };
    logRepost({
      oldItemId: itemId,
      newItemId: r.item?.id,
      title: r.item?.title,
      price: r.item?.price,
      photosCount: r.item?.photos?.length || 0,
      status: 'success',
      durationMs: Date.now() - startTime,
    }).catch(e => console.warn('[ReVint] logRepost failed:', e));
  } catch (e) {
    result = { itemId, success: false, error: e.message };
    logRepost({
      oldItemId: itemId,
      status: 'failed',
      error: e.message,
      durationMs: Date.now() - startTime,
    }).catch(err => console.warn('[ReVint] logRepost failed:', err));
  }

  const results = [...batch.results, result];
  const nextIndex = i + 1;
  await chrome.storage.local.set({
    revint_repost_batch: { ...batch, currentIndex: nextIndex, results },
    revint_repost_progress: {
      total: batch.itemIds.length,
      done: nextIndex,
      status: nextIndex >= batch.itemIds.length ? 'complete' : 'running',
      results,
    },
  });

  if (nextIndex < batch.itemIds.length) {
    const minMs = (batch.delayMin || 3) * 60000;
    const maxMs = (batch.delayMax || 12) * 60000;
    const nextWhen = Date.now() + minMs + Math.random() * (maxMs - minMs);
    chrome.alarms.create('revint:batchTick', { when: nextWhen });
  }
}

// ─── Scheduled-repost state machine ─────────────────
// Mirrors repost-batch: writes revint_repost_progress at every step so the
// popup UI can show progress when the user returns.
async function processScheduledRepostTick() {
  const { revint_scheduled_repost: sched } = await chrome.storage.local.get('revint_scheduled_repost');
  if (!sched?.itemIds?.length) return;

  const total = sched.total || sched.itemIds.length;
  const done = total - sched.itemIds.length;
  const results = Array.isArray(sched.results) ? sched.results : [];

  const itemId = sched.itemIds[0];
  let result;
  try {
    const r = await repostItem(itemId);
    result = { itemId, success: true, newId: r.item?.id };
  } catch (e) {
    console.error('[ReVint] Scheduled repost failed:', itemId, e);
    recordBackgroundError('scheduled-repost', e);
    result = { itemId, success: false, error: e.message };
  }

  const nextResults = [...results, result];
  const remaining = sched.itemIds.slice(1);
  await chrome.storage.local.set({
    revint_repost_progress: {
      total,
      done: done + 1,
      status: remaining.length === 0 ? 'complete' : 'scheduled-running',
      results: nextResults,
    },
  });

  if (remaining.length === 0) {
    await chrome.storage.local.remove('revint_scheduled_repost');
    return;
  }

  await chrome.storage.local.set({
    revint_scheduled_repost: { ...sched, itemIds: remaining, total, results: nextResults },
  });
  const minMs = (sched.delayMin || 5) * 60000;
  const maxMs = (sched.delayMax || 15) * 60000;
  chrome.alarms.create('revint:scheduledRepost', {
    when: Date.now() + minMs + Math.random() * (maxMs - minMs),
  });
}

// ─── Bulk-edit state machine ────────────────────────
async function processBulkEditTick() {
  const { revint_bulk_edit: bulk } = await chrome.storage.local.get('revint_bulk_edit');
  if (!bulk || bulk.status !== 'running') return;

  const i = bulk.currentIndex;
  if (i >= bulk.itemIds.length) {
    await chrome.storage.local.set({
      revint_bulk_edit: { ...bulk, status: 'complete' },
    });
    return;
  }

  const itemId = bulk.itemIds[i];
  let result;
  try {
    await updateItem(itemId, bulk.fields);
    result = { itemId, success: true };
  } catch (e) {
    result = { itemId, success: false, error: e.message };
  }

  const results = [...bulk.results, result];
  const nextIndex = i + 1;
  await chrome.storage.local.set({
    revint_bulk_edit: {
      ...bulk,
      currentIndex: nextIndex,
      results,
      status: nextIndex >= bulk.itemIds.length ? 'complete' : 'running',
    },
  });

  if (nextIndex < bulk.itemIds.length) {
    chrome.alarms.create('revint:bulkEditTick', {
      when: Date.now() + 2000 + Math.random() * 3000,
    });
  }
}

// ─── Auto-reply: one message per tick, scheduled via alarm chain ───
async function processAutoReplyTick() {
  const { revint_auto_reply: config } = await chrome.storage.local.get('revint_auto_reply');
  if (!config?.enabled) return;

  // Don't attempt API calls if we haven't captured a Vinted session yet.
  // The alarm fires every 5 min from install — hitting the API before the
  // user navigated on Vinted would just produce NOT_AUTHENTICATED noise.
  const st = getState();
  if (!st.csrf || !st.origin) return;

  const { revint_settings: settings } = await chrome.storage.local.get('revint_settings');
  const hour = new Date().getHours();
  const actStart = settings?.activity_start ?? 9;
  const actEnd = settings?.activity_end ?? 22;
  if (hour < actStart || hour >= actEnd) return;

  // Hour bucket from UTC epoch (DST-free by construction).
  const hourBucket = Math.floor(Date.now() / 3600000);
  const today = new Date().toISOString().slice(0, 10);
  const dailyLimit = config.dailyLimit || settings?.daily_msg_limit || 30;

  const gate = await withKeyMutex('revint_auto_reply_gates', async () => {
    const { revint_msg_hourly: hourly, revint_auto_reply_daily: dailyData } =
      await chrome.storage.local.get(['revint_msg_hourly', 'revint_auto_reply_daily']);
    const hourlyCount = (hourly?.hour === hourBucket) ? hourly.count : 0;
    const dailyCount = (dailyData?.date === today) ? dailyData.count : 0;
    return { hourlyCount, dailyCount };
  });

  // Cap outgoing messages per hour — we only count successful sends (below),
  // so quiet hours don't burn quota on polls that produced no candidates.
  if (gate.hourlyCount >= 18) return;
  if (gate.dailyCount >= dailyLimit) return;

  let notifications;
  try {
    const res = await getNotifications(1);
    notifications = res?.notifications || [];
  } catch (e) {
    // Only record as background error if it's NOT a 404 (empty account) or
    // NOT_AUTHENTICATED (stale session). These are expected for new accounts
    // and would just spam the user with false alarms.
    if (!/VINTED_API_404|NOT_AUTHENTICATED/.test(e.message)) {
      recordBackgroundError('auto-reply-notifications', e);
    }
    return;
  }

  const favoriteNotifs = notifications.filter(
    n => n.link && n.link.includes('?offering_id=')
  );

  let candidates = favoriteNotifs;
  if (config.ignoreRecent) {
    candidates = candidates.filter(n => {
      const ts = n.created_at || n.timestamp || 0;
      const ageSeconds = (Date.now() / 1000) - (typeof ts === 'number' ? ts : new Date(ts).getTime() / 1000);
      return ageSeconds > 86400;
    });
  }

  const { revint_replied_ids: existing } = await chrome.storage.local.get('revint_replied_ids');
  const repliedIds = new Set(existing || []);

  // Send exactly ONE message this tick — the alarm is re-armed below so the
  // next send happens after the configured random delay. This is what keeps
  // us within the MV3 service-worker budget.
  const next = candidates.find(n =>
    !(config.noDuplicates !== false && repliedIds.has(n.id))
  );
  if (!next) return;

  const match = next.link.match(/\/inbox\/(\d+)/);
  if (!match) return;
  const offeringMatch = next.link.match(/offering_id=(\d+)/);
  const itemId = offeringMatch ? offeringMatch[1] : null;

  let itemTitle = '', itemPrice = '', itemBrand = '';
  if (itemId) {
    try {
      const { item } = await getItemDetails(parseInt(itemId));
      itemTitle = item?.title || '';
      itemPrice = (item?.price_numeric || item?.price || '') + '€';
      itemBrand = item?.brand_title || item?.brand || '';
    } catch (e) {
      // Abort the whole tick on DataDome / rate limit — the follow-up sendMessage
      // would fail too, and retrying soon would compound the rate limit.
      if (/DATADOME|RATE_LIMITED/.test(e.message)) {
        recordBackgroundError('auto-reply-item', e);
        return;
      }
      console.warn('[ReVint] item details fetch failed:', next.id, e.message);
    }
  }

  let message = config.template || '';
  const name = extractName(next.body);
  message = resolveVariations(message);
  const discountText = config.sendDiscount && config.discountPercent > 0
    ? `-${config.discountPercent}%` : '';
  message = message
    .replace(/\{\{prenom\}\}/g, name || '')
    .replace(/\{\{article\}\}/g, itemTitle)
    .replace(/\{\{prix\}\}/g, itemPrice)
    .replace(/\{\{marque\}\}/g, itemBrand)
    .replace(/\{\{reduction\}\}/g, discountText);

  try {
    await sendMessage(match[1], message);

    // Auto-discount: optionally send a price reduction offer to the buyer
    if (config.sendDiscount && config.discountPercent > 0 && itemId) {
      try {
        const { item: freshItem } = await getItemDetails(parseInt(itemId));
        const originalPrice = freshItem?.price_numeric || parseFloat(freshItem?.price) || 0;
        if (originalPrice > 0) {
          const discountedPrice = +(originalPrice * (1 - config.discountPercent / 100)).toFixed(2);
          // Extract buyer user ID from notification context if available
          const buyerIdMatch = next.initiator?.id || next.subject?.id;
          if (buyerIdMatch) {
            await sendDiscountOffer(parseInt(itemId), buyerIdMatch, discountedPrice);
          }
        }
      } catch (discErr) {
        console.warn('[ReVint] Auto-discount failed (non-blocking):', discErr.message);
      }
    }

    repliedIds.add(next.id);
    await withKeyMutex('revint_auto_reply_gates', async () => {
      const { revint_auto_reply_daily: cur, revint_msg_hourly: hourly } =
        await chrome.storage.local.get(['revint_auto_reply_daily', 'revint_msg_hourly']);
      const curCount = (cur?.date === today) ? cur.count : 0;
      const curHourly = (hourly?.hour === hourBucket) ? hourly.count : 0;
      await chrome.storage.local.set({
        revint_auto_reply_daily: { date: today, count: curCount + 1 },
        revint_msg_hourly: { hour: hourBucket, count: curHourly + 1 },
        revint_replied_ids: [...repliedIds],
      });
    });
    logAutoMessage({
      buyerUsername: name || undefined,
      conversationId: match[1],
      itemId: itemId || undefined,
      itemTitle: itemTitle || undefined,
      messageBody: message,
      triggerType: 'favorite',
      status: 'success',
    }).catch(e => console.warn('[ReVint] logAutoMessage failed:', e));
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
    }).catch(e => console.warn('[ReVint] logAutoMessage failed:', e));
    if (/DATADOME|RATE_LIMITED/.test(msgErr.message)) {
      recordBackgroundError('auto-reply-send', msgErr);
      return;
    }
  }

  // Re-arm for the next message after a configurable random delay.
  const minDelaySec = (config.delayMin || 1) * 60;
  const maxDelaySec = (config.delayMax || 5) * 60;
  const nextWhen = Date.now() + (minDelaySec + Math.random() * (maxDelaySec - minDelaySec)) * 1000;
  chrome.alarms.create('revint:autoReply', { when: nextWhen });
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
    recordBackgroundError('daily-stats', e);
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

    const { revint_snapshots: existing } = await chrome.storage.local.get('revint_snapshots');
    const snapshots = existing || {};
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
    recordBackgroundError('snapshot', e);
  }
}

function resolveVariations(text) {
  // Single-braces NOT surrounded by other braces — preserves {{prenom}}/{{article}} etc.
  return text.replace(/(?<!\{)\{([^{}]+)\}(?!\})/g, (_match, group) => {
    const options = group.split('|');
    return options[Math.floor(Math.random() * options.length)];
  });
}

// Vinted usernames often look like "Prenom_Nom" or "nickname_123" — split on
// underscore to get a first-name-ish token suitable for {{prenom}} templating.
// Also strip any braces so a crafted username can't inject template tokens.
//
// We stay on regex + manual entity decoding on purpose: DOMParser is NOT
// available in MV3 service workers, and auto-reply runs from an alarm that
// lives in the SW scope.
function extractName(html) {
  if (!html) return null;
  const m = html.match(/<a[^>]*>([^<]+)<\/a>/i);
  if (!m) return null;
  const decoded = m[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return decoded.trim().split('_')[0].replace(/[{}]/g, '').trim();
}

// ─── Install / startup ──────────────────────────────
// Retry pending item deletions that failed during repost
async function processPendingDeletions() {
  const st = getState();
  if (!st.csrf || !st.origin) return;
  const { revint_pending_deletions: pending } = await chrome.storage.local.get('revint_pending_deletions');
  if (!Array.isArray(pending) || pending.length === 0) return;

  const remaining = [];
  for (const entry of pending) {
    try {
      await deleteItem(entry.itemId);
    } catch {
      if (Date.now() - entry.ts < 7 * 86400000) remaining.push(entry);
    }
  }
  await chrome.storage.local.set({ revint_pending_deletions: remaining });
}

const PERIODIC_ALARMS = [
  ['revint:autoReply', 5],
  ['revint:dailyStatsSync', 360],
  ['revint:snapshot', 240],
  ['revint:pendingDeletions', 60],
];

function ensurePeriodicAlarms() {
  for (const [name, periodInMinutes] of PERIODIC_ALARMS) {
    chrome.alarms.get(name, (a) => {
      if (!a) chrome.alarms.create(name, { periodInMinutes });
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensurePeriodicAlarms();
  // Clear stale errors from previous sessions so users don't see
  // outdated notifications after an extension update or reinstall.
  chrome.storage.local.remove('revint_last_error');
});
// Re-create alarms on service worker startup — MV3 is allowed to drop them.
ensurePeriodicAlarms();
