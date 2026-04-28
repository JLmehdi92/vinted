import {
  abortableDelay, DELAYS, isCaptchaError, is2FARequired, isRateLimited,
  shouldSkipUser, getNextPreset, autoModifyTitle, applyPriceOperation,
  isProblematicBrand,
} from './anti-detection.js';

import {
  setState, getState, restoreState, refreshCsrf,
  getCurrentUser, getUserItems, getItemDetails,
  updateItem, deleteItem, repostItem, fetchImageAsBlob,
  getNotifications, sendMessage, getInbox, delay,
  withKeyMutex,
  getConversation, acceptOffer, rejectOffer, sendCounterOffer,
  sendDiscountOffer, publishDraft,
  loadAccounts, getAccounts, saveAccount, removeAccount, switchAccount,
  getNotificationsV2, toggleFollow, getFollowers, getFollowing,
  setItemHidden, markConversationRead, deleteConversation,
  getOrders, getTransaction, getShipmentLabelUrl, leaveFeedback,
  getUserInfo, calculateOfferPrices, smartRound,
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
loadAccounts().catch(() => {});

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
  'https://www.vinted.net/api/*', 'https://www.vinted.ie/api/*',
  'https://www.vinted.ee/api/*', 'https://www.vinted.lv/api/*',
  'https://www.vinted.si/api/*',
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
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ error: 'UNAUTHORIZED' });
    return;
  }
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
        'https://www.vinted.ie/*', 'https://www.vinted.ee/*',
        'https://www.vinted.lv/*', 'https://www.vinted.si/*',
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

function validateInput(msg) {
  if (msg.itemId != null && (typeof msg.itemId !== 'number' || !Number.isFinite(msg.itemId))) {
    throw new Error('INVALID_INPUT: itemId must be a number');
  }
  if (msg.itemIds != null && (!Array.isArray(msg.itemIds) || msg.itemIds.some(id => typeof id !== 'number'))) {
    throw new Error('INVALID_INPUT: itemIds must be an array of numbers');
  }
  if (msg.conversationId != null && typeof msg.conversationId !== 'string' && typeof msg.conversationId !== 'number') {
    throw new Error('INVALID_INPUT: conversationId must be a string or number');
  }
  if (msg.body != null && typeof msg.body !== 'string') {
    throw new Error('INVALID_INPUT: body must be a string');
  }
  if (msg.fields != null && typeof msg.fields !== 'object') {
    throw new Error('INVALID_INPUT: fields must be an object');
  }
  if (msg.when != null && (typeof msg.when !== 'number' || !Number.isFinite(msg.when))) {
    throw new Error('INVALID_INPUT: when must be a timestamp number');
  }
}

