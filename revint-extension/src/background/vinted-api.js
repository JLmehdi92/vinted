// ─── Vinted API — all endpoints for repost, messaging, items ───

let state = { csrf: null, anonId: null, origin: null, userId: null };

export function setState(patch) {
  Object.assign(state, patch);
  chrome.storage.session.set({ vintedState: state });
}

export function getState() {
  return { ...state };
}

export async function restoreState() {
  const data = await chrome.storage.session.get('vintedState');
  if (data.vintedState) Object.assign(state, data.vintedState);
}

// Fetch a fresh CSRF token by loading Vinted pages
// Tries multiple pages as fallback since some may redirect or require auth
export async function refreshCsrf(origin) {
  const targetOrigin = origin || state.origin || 'https://www.vinted.fr';
  const pagesToTry = [
    `${targetOrigin}/catalog`,
    `${targetOrigin}/`,
    `${targetOrigin}/items/new`,
    `${targetOrigin}/member/general/all`,
  ];

  for (const url of pagesToTry) {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 'accept': 'text/html' },
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Extract CSRF token from the HTML
      // Vinted uses Next.js SSR — tokens are in JSON-escaped strings
      // Strategy: unescape first, then use simple regex (like competitors do)
      let csrf = null;
      let anonId = null;

      // Unescape the HTML (handles Next.js double-escaping)
      const cleaned = html
        .replace(/\\u0022/g, '"')
        .replace(/\\\\"/g, '"')
        .replace(/\\"/g, '"');

      // Pattern 1: Standard JSON after unescaping
      const csrfMatch = cleaned.match(/"CSRF_TOKEN"\s*:\s*"([^"]+)"/);
      if (csrfMatch) csrf = csrfMatch[1];

      // Pattern 2: Direct UUID search after CSRF_TOKEN (fallback)
      if (!csrf) {
        const uuidMatch = html.match(/CSRF_TOKEN[^a-f0-9-]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (uuidMatch) csrf = uuidMatch[1];
      }

      // Pattern 3: meta tag
      if (!csrf) {
        const metaMatch = html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
        if (metaMatch) csrf = metaMatch[1];
      }

      // ANON_ID with same strategy
      const anonMatch = cleaned.match(/"ANON_ID"\s*:\s*"([^"]+)"/);
      if (anonMatch) anonId = anonMatch[1];
      if (!anonId) {
        const anonUuid = html.match(/ANON_ID[^a-f0-9-]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (anonUuid) anonId = anonUuid[1];
      }

      if (csrf) {
        setState({ csrf, anonId: anonId || state.anonId, origin: targetOrigin });
        return true;
      }
    } catch {
      continue;
    }
  }

  // Last resort: try to get CSRF from cookies
  try {
    if (chrome.cookies) {
      const cookie = await chrome.cookies.get({ url: targetOrigin, name: 'csrf_token' });
      if (cookie?.value) {
        setState({ csrf: cookie.value, origin: targetOrigin });
        return true;
      }
    }
  } catch { /* cookies API may not be available */ }

  return false;
}

function headers(extra = {}) {
  return {
    accept: 'application/json, text/plain, */*',
    'x-csrf-token': state.csrf,
    'x-anon-id': state.anonId || '',
    'x-enable-multiple-size-groups': 'true',
    ...extra,
  };
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

  // Handle rate limiting — respect Retry-After header
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
    if (retries > 0) {
      console.warn(`[ReVint] Rate limited, waiting ${retryAfter}s...`);
      await delay(retryAfter * 1000);
      return api(method, path, body, retries - 1);
    }
    throw new Error('RATE_LIMITED');
  }

  // Handle DataDome challenge (403 with captcha)
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
export async function getCurrentUser() {
  // Vinted changed /users/me to /users/current in 2026
  let data;
  try {
    data = await api('GET', '/api/v2/users/current');
  } catch {
    // Fallback to old endpoint
    data = await api('GET', '/api/v2/users/me');
  }
  return data.user;
}

// ─── Items ───────────────────────────────────────────
export async function getUserItems(userId, page = 1, perPage = 96) {
  return api('GET', `/api/v2/users/${userId}/items?page=${page}&per_page=${perPage}`);
}

