// ─── Vinted API — all endpoints for repost, messaging, items ───

let state = { csrf: null, anonId: null, origin: null, userId: null };

export function setState(patch) {
  Object.assign(state, patch);
  chrome.storage.session.set({ vintedState: state }).catch(e => {
    console.warn('[ReVint] setState storage error:', e);
  });
}

export function getState() {
  return { ...state };
}

export async function restoreState() {
  const data = await chrome.storage.session.get('vintedState');
  if (data.vintedState) Object.assign(state, data.vintedState);
}

// Extract a token (CSRF_TOKEN / ANON_ID / ...) from raw Vinted HTML.
// Vinted uses Next.js SSR and embeds config inside __NEXT_DATA__ as a
// stringified JSON inside another JSON string. Quotes appear in three
// forms depending on the layer: ", \\", and \". We unescape in
// that specific order — reversing steps 2 and 3 would collapse \\" to "
// before the inner layer is resolved and corrupt the payload.
export function extractToken(html, key) {
  if (!html) return null;
  const cleaned = html
    .replace(/\\u0022/g, '"')
    .replace(/\\\\"/g, '"')
    .replace(/\\"/g, '"');
  const re = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`);
  const m = cleaned.match(re);
  if (m) return m[1];
  // Fallback: locate the key near a UUID even if JSON structure shifted.
  const uuid = html.match(new RegExp(`${key}[^a-f0-9-]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})`, 'i'));
  if (uuid) return uuid[1];
  return null;
}

// Fetch a fresh CSRF token by loading Vinted pages.
// Returns { ok: true, csrf, anonId } on success or { ok: false, reason, detail }
// on failure. Callers get to distinguish network errors from DataDome challenges
// from "token just isn't in the HTML" — all of which used to be swallowed.
export async function refreshCsrf(origin) {
  const targetOrigin = origin || state.origin || 'https://www.vinted.fr';
  const pagesToTry = [
    `${targetOrigin}/catalog`,
    `${targetOrigin}/`,
    `${targetOrigin}/items/new`,
    `${targetOrigin}/member/general/all`,
  ];

  const attempts = [];
  for (const url of pagesToTry) {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 'accept': 'text/html' },
      });
      if (!res.ok) { attempts.push({ url, reason: 'http', status: res.status }); continue; }
      const html = await res.text();

      // Guard against DataDome CAPTCHA pages which contain random UUIDs
      // that our UUID fallback regex would otherwise match.
      if (html.includes('datadome') || html.includes('captcha-delivery')) {
        return { ok: false, reason: 'datadome', detail: url };
      }

      const csrf = extractToken(html, 'CSRF_TOKEN')
        || (html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/) || [])[1]
        || null;
      const anonId = extractToken(html, 'ANON_ID');

      if (csrf) {
        setState({ csrf, anonId: anonId || state.anonId, origin: targetOrigin });
        return { ok: true, csrf, anonId };
      }
      attempts.push({ url, reason: 'no-token' });
    } catch (e) {
      attempts.push({ url, reason: 'network', detail: e.message });
    }
  }

  // Last resort: pull CSRF from cookies if the cookies permission is available.
  try {
    if (chrome.cookies) {
      const cookie = await chrome.cookies.get({ url: targetOrigin, name: 'csrf_token' });
      if (cookie?.value) {
        setState({ csrf: cookie.value, origin: targetOrigin });
        return { ok: true, csrf: cookie.value };
      }
    }
  } catch (e) {
    attempts.push({ url: 'cookies', reason: 'network', detail: e.message });
  }

  console.warn('[ReVint] refreshCsrf exhausted all pages', attempts);
  return { ok: false, reason: 'not-found', attempts };
}

function headers(extra = {}) {
  const h = {
    accept: 'application/json, text/plain, */*',
    'x-csrf-token': state.csrf,
    'x-enable-multiple-size-groups': 'true',
    ...extra,
  };
  // Omit x-anon-id when absent; empty-string headers confuse some Vinted edges.
  if (state.anonId) h['x-anon-id'] = state.anonId;
  return h;
}

async function api(method, path, body = null, retries = 1) {
  if (!state.origin || !state.csrf) throw new Error('NOT_AUTHENTICATED');
  const url = `${state.origin}${path}`;
  const opts = {
    method,
    headers: headers(body ? { 'content-type': 'application/json' } : {}),
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);

  // Rate limit: long Retry-After (>30s) would block the SW past its lifecycle.
  // Cap our in-flight retry and let the caller reschedule via alarms.
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
    if (retries > 0 && retryAfter <= 30) {
      console.warn(`[ReVint] Rate limited, waiting ${retryAfter}s...`);
      await delay(retryAfter * 1000);
      return api(method, path, body, retries - 1);
    }
    throw new Error(`RATE_LIMITED: retry-after ${retryAfter}s`);
  }

  // DataDome challenge (403 with captcha)
  if (res.status === 403) {
    const text = await res.text().catch(() => '');
    if (text.includes('datadome') || text.includes('captcha-delivery')) {
      throw new Error('DATADOME_CHALLENGE: Vinted a detecte une activite automatisee. Ouvrez Vinted dans un onglet et resolvez le CAPTCHA, puis reessayez.');
    }
    throw new Error(`VINTED_API_403: ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`VINTED_API_${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// ─── User ────────────────────────────────────────────
// Prefer /users/current (newer endpoint Vinted started rolling out).
// Fall back to the legacy /users/me only on 404 — other errors
// (429, 403/DataDome) should propagate so the caller knows why.
export async function getCurrentUser() {
  let data;
  try {
    data = await api('GET', '/api/v2/users/current');
  } catch (e) {
    if (!/VINTED_API_404/.test(e.message)) throw e;
    data = await api('GET', '/api/v2/users/me');
  }
  return data.user;
}

// ─── Items ───────────────────────────────────────────
export async function getUserItems(userId, page = 1, perPage = 96) {
  return api('GET', `/api/v2/users/${userId}/items?page=${page}&per_page=${perPage}`);
}

// Same pattern as getCurrentUser: only fall back on 404.
export async function getItemDetails(itemId) {
  try {
    return await api('GET', `/api/v2/item_upload/items/${itemId}`);
  } catch (e) {
    if (!/VINTED_API_404/.test(e.message)) throw e;
    return api('GET', `/api/v2/items/${itemId}`);
  }
}

export async function updateItem(itemId, fields) {
  return api('PUT', `/api/v2/items/${itemId}`, { item: fields });
}

export async function deleteItem(itemId) {
  return api('POST', `/api/v2/items/${itemId}/delete`);
}

export async function createItem(itemPayload) {
  return api('POST', '/api/v2/item_upload/items', itemPayload);
}

// ─── Photos ──────────────────────────────────────────
export async function fetchImageAsBlob(url) {
  const res = await fetch(url, { credentials: 'omit', mode: 'cors' });
  if (!res.ok) throw new Error(`IMG_FETCH_${res.status}`);
  return res.blob();
}

export async function uploadPhoto(blob, filename = 'photo.jpg') {
  if (!state.origin || !state.csrf) throw new Error('NOT_AUTHENTICATED');
  const uuid = crypto.randomUUID();
  const form = new FormData();
  form.append('photo[type]', 'item');
  form.append('photo[temp_uuid]', uuid);
  form.append('photo[file]', blob, filename);

  const photoHeaders = {
    'x-csrf-token': state.csrf,
    'x-enable-multiple-size-groups': 'true',
  };
  if (state.anonId) photoHeaders['x-anon-id'] = state.anonId;

  const res = await fetch(`${state.origin}/api/v2/photos`, {
    method: 'POST',
    headers: photoHeaders,
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error(`PHOTO_UPLOAD_${res.status}`);
  return res.json();
}

// ─── Image transformation (defeat perceptual hashing) ─────
// Vinted flags reposts whose photos perceptually match recent deletions
// (pHash/dHash-style matching). A lossless re-upload is detected. We apply
// small structural changes that shift the hash far enough from the original
// without visibly degrading the image:
//   • random micro-crop (1-3px per side)
//   • brightness shift (±2-5 units on all channels)
//   • pixel noise on ~8% of pixels (±1 unit)
//   • randomized JPEG quality (85-95%)
// Uses OffscreenCanvas which is available in MV3 service workers.
async function transformImage(blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    const cropL = 1 + Math.floor(Math.random() * 3);
    const cropT = 1 + Math.floor(Math.random() * 3);
    const cropR = 1 + Math.floor(Math.random() * 3);
    const cropB = 1 + Math.floor(Math.random() * 3);
    const newW = width - cropL - cropR;
    const newH = height - cropT - cropB;

    // Image too small for safe cropping: only add noise on the original size.
    if (newW < 100 || newH < 100) {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      addPixelNoise(imageData.data, width, height);
      ctx.putImageData(imageData, 0, 0);
      const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 + Math.random() * 0.07 });
      bitmap.close();
      return outBlob;
    }

    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, cropL, cropT, newW, newH, 0, 0, newW, newH);

    const brightnessShift = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 4));
    const imageData = ctx.getImageData(0, 0, newW, newH);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i]   = Math.min(255, Math.max(0, data[i]   + brightnessShift));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + brightnessShift));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + brightnessShift));
    }
    // Noise writes into imageData.data in place; next call flushes to canvas.
    addPixelNoise(data, newW, newH);
    ctx.putImageData(imageData, 0, 0);

    const quality = 0.85 + Math.random() * 0.10;
    const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    bitmap.close();
    return outBlob;
  } catch (e) {
    console.warn('[ReVint] Image transform failed, using original:', e.message);
    return blob;
  }
}

function addPixelNoise(data, w, h) {
  const pixelCount = w * h;
  const noisePixels = Math.floor(pixelCount * 0.08);
  for (let n = 0; n < noisePixels; n++) {
    const idx = Math.floor(Math.random() * pixelCount) * 4;
    const noise = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    data[idx]   = Math.min(255, Math.max(0, data[idx]   + noise));
    data[idx+1] = Math.min(255, Math.max(0, data[idx+1] + noise));
    data[idx+2] = Math.min(255, Math.max(0, data[idx+2] + noise));
  }
}

// ─── Limits & cooldowns (serialized per key to avoid lost updates) ───
// Rationale on the numbers:
//   • 7-day per-item cooldown: Vinted's recommender suppresses items that
//     were reposted recently; 7 days is the empirical floor before visibility
//     returns to normal.
//   • 15 reposts/day: anti-ban threshold observed in the wild. Going higher
//     significantly raises the risk of account flag.
const storageMutex = new Map();
async function withKeyMutex(key, fn) {
  const prev = storageMutex.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  storageMutex.set(key, next.catch(() => {}));
  return next;
}

// ─── Repost ──────────────────────────────────────────
export async function repostItem(itemId, onProgress) {
  const today = new Date().toISOString().slice(0, 10);

  // Per-item cooldown + per-day quota check MUST both read AND reserve the
  // slot under the same mutex so concurrent reposts (popup + widget, two
  // overlapping batches) can't both pass the 14→15 check. We reserve a slot
  // up front and release it on failure to preserve quota.
  await withKeyMutex('revint_repost_counters', async () => {
    const { revint_repost_history: history, revint_repost_daily: daily } =
      await chrome.storage.local.get(['revint_repost_history', 'revint_repost_daily']);
    const repostHistory = (history && typeof history === 'object') ? history : {};
    const lastRepost = repostHistory[itemId];
    if (lastRepost) {
      const daysSince = (Date.now() - lastRepost) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        throw new Error(`COOLDOWN: Cet article a ete reposte il y a ${Math.round(daysSince)} jours. Attendez ${Math.round(7 - daysSince)} jours.`);
      }
    }
    const repostToday = (daily?.date === today) ? daily.count : 0;
    if (repostToday >= 15) {
      throw new Error('DAILY_LIMIT: Maximum 15 reposts par jour atteint.');
    }
    // Reserve the daily slot atomically. If anything downstream fails the
    // error handler at the end of the function releases it again.
    await chrome.storage.local.set({
      revint_repost_daily: { date: today, count: repostToday + 1 },
    });
  });

  let released = false;
  const releaseSlot = async () => {
    if (released) return;
    released = true;
    await withKeyMutex('revint_repost_counters', async () => {
      const { revint_repost_daily: cur } = await chrome.storage.local.get('revint_repost_daily');
      if (cur?.date === today && cur.count > 0) {
        await chrome.storage.local.set({
          revint_repost_daily: { date: today, count: cur.count - 1 },
        });
      }
    });
  };

  if (onProgress) onProgress('fetching', itemId);
  let item;
  try {
    ({ item } = await getItemDetails(itemId));
  } catch (e) {
    await releaseSlot();
    throw e;
  }

  // Backup so the user can recover if anything downstream fails.
  // Scope the key by user id to avoid cross-account contamination when
  // multiple Vinted accounts are used in the same Chrome profile.
  const userPrefix = state.userId ? `${state.userId}_` : '';
  const backupKey = `revint_backup_${userPrefix}${itemId}`;
  await chrome.storage.local.set({ [backupKey]: { item, timestamp: Date.now() } });

  // Upload photos — track each successful upload so we can best-effort cleanup
  // if a later step fails, instead of leaving them stranded on Vinted.
  const newPhotos = [];
  try {
    for (let i = 0; i < (item.photos || []).length; i++) {
      const photo = item.photos[i];
      const url = photo.full_size_url || photo.url;
      if (!url) continue;
      if (onProgress) onProgress('photo', itemId, i + 1, item.photos.length);
      const blob = await fetchImageAsBlob(url);
      const transformedBlob = await transformImage(blob);
      const uploaded = await uploadPhoto(transformedBlob);
      newPhotos.push({ id: uploaded.id, orientation: photo.orientation || 0 });
      await delay(1500 + Math.random() * 2500);
    }
  } catch (photoErr) {
    // Photo phase failed: backup is still in storage, nothing visible to user
    // has been changed yet. Release the reserved daily slot and propagate.
    await releaseSlot();
    throw new Error(`PHOTO_PHASE_FAILED: ${photoErr.message}`);
  }

  // Create the new item first. If this fails the original listing is
  // untouched and we simply return the error.
  if (onProgress) onProgress('creating', itemId);
  const payload = {
    item: {
      id: null,
      currency: item.price_currency || 'EUR',
      temp_uuid: crypto.randomUUID(),
      title: item.title,
      description: item.description,
      brand_id: item.brand_id,
      brand: item.brand_title || item.brand || '',
      size_id: item.size_id,
      catalog_id: item.catalog_id,
      isbn: item.isbn || null,
      author: item.author || null,
      book_title: item.book_title || null,
      model: item.model || null,
      video_game_rating_id: item.video_game_rating_id || null,
      is_unisex: item.is_unisex || false,
      status_id: item.status_id || 1,
      price: item.price_numeric || parseFloat(item.price) || 0,
      package_size_id: item.package_size_id,
      shipment_prices: { domestic: null, international: null },
      color_ids: item.color_ids || [],
      assigned_photos: newPhotos,
      item_attributes: item.item_attributes || [],
      manufacturer: item.manufacturer || null,
      manufacturer_labelling: item.manufacturer_labelling || null,
      measurement_length: item.measurement_length || null,
      measurement_width: item.measurement_width || null,
      measurement_unit: item.measurement_unit || null,
    },
    feedback_id: null,
    push_up: false,
    parcel: null,
    upload_session_id: crypto.randomUUID(),
  };

  let created;
  try {
    created = await createItem(payload);
  } catch (e) {
    await releaseSlot();
    throw e;
  }

  if (!created?.item?.id) {
    await releaseSlot();
    throw new Error('REPOST_FAILED: La creation du nouvel article a echoue. L\'ancien article n\'a PAS ete supprime.');
  }

  // Creation succeeded — delete the original. If deletion fails we end up with
  // two live listings (duplicate), which is user-visible. Retry once, and if
  // that still fails, persist a pending-deletion record so a background alarm
  // can retry later without losing the state.
  if (onProgress) onProgress('deleting', itemId);
  let deletionError = null;
  try {
    await deleteItem(itemId);
  } catch (e1) {
    try {
      await delay(2000);
      await deleteItem(itemId);
    } catch (e2) {
      deletionError = e2;
      const { revint_pending_deletions: pending } = await chrome.storage.local.get('revint_pending_deletions');
      const list = Array.isArray(pending) ? pending : [];
      list.push({ itemId, reason: e2.message, ts: Date.now() });
      await chrome.storage.local.set({ revint_pending_deletions: list });
      console.error('[ReVint] deleteItem failed twice, queued for later:', itemId, e2);
    }
  }
  await delay(500 + Math.random() * 1000);

  // Success (or queued deletion): clean backup + update history atomically.
  // The daily count was reserved up front, so we only update history here.
  await chrome.storage.local.remove(backupKey);
  await withKeyMutex('revint_repost_counters', async () => {
    const { revint_repost_history: curHist } = await chrome.storage.local.get('revint_repost_history');
    const h = (curHist && typeof curHist === 'object') ? curHist : {};
    delete h[itemId];
    h[created.item.id] = Date.now();
    await chrome.storage.local.set({ revint_repost_history: h });
  });

  if (onProgress) onProgress('done', itemId, created.item.id);
  if (deletionError) {
    return { ...created, _warning: 'ORIGINAL_DELETION_DEFERRED' };
  }
  return created;
}

// Export this so the service worker can build its mutex-aware counters.
export { withKeyMutex };

// ─── Notifications / Messaging ───────────────────────
export async function getNotifications(page = 1) {
  return api('GET', `/api/v2/notifications?page=${page}&per_page=20`);
}

export async function sendMessage(conversationId, body) {
  return api('POST', `/api/v2/conversations/${conversationId}/replies`, {
    reply: { body, photo_temp_uuids: null },
  });
}

export async function getInbox(page = 1) {
  return api('GET', `/api/v2/inbox?page=${page}&per_page=20`);
}

// ─── Helpers ─────────────────────────────────────────
export function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