async function handleMessage(msg) {
  validateInput(msg);
  switch (msg.type) {
    case 'revint:getState':
      return getState();

    case 'revint:tokensFromContent': {
      if (msg.csrf) setState({ csrf: msg.csrf, anonId: msg.anonId, origin: msg.origin });
      return { ok: true };
    }

    case 'revint:vintedLogout': {
      console.warn('[ReVint] Vinted logout detected:', msg.trigger || 'url-change');
      setState({ csrf: null, anonId: null, userId: null });
      await chrome.storage.local.remove(['revint_user', 'revint_last_error']);
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
          draftMode: msg.draftMode || false,
          priceReduction: msg.priceReduction || null,
          titleModifier: msg.titleModifier !== false,
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

    // ─── Multi-account ────────────────────────────────
    case 'revint:getAccounts':
      return { accounts: getAccounts() };

    case 'revint:saveAccount': {
      const acc = await saveAccount(msg.account);
      return { account: acc };
    }

    case 'revint:removeAccount': {
      await removeAccount(msg.accountId);
      return { ok: true };
    }

    case 'revint:switchAccount': {
      const acc = await switchAccount(msg.accountId);
      const user = await getCurrentUser();
      await persistUser(user);
      return { ok: true, account: acc, user };
    }

    case 'revint:addVintedAccount': {
      const user = await ensureConnectedUser();
      const st = getState();
      const acc = await saveAccount({
        id: user.id,
        login: user.login,
        photo: user.photo?.url,
        origin: st.origin,
        item_count: user.item_count,
        addedAt: Date.now(),
      });
      await persistUser(user);
      return { ok: true, account: acc };
    }

    // ─── Notifications v2 ─────────────────────────────
    case 'revint:getNotificationsV2':
      return getNotificationsV2(msg.page || 1, msg.perPage || 20);

    // ─── Follow / Unfollow ────────────────────────────
    case 'revint:toggleFollow':
      return toggleFollow(msg.userId);

    case 'revint:getFollowers':
      return getFollowers(msg.userId, msg.page || 1);

    case 'revint:getFollowing':
      return getFollowing(msg.userId, msg.page || 1);

    case 'revint:bulkFollow': {
      const st = getState();
      if (!st.userId) throw new Error('NOT_CONNECTED');
      const results = [];
      let userIds = msg.userIds || [];

      if (msg.action === 'followBack') {
        const followersData = await getFollowers(st.userId, 1);
        const followers = followersData?.users || followersData?.followers || [];
        const followingData = await getFollowing(st.userId, 1);
        const following = new Set((followingData?.users || followingData?.followed_users || []).map(u => u.id));
        userIds = followers.filter(u => !following.has(u.id)).map(u => u.id);
      } else if (msg.action === 'unfollowAll') {
        const followingData = await getFollowing(st.userId, 1);
        userIds = (followingData?.users || followingData?.followed_users || []).map(u => u.id);
      }

      for (const userId of userIds) {
        try {
          await toggleFollow(userId);
          results.push({ userId, success: true });
        } catch (e) {
          results.push({ userId, success: false, error: e.message });
        }
        await delay(5000 + Math.random() * 5000);
      }
      return { results };
    }

    // ─── Hide / Unhide ────────────────────────────────
    case 'revint:setItemHidden':
      return setItemHidden(msg.itemId, msg.isHidden);

    case 'revint:bulkHide': {
      const results = [];
      for (const itemId of msg.itemIds) {
        try {
          await setItemHidden(itemId, msg.isHidden);
          results.push({ itemId, success: true });
        } catch (e) {
          results.push({ itemId, success: false, error: e.message });
        }
        await delay(2000 + Math.random() * 3000);
      }
      return { results };
    }

    // ─── Bulk price / text operations ───────────────────
    case 'revint:bulkPrice': {
      const results = [];
      for (const itemId of msg.itemIds) {
        try {
          const { item } = await getItemDetails(itemId);
          const oldPrice = item?.price_numeric || parseFloat(item?.price) || 0;
          const operation = msg.operation || (() => {
            let type = msg.action;
            if (type === 'decrease') type = msg.valueType === 'percent' ? 'percentage_decrease' : 'fixed_decrease';
            else if (type === 'increase') type = msg.valueType === 'percent' ? 'percentage_increase' : 'fixed_increase';
            return { type, value: parseFloat(msg.value) || 0, rounding: msg.rounding };
          })();
          const newPrice = applyPriceOperation(oldPrice, operation);
          await updateItem(itemId, { price: newPrice });
          results.push({ itemId, success: true, oldPrice, newPrice });
        } catch (e) {
          results.push({ itemId, success: false, error: e.message });
        }
        await delay(2000 + Math.random() * 3000);
      }
      return { results };
    }

    case 'revint:bulkText': {
      const results = [];
      for (const itemId of msg.itemIds) {
        try {
          const { item } = await getItemDetails(itemId);
          const field = msg.field || 'title';
          const oldValue = item?.[field] || '';
          let newValue = oldValue;
          if (msg.action === 'replace') newValue = msg.text || '';
          else if (msg.action === 'prepend') newValue = (msg.text || '') + ' ' + oldValue;
          else if (msg.action === 'append') newValue = oldValue + ' ' + (msg.text || '');
          await updateItem(itemId, { [field]: newValue });
          results.push({ itemId, success: true });
        } catch (e) {
          results.push({ itemId, success: false, error: e.message });
        }
        await delay(2000 + Math.random() * 3000);
      }
      return { results };
    }

    // ─── Conversations management ─────────────────────
    case 'revint:markConversationRead':
      return markConversationRead(msg.conversationId);

    case 'revint:deleteConversation':
      return deleteConversation(msg.conversationId);

    case 'revint:bulkMarkRead': {
      const results = [];
      for (const convId of (msg.conversationIds || [])) {
        try {
          await markConversationRead(convId);
          results.push({ convId, success: true });
        } catch (e) {
          results.push({ convId, success: false, error: e.message });
        }
        await delay(500 + Math.random() * 500);
      }
      return { results };
    }

    // ─── Bulk delete items ────────────────────────────
    case 'revint:bulkDelete': {
      const results = [];
      for (const itemId of (msg.itemIds || [])) {
        try {
          await setItemHidden(itemId, true);
          await delay(400 + Math.random() * 400);
          await deleteItem(itemId);
          results.push({ itemId, success: true });
        } catch (e) {
          results.push({ itemId, success: false, error: e.message });
        }
        await delay(2000 + Math.random() * 3000);
      }
      return { results };
    }

    // ─── Bulk publish drafts ──────────────────────────
    case 'revint:bulkPublish': {
      const results = [];
      for (const draftId of (msg.draftIds || [])) {
        try {
          await publishDraft(draftId);
          results.push({ draftId, success: true });
        } catch (e) {
          results.push({ draftId, success: false, error: e.message });
        }
        await delay(2000 + Math.random() * 3000);
      }
      return { results };
    }

    // ─── Auto-feedback on orders ──────────────────────
    case 'revint:bulkFeedback': {
      const results = [];
      for (const order of (msg.orders || [])) {
        try {
          await leaveFeedback(order.transactionId, order.rating || 5, order.feedback || '');
          if (order.extraMessage && order.conversationId) {
            await sendMessage(order.conversationId, order.extraMessage.replace(/@username/g, order.buyerLogin || ''));
          }
          results.push({ transactionId: order.transactionId, success: true });
        } catch (e) {
          results.push({ transactionId: order.transactionId, success: false, error: e.message });
        }
        await delay(3000 + Math.random() * 5000);
      }
      return { results };
    }

    // ─── Orders / Transactions ────────────────────────
    case 'revint:getOrders':
      return getOrders(msg.page || 1, msg.type || 'sold');

    case 'revint:getTransaction':
      return getTransaction(msg.transactionId);

    // ─── Shipping labels ──────────────────────────────
    case 'revint:getShipmentLabel':
      return getShipmentLabelUrl(msg.shipmentId);

    // ─── Feedback ─────────────────────────────────────
    case 'revint:leaveFeedback':
      return leaveFeedback(msg.transactionId, msg.rating || 5, msg.feedback || '');

    // ─── User info ────────────────────────────────────
    case 'revint:getUserInfo':
      return getUserInfo(msg.userId);

    // ─── Smart Offers engine ──────────────────────────
    case 'revint:startSmartOffers': {
      await chrome.storage.local.set({
        revint_smart_offers: { ...(msg.config || msg.settings), enabled: true, startedAt: Date.now() },
      });
      chrome.alarms.create('revint:smartOffersTick', { when: Date.now() + 2000 });
      return { started: true };
    }

    case 'revint:stopSmartOffers': {
      const { revint_smart_offers: so } = await chrome.storage.local.get('revint_smart_offers');
      if (so) await chrome.storage.local.set({ revint_smart_offers: { ...so, enabled: false } });
      return { ok: true };
    }

    // ─── Restocker engine ─────────────────────────────
    case 'revint:startRestocker': {
      await chrome.storage.local.set({
        revint_restocker: { ...(msg.config || msg.settings), enabled: true, processedOrderIds: [], startedAt: Date.now() },
      });
      chrome.alarms.create('revint:restockerTick', { when: Date.now() + 5000 });
      return { started: true };
    }

    case 'revint:stopRestocker': {
      const { revint_restocker: rs } = await chrome.storage.local.get('revint_restocker');
      if (rs) await chrome.storage.local.set({ revint_restocker: { ...rs, enabled: false } });
      return { ok: true };
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
    else if (alarm.name === 'revint:smartOffersTick') await processSmartOffersTick();
    else if (alarm.name === 'revint:restockerTick') await processRestockerTick();
  } catch (e) {
    console.error('[ReVint] alarm handler error:', alarm.name, e);
    if (is2FARequired(e)) {
      recordBackgroundError(alarm.name, { message: '2FA requis — créez un brouillon sur Vinted pour vérifier.' });
    } else if (isCaptchaError(e)) {
      recordBackgroundError(alarm.name, { message: 'CAPTCHA détecté — ouvrez Vinted et résolvez-le.' });
    } else {
      recordBackgroundError(alarm.name, e);
    }
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
    // Dotb: warn about problematic brands (logged, not blocking)
    try {
      const { item: checkItem } = await getItemDetails(itemId);
      const brandName = checkItem?.brand_title || checkItem?.brand || '';
      if (isProblematicBrand(brandName)) {
        console.warn(`[ReVint] Problematic brand detected: ${brandName} — use photo modifications to avoid duplicate strike`);
      }
    } catch { /* non-blocking check */ }

    // Apply title modifier + price reduction if configured
    if (batch.titleModifier || batch.priceReduction) {
      try {
        const { item } = await getItemDetails(itemId);
        const updates = {};
        if (batch.titleModifier && item?.title) {
          updates.title = autoModifyTitle(item.title);
        }
        if (batch.priceReduction) {
          const oldPrice = item?.price_numeric || parseFloat(item?.price) || 0;
          updates.price = applyPriceOperation(oldPrice, batch.priceReduction);
        }
        if (Object.keys(updates).length > 0) await updateItem(itemId, updates);
      } catch (e) {
        console.warn('[ReVint] Pre-repost modifications failed:', e.message);
      }
    }
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
// ─── Auto-reply: Dotb-pattern with v2 notifications, entry_type 20,
// backlog/live modes, user filtering, per-item/per-user limits ───
async function processAutoReplyTick() {
  const { revint_auto_reply: config } = await chrome.storage.local.get('revint_auto_reply');
  if (!config?.enabled) return;

  const st = getState();
  if (!st.csrf || !st.origin) return;

  const { revint_settings: settings } = await chrome.storage.local.get('revint_settings');
  const hour = new Date().getHours();
  if (hour < (settings?.activity_start ?? 9) || hour >= (settings?.activity_end ?? 22)) return;

  const hourBucket = Math.floor(Date.now() / 3600000);
  const today = new Date().toISOString().slice(0, 10);
  const dailyLimit = config.dailyLimit || settings?.daily_msg_limit || 30;

  const gate = await withKeyMutex('revint_auto_reply_gates', async () => {
    const { revint_msg_hourly: hourly, revint_auto_reply_daily: dailyData } =
      await chrome.storage.local.get(['revint_msg_hourly', 'revint_auto_reply_daily']);
    return {
      hourlyCount: (hourly?.hour === hourBucket) ? hourly.count : 0,
      dailyCount: (dailyData?.date === today) ? dailyData.count : 0,
    };
  });
  if (gate.hourlyCount >= 18 || gate.dailyCount >= dailyLimit) return;

  // Dotb pattern: use /web/api/notifications with entry_type 20 for favorites
  let notifications;
  try {
    const res = await getNotificationsV2(1, 20);
    notifications = res?.notifications || [];
  } catch (e) {
    // Fallback to old API if v2 fails
    try {
      const res2 = await getNotifications(1);
      notifications = res2?.notifications || [];
    } catch (e2) {
      if (!/VINTED_API_404|NOT_AUTHENTICATED/.test(e2.message)) {
        recordBackgroundError('auto-reply-notifications', e2);
      }
      return;
    }
  }

  // Dotb: filter by entry_type 20 (favorites), fallback to URL-based detection
  const favoriteNotifs = notifications.filter(n =>
    n.entry_type === 20 || (n.link && n.link.includes('?offering_id='))
  );

  // Backlog mode: filter by time range; Live mode: only new notifications
  const timeRangeHours = {
    'new_only': 0, '2h': 2, '6h': 6, '12h': 12,
    '1d': 24, '1j': 24, '3d': 72, '3j': 72, '7d': 168, '7j': 168,
  };
  const maxHours = timeRangeHours[config.timeRange] || 0;
  let candidates = favoriteNotifs;
  if (config.mode === 'backlog' && maxHours > 0) {
    candidates = candidates.filter(n => {
      const ts = n.created_at_ts || n.created_at || 0;
      const ageSec = (Date.now() / 1000) - (typeof ts === 'number' ? ts : new Date(ts).getTime() / 1000);
      return ageSec <= maxHours * 3600;
    });
  }
  if (config.ignoreRecent) {
    candidates = candidates.filter(n => {
      const ts = n.created_at_ts || n.created_at || 0;
      const ageSec = (Date.now() / 1000) - (typeof ts === 'number' ? ts : new Date(ts).getTime() / 1000);
      return ageSec > 86400;
    });
  }

  // Load tracking data
  const { revint_replied_ids: existing, revint_auto_reply_tracking: tracking } =
    await chrome.storage.local.get(['revint_replied_ids', 'revint_auto_reply_tracking']);
  let repliedArr = existing || [];
  if (repliedArr.length > 5000) repliedArr = repliedArr.slice(-3000);
  const repliedIds = new Set(repliedArr);
  const perItemCount = tracking?.perItem || {};
  const perUserCount = tracking?.perUser || {};
  const lastUserMsg = tracking?.lastUserMsg || {};

  // Dotb: ignored users set
  const ignoredSet = new Set(
    (config.ignoredUsers || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  );

  // Find ONE candidate to process (Dotb: one per tick)
  let next = null;
  for (const n of candidates) {
    if (config.noDuplicates !== false && repliedIds.has(n.id)) continue;

    // Dotb: shouldSkipUser check (rating, blocked, moderator, ignored)
    const notifier = n.initiator || n.notifier || {};
    const userCheck = shouldSkipUser(notifier, {
      ignoredUsers: config.ignoredUsers,
      skipUsersWithoutRatings: config.skipUsersWithoutRatings,
      minUserRating: config.minUserRating,
    });
    if (userCheck.skip) continue;

    // Per-item limit
    const offeringMatch = (n.link || '').match(/offering_id=(\d+)/);
    const nItemId = offeringMatch ? offeringMatch[1] : null;
    if (config.limitPerItem && nItemId) {
      if ((perItemCount[nItemId] || 0) >= (config.maxPerItem || 10)) continue;
    }

    // Per-user limit
    const userLogin = (notifier.login || '').toLowerCase();
    if (config.limitPerUser && userLogin) {
      if ((perUserCount[userLogin] || 0) >= (config.maxPerUser || 3)) continue;
    }

    // Days before resend to same user
    if (config.daysBeforeResend && userLogin && lastUserMsg[userLogin]) {
      const daysSince = (Date.now() - lastUserMsg[userLogin]) / 86400000;
      if (daysSince < config.daysBeforeResend) continue;
    }

    next = n;
    break;
  }
  if (!next) return;

  const match = (next.link || '').match(/\/inbox\/(\d+)/);
  if (!match) return;
  const offeringMatch = (next.link || '').match(/offering_id=(\d+)/);
  const itemId = offeringMatch ? offeringMatch[1] : null;

  let itemTitle = '', itemPrice = '', itemBrand = '';
  if (itemId) {
    try {
      const { item } = await getItemDetails(parseInt(itemId));
      itemTitle = item?.title || '';
      itemPrice = (item?.price_numeric || item?.price || '') + '€';
      itemBrand = item?.brand_title || item?.brand || '';
    } catch (e) {
      if (/DATADOME|RATE_LIMITED/.test(e.message)) {
        recordBackgroundError('auto-reply-item', e);
        return;
      }
    }
  }

  const sanitize = (s) => (s || '').replace(/[{}]/g, '');
  const notifier = next.initiator || next.notifier || {};
  const name = extractName(next.body) || notifier.login?.split('_')[0] || '';
  const countryCode = (notifier.country_code || st.origin?.match(/vinted\.(\w+)/)?.[1] || 'fr').toUpperCase();
  // Dotb: support up to 3 message templates, rotate based on per-user count
  const templates = config.templates || [config.template || ''];
  const userLogin = (notifier.login || '').toLowerCase();
  const templateIdx = Math.min((perUserCount[userLogin] || 0), templates.length - 1);
  let message = resolveVariations(templates[templateIdx] || templates[0] || '', countryCode);
  const discountText = config.sendDiscount && config.discountPercent > 0
    ? `-${config.discountPercent}%` : '';
  message = message
    .replace(/\{\{prenom\}\}/g, sanitize(name))
    .replace(/\{\{article\}\}/g, sanitize(itemTitle))
    .replace(/\{\{prix\}\}/g, sanitize(itemPrice))
    .replace(/\{\{marque\}\}/g, sanitize(itemBrand))
    .replace(/\{\{reduction\}\}/g, sanitize(discountText))
    .replace(/@username/g, sanitize(notifier.login || name));

  try {
    await sendMessage(match[1], message);

    if (config.sendDiscount && config.discountPercent > 0 && itemId) {
      try {
        const { item: freshItem } = await getItemDetails(parseInt(itemId));
        const originalPrice = freshItem?.price_numeric || parseFloat(freshItem?.price) || 0;
        if (originalPrice > 0 && (notifier.id || next.subject?.id)) {
          const discountedPrice = +(originalPrice * (1 - config.discountPercent / 100)).toFixed(2);
          await sendDiscountOffer(parseInt(itemId), notifier.id || next.subject.id, discountedPrice);
        }
      } catch (discErr) {
        console.warn('[ReVint] Auto-discount failed (non-blocking):', discErr.message);
      }
    }

    // Update all tracking counters atomically
    repliedIds.add(next.id);
    if (itemId) perItemCount[itemId] = (perItemCount[itemId] || 0) + 1;
    if (userLogin) {
      perUserCount[userLogin] = (perUserCount[userLogin] || 0) + 1;
      lastUserMsg[userLogin] = Date.now();
    }

    await withKeyMutex('revint_auto_reply_gates', async () => {
      const { revint_auto_reply_daily: cur, revint_msg_hourly: hourly } =
        await chrome.storage.local.get(['revint_auto_reply_daily', 'revint_msg_hourly']);
      await chrome.storage.local.set({
        revint_auto_reply_daily: { date: today, count: ((cur?.date === today) ? cur.count : 0) + 1 },
        revint_msg_hourly: { hour: hourBucket, count: ((hourly?.hour === hourBucket) ? hourly.count : 0) + 1 },
        revint_replied_ids: [...repliedIds],
        revint_auto_reply_tracking: { perItem: perItemCount, perUser: perUserCount, lastUserMsg },
      });
    });

    logAutoMessage({
      buyerUsername: name || undefined, conversationId: match[1],
      itemId: itemId || undefined, itemTitle: itemTitle || undefined,
      messageBody: message, triggerType: 'favorite', status: 'success',
    }).catch(() => {});
  } catch (msgErr) {
    logAutoMessage({
      buyerUsername: name || undefined, conversationId: match[1],
      itemId: itemId || undefined, messageBody: message,
      triggerType: 'favorite', status: 'failed', error: msgErr.message,
    }).catch(() => {});
    if (/DATADOME|RATE_LIMITED/.test(msgErr.message)) {
      recordBackgroundError('auto-reply-send', msgErr);
      return;
    }
  }

  const minDelaySec = (config.delayMin || 1) * 60;
  const maxDelaySec = (config.delayMax || 5) * 60;
  chrome.alarms.create('revint:autoReply', {
    when: Date.now() + (minDelaySec + Math.random() * (maxDelaySec - minDelaySec)) * 1000,
  });
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

// Dotb template engine: supports random {a|b|c}, time-based {T10-14:morning|T18-22:evening},
// and country-based {FR:Bonjour|EN:Hello} variants.
function resolveVariations(text, countryCode = '') {
  const hour = new Date().getHours();
  return text.replace(/(?<!\{)\{([^{}]+)\}(?!\})/g, (_match, group) => {
    const options = group.split('|');

    // Time-based: {T10-14:Good morning|T18-22:Good evening|default}
    const timeMatch = options.find(o => {
      const m = o.match(/^T(\d+)-(\d+):(.+)/);
      return m && hour >= parseInt(m[1]) && hour < parseInt(m[2]);
    });
    if (timeMatch) {
      return timeMatch.replace(/^T\d+-\d+:/, '');
    }

    // Country-based: {FR:Bonjour|ES:Hola|default}
    if (countryCode) {
      const countryMatch = options.find(o => {
        const m = o.match(/^([A-Z]{2}):(.+)/);
        return m && m[1] === countryCode.toUpperCase();
      });
      if (countryMatch) {
        return countryMatch.replace(/^[A-Z]{2}:/, '');
      }
    }

    // Fallback: strip any T/country prefix from remaining options, pick random
    const cleaned = options.map(o => o.replace(/^T\d+-\d+:/, '').replace(/^[A-Z]{2}:/, ''));
    return cleaned[Math.floor(Math.random() * cleaned.length)];
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
// ─── Smart Offers engine ───────────────────────────
// One conversation per tick, alarm-chained. Avoids SW timeout on long loops.
async function processSmartOffersTick() {
  const { revint_smart_offers: config } = await chrome.storage.local.get('revint_smart_offers');
  if (!config?.enabled) return;

  const st = getState();
  if (!st.csrf || !st.origin) return;

  let processed = false;
  try {
    const inboxData = await getInbox(1);
    const conversations = inboxData?.conversations || [];

    const { revint_smart_offers_replied: replied } = await chrome.storage.local.get('revint_smart_offers_replied');
    let repliedArr = replied || [];
    if (repliedArr.length > 2000) repliedArr = repliedArr.slice(-1000);
    const repliedSet = new Set(repliedArr);

    for (const conv of conversations) {
      if (!conv.transaction?.id || !conv.last_message) continue;
      const lastMsg = conv.last_message;
      if (lastMsg.entity_type !== 'offer_request_message') continue;
      if (!lastMsg.entity?.price) continue;

      const convKey = `${conv.id}_${lastMsg.id}`;
      if (repliedSet.has(convKey)) continue;

      // Dotb: per-conversation limit (max 2 offers accepted/countered per conversation)
      const convOfferCount = repliedArr.filter(k => k.startsWith(`${conv.id}_`)).length;
      if (convOfferCount >= (config.maxOffersPerConversation || 2)) continue;

      const userCheck = shouldSkipUser(conv.opposite_user, config);
      if (userCheck.skip) continue;

      // Dotb pattern: wait at least 30s before responding to look human
      const offerAge = (Date.now() / 1000) - (lastMsg.created_at_ts || 0);
      if (offerAge < 30) {
        // Schedule a re-check after the remaining wait time + random jitter
        const waitMs = (30 - offerAge) * 1000 + Math.random() * 5000;
        chrome.alarms.create('revint:smartOffersTick', { when: Date.now() + waitMs });
        return;
      }

      const offerPrice = parseFloat(typeof lastMsg.entity.price === 'string'
        ? lastMsg.entity.price : lastMsg.entity.price.amount);
      const itemPrice = parseFloat(conv.transaction?.item?.price || 0);
      if (!itemPrice || !offerPrice) continue;

      const prices = calculateOfferPrices(itemPrice, config);
      if (!prices) continue;

      let minOffer = prices.minimumOfferPrice;
      if (config.enableRounding) minOffer = smartRound(minOffer);

      if (offerPrice >= minOffer) {
        try {
          await acceptOffer(conv.transaction.id, lastMsg.entity.id);
          if (config.acceptMessage) {
            await sendMessage(conv.id, config.acceptMessage.replace(/@username/g, conv.opposite_user?.login || ''));
          }
        } catch (e) {
          console.warn('[ReVint] Smart offer accept failed:', e.message);
        }
      } else if (config.enableCounter) {
        // Dotb multi-step counter splits: each step applies a different %
        let counterPrice;
        const splits = config.counterOfferSplits || [];
        if (splits.length > 0) {
          const stepIdx = Math.min(convOfferCount, splits.length - 1);
          const stepPct = splits[stepIdx]?.percentage || splits[stepIdx] || 0;
          const maxDiscount = itemPrice - minOffer;
          const stepDiscount = maxDiscount * stepPct / 100;
          counterPrice = +(itemPrice - stepDiscount).toFixed(2);
        } else {
          counterPrice = prices.counterOfferPrice;
        }
        if (config.enableRounding) counterPrice = smartRound(counterPrice);
        try {
          await sendCounterOffer(conv.transaction.id, counterPrice);
          if (config.counterMessage) {
            await sendMessage(conv.id, config.counterMessage.replace(/@username/g, conv.opposite_user?.login || ''));
          }
        } catch (e) {
          console.warn('[ReVint] Smart counter-offer failed:', e.message);
        }
      }

      repliedSet.add(convKey);
      await chrome.storage.local.set({ revint_smart_offers_replied: [...repliedSet] });
      processed = true;
      break;
    }
  } catch (e) {
    if (!/NOT_AUTHENTICATED|DATADOME/.test(e.message)) {
      recordBackgroundError('smart-offers', e);
    }
  }

  if (config.enabled) {
    const nextDelay = processed
      ? 20000 + Math.random() * 40000
      : (config.checkIntervalMin || 3) * 60000 + Math.random() * 60000;
    chrome.alarms.create('revint:smartOffersTick', { when: Date.now() + nextDelay });
  }
}

// ─── Restocker engine ─────────────────────────────
// Polls sold orders and auto-reposts items that have backup data.
// Dotb pattern: check orders → find sold items → repost from backup.
async function processRestockerTick() {
  const { revint_restocker: config } = await chrome.storage.local.get('revint_restocker');
  if (!config?.enabled) return;

  const st = getState();
  if (!st.csrf || !st.origin || !st.userId) return;

  try {
    const ordersData = await getOrders(1, 'sold');
    const orders = ordersData?.my_orders || ordersData?.orders || [];
    const processedIds = new Set(config.processedOrderIds || []);

    for (const order of orders) {
      const txId = order.transaction_id || order.id;
      if (processedIds.has(txId)) continue;

      const itemId = order.item_id || order.item?.id;
      if (!itemId) { processedIds.add(txId); continue; }

      // Check if we have a backup for this item
      const userPrefix = st.userId ? `${st.userId}_` : '';
      const backupKey = `revint_backup_${userPrefix}${itemId}`;
      const { [backupKey]: backup } = await chrome.storage.local.get(backupKey);

      if (!backup?.item) { processedIds.add(txId); continue; }

      // Dotb shouldRestock() validation: check if item is already active/hidden/draft
      try {
        const { items } = await getUserItems(st.userId, 1, 96);
        const existingActive = items.some(it =>
          it.title === backup.item.title && (it.status === 'active' || it.is_visible)
        );
        if (existingActive) { processedIds.add(txId); continue; }
      } catch { /* if check fails, proceed with restock anyway */ }

      // Wait configured delay before restocking
      const orderTs = order.created_at ? new Date(order.created_at).getTime() : Date.now();
      const delayMs = (config.delayBeforeRestock || 5) * 60 * 1000;
      if (Date.now() - orderTs < delayMs) continue;

      try {
        // Apply title modifier before restock (Dotb pattern)
        if (backup.item.title) {
          backup.item.title = autoModifyTitle(backup.item.title);
        }
        const result = await repostItem(itemId);
        processedIds.add(txId);
        logRepost({
          oldItemId: itemId,
          newItemId: result?.item?.id,
          title: backup.item.title,
          status: 'restocked',
        }).catch(() => {});
      } catch (e) {
        console.warn('[ReVint] Restocker failed for item:', itemId, e.message);
        processedIds.add(txId);
      }

      await delay(5000 + Math.random() * 10000);
    }

    await chrome.storage.local.set({
      revint_restocker: { ...config, processedOrderIds: [...processedIds] },
    });
  } catch (e) {
    if (!/NOT_AUTHENTICATED|DATADOME/.test(e.message)) {
      recordBackgroundError('restocker', e);
    }
  }

  if (config.enabled) {
    const intervalMs = (config.checkIntervalMin || 5) * 60000;
    chrome.alarms.create('revint:restockerTick', { when: Date.now() + intervalMs });
  }
}

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