export async function getItemDetails(itemId) {
  try {
    return await api('GET', `/api/v2/item_upload/items/${itemId}`);
  } catch {
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

  const res = await fetch(`${state.origin}/api/v2/photos`, {
    method: 'POST',
    headers: {
      'x-csrf-token': state.csrf,
      'x-anon-id': state.anonId || '',
      'x-enable-multiple-size-groups': 'true',
    },
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error(`PHOTO_UPLOAD_${res.status}`);
  return res.json();
}

// ─── Image transformation (defeat perceptual hashing) ─────
// Applies subtle but structurally significant modifications:
// - Random micro-crop (1-3px per side)
// - Slight brightness/contrast shift
// - Pixel-level noise injection
// - Randomized JPEG quality
// Uses OffscreenCanvas (available in MV3 service workers)
async function transformImage(blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    // Random crop: remove 1-3px from each side
    const cropL = 1 + Math.floor(Math.random() * 3);
    const cropT = 1 + Math.floor(Math.random() * 3);
    const cropR = 1 + Math.floor(Math.random() * 3);
    const cropB = 1 + Math.floor(Math.random() * 3);
    const newW = width - cropL - cropR;
    const newH = height - cropT - cropB;

    if (newW < 100 || newH < 100) {
      // Image too small for safe cropping, just add noise
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      addPixelNoise(ctx, width, height);
      const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 + Math.random() * 0.07 });
      bitmap.close();
      return outBlob;
    }

    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext('2d');

    // Draw cropped region
    ctx.drawImage(bitmap, cropL, cropT, newW, newH, 0, 0, newW, newH);

    // Slight brightness shift (+/- 2-5 units)
    const brightnessShift = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 4));
    const imageData = ctx.getImageData(0, 0, newW, newH);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + brightnessShift));     // R
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + brightnessShift)); // G
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + brightnessShift)); // B
    }

    // Inject random pixel noise (1-2 units on ~10% of pixels)
    addPixelNoise(ctx, newW, newH, imageData);
    ctx.putImageData(imageData, 0, 0);

    // Export with randomized JPEG quality (85-95%)
    const quality = 0.85 + Math.random() * 0.10;
    const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    bitmap.close();
    return outBlob;
  } catch (e) {
    console.warn('[ReVint] Image transform failed, using original:', e.message);
    return blob; // Fallback: return original if transform fails
  }
}

function addPixelNoise(ctx, w, h, imageData) {
  const data = imageData ? imageData.data : ctx.getImageData(0, 0, w, h).data;
  const pixelCount = w * h;
  const noisePixels = Math.floor(pixelCount * 0.08); // 8% of pixels
  for (let n = 0; n < noisePixels; n++) {
    const idx = Math.floor(Math.random() * pixelCount) * 4;
    const noise = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    data[idx] = Math.min(255, Math.max(0, data[idx] + noise));
    data[idx+1] = Math.min(255, Math.max(0, data[idx+1] + noise));
    data[idx+2] = Math.min(255, Math.max(0, data[idx+2] + noise));
  }
  if (!imageData) ctx.putImageData(new ImageData(data, w, h), 0, 0);
}

// ─── Repost ──────────────────────────────────────────
export async function repostItem(itemId, onProgress) {
  // ── Cooldown par article (minimum 7 jours) ──
  const { revint_repost_history: history } = await chrome.storage.local.get('revint_repost_history');
  const repostHistory = history || {};
  const lastRepost = repostHistory[itemId];
  if (lastRepost) {
    const daysSince = (Date.now() - lastRepost) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      throw new Error(`COOLDOWN: Cet article a ete reposte il y a ${Math.round(daysSince)} jours. Attendez ${Math.round(7 - daysSince)} jours.`);
    }
  }

  // ── Limite quotidienne (max 15 reposts/jour) ──
  const { revint_repost_daily: daily } = await chrome.storage.local.get('revint_repost_daily');
  const today = new Date().toISOString().slice(0, 10);
  const repostToday = (daily?.date === today) ? daily.count : 0;
  if (repostToday >= 15) {
    throw new Error('DAILY_LIMIT: Maximum 15 reposts par jour atteint.');
  }

  if (onProgress) onProgress('fetching', itemId);
  const { item } = await getItemDetails(itemId);

  // ── Backup avant toute action ──
  const backupKey = `revint_backup_${itemId}`;
  await chrome.storage.local.set({ [backupKey]: { item, timestamp: Date.now() } });

  // Download, TRANSFORM, and re-upload all photos with new IDs
  const newPhotos = [];
  for (let i = 0; i < (item.photos || []).length; i++) {
    const photo = item.photos[i];
    const url = photo.full_size_url || photo.url;
    if (!url) continue;
    if (onProgress) onProgress('photo', itemId, i + 1, item.photos.length);
    const blob = await fetchImageAsBlob(url);
    // Transform image to defeat perceptual hash detection
    const transformedBlob = await transformImage(blob);
    const uploaded = await uploadPhoto(transformedBlob);
    newPhotos.push({ id: uploaded.id, orientation: photo.orientation || 0 });
    // Humanized delay: 1.5-4s between photo uploads
    await delay(1500 + Math.random() * 2500);
  }

  // ── CREATE le nouvel article d'abord ──
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

  const created = await createItem(payload);

  // ── Vérifier que la création a réussi avant de supprimer ──
  if (!created?.item?.id) {
    throw new Error('REPOST_FAILED: La creation du nouvel article a echoue. L\'ancien article n\'a PAS ete supprime.');
  }

  // ── Seulement maintenant, supprimer l'ancien article ──
  if (onProgress) onProgress('deleting', itemId);
  await deleteItem(itemId);
  await delay(500 + Math.random() * 1000);

  // ── Succès : nettoyer le backup et enregistrer l'historique ──
  await chrome.storage.local.remove(backupKey);

  // Remove old item entry and track new item
  delete repostHistory[itemId];
  repostHistory[created.item.id] = Date.now();
  await chrome.storage.local.set({ revint_repost_history: repostHistory });
  await chrome.storage.local.set({ revint_repost_daily: { date: today, count: repostToday + 1 } });

  if (onProgress) onProgress('done', itemId, created.item.id);
  return created;
}

// ─── Notifications / Favorites ───────────────────────
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
