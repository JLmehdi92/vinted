# ReVint Chrome Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production Chrome extension (Manifest V3) for Vinted power-sellers with repost, auto-messaging, bulk edit, analytics, and settings — matching the ReVint design system pixel-perfectly.

**Architecture:** Event-driven Manifest V3 extension. Service worker intercepts CSRF/anon tokens from Vinted requests and manages scheduling via chrome.alarms. Content scripts inject the popup UI (React) and interact with the Vinted DOM. All API calls go through the service worker to handle CORS and token management. No external backend — everything runs locally in the browser.

**Tech Stack:** Chrome Extension Manifest V3, React 18 (bundled via esbuild), Vinted internal API v2, chrome.storage for persistence, chrome.alarms for scheduling.

---

## File Structure

```
revint-extension/
├── manifest.json                  # MV3 manifest with permissions
├── package.json                   # Build scripts (esbuild)
├── esbuild.config.mjs             # Build config
├── src/
│   ├── background/
│   │   ├── service-worker.js      # Main SW: token capture, alarms, API proxy
│   │   ├── vinted-api.js          # All Vinted API calls (repost, message, items)
│   │   └── scheduler.js           # Repost/message scheduling with random delays
│   ├── popup/
│   │   ├── index.html             # Popup shell
│   │   ├── index.jsx              # React entry point
│   │   ├── App.jsx                # Main app with routing
│   │   ├── hooks/
│   │   │   ├── useVinted.js       # Hook: auth state, user info
│   │   │   ├── useArticles.js     # Hook: articles list, selection, filters
│   │   │   ├── useStats.js        # Hook: stats data
│   │   │   └── useTheme.js        # Hook: dark/light mode
│   │   ├── screens/
│   │   │   ├── Onboarding.jsx     # Screen 01: auto-connect flow
│   │   │   ├── Dashboard.jsx      # Screen 02: stats + quick actions
│   │   │   ├── Articles.jsx       # Screen 03: list + multi-select + filters
│   │   │   ├── EditArticle.jsx    # Screen 04: edit single article
│   │   │   ├── Repost.jsx         # Screen 05: repost config + launch
│   │   │   ├── Automation.jsx     # Screen 06: auto-reply to favorites
│   │   │   ├── Stats.jsx          # Screen 07: charts + funnel
│   │   │   └── Settings.jsx       # Screen 08: preferences + account
│   │   ├── components/
│   │   │   ├── Header.jsx         # Shared header with logo/back/actions
│   │   │   ├── Tabs.jsx           # Tab bar (Dash/Articles/Auto/Stats)
│   │   │   ├── ArticleRow.jsx     # Single article row with checkbox
│   │   │   ├── StatTile.jsx       # Stat card (value + delta)
│   │   │   ├── Toggle.jsx         # Toggle switch
│   │   │   ├── Chip.jsx           # Chip/pill component
│   │   │   └── Icons.jsx          # All SVG icons
│   │   └── styles.css             # Full design system CSS
│   └── content/
│       └── content.js             # Injected on vinted.fr — CSRF extraction fallback
├── dist/                          # Built output (gitignored)
└── assets/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

---

## Task 1: Project Scaffold + Manifest + Build System

**Files:**
- Create: `revint-extension/manifest.json`
- Create: `revint-extension/package.json`
- Create: `revint-extension/esbuild.config.mjs`
- Create: `revint-extension/assets/icon-16.png` (placeholder)
- Create: `revint-extension/assets/icon-48.png` (placeholder)
- Create: `revint-extension/assets/icon-128.png` (placeholder)

- [ ] **Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "ReVint — Assistant Vinted",
  "version": "1.0.0",
  "description": "Repost, auto-reponse, edition en lot pour vendeurs Vinted.",
  "permissions": [
    "storage",
    "alarms",
    "webRequest",
    "cookies",
    "notifications"
  ],
  "host_permissions": [
    "https://www.vinted.fr/*",
    "https://www.vinted.be/*",
    "https://www.vinted.es/*",
    "https://www.vinted.it/*",
    "https://www.vinted.de/*",
    "https://www.vinted.nl/*",
    "https://www.vinted.pt/*",
    "https://www.vinted.pl/*",
    "https://www.vinted.lt/*",
    "https://www.vinted.co.uk/*",
    "https://www.vinted.com/*",
    "https://images1.vinted.net/*",
    "https://images.vinted.net/*",
    "https://images1.vinted.com/*"
  ],
  "background": {
    "service_worker": "dist/background.js"
  },
  "action": {
    "default_popup": "dist/popup/index.html",
    "default_icon": {
      "16": "assets/icon-16.png",
      "48": "assets/icon-48.png",
      "128": "assets/icon-128.png"
    }
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.vinted.fr/*",
        "https://www.vinted.be/*",
        "https://www.vinted.es/*",
        "https://www.vinted.it/*",
        "https://www.vinted.de/*",
        "https://www.vinted.nl/*",
        "https://www.vinted.pt/*",
        "https://www.vinted.pl/*",
        "https://www.vinted.lt/*",
        "https://www.vinted.co.uk/*",
        "https://www.vinted.com/*"
      ],
      "js": ["dist/content.js"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "assets/icon-16.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  }
}
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "revint-extension",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "node esbuild.config.mjs",
    "watch": "node esbuild.config.mjs --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "esbuild": "^0.24.0"
  }
}
```

- [ ] **Step 3: Create esbuild.config.mjs**

```javascript
import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const isWatch = process.argv.includes('--watch');

const shared = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  target: 'chrome120',
  loader: { '.jsx': 'jsx', '.js': 'js' },
  jsx: 'automatic',
  jsxImportSource: 'react',
};

// Ensure dist/popup exists
if (!existsSync('dist/popup')) mkdirSync('dist/popup', { recursive: true });

// Copy popup HTML
copyFileSync('src/popup/index.html', 'dist/popup/index.html');

const configs = [
  {
    ...shared,
    entryPoints: ['src/background/service-worker.js'],
    outfile: 'dist/background.js',
    format: 'iife',
  },
  {
    ...shared,
    entryPoints: ['src/popup/index.jsx'],
    outfile: 'dist/popup/index.js',
    format: 'iife',
  },
  {
    ...shared,
    entryPoints: ['src/content/content.js'],
    outfile: 'dist/content.js',
    format: 'iife',
  },
];

if (isWatch) {
  for (const config of configs) {
    const ctx = await context(config);
    await ctx.watch();
  }
  console.log('Watching for changes...');
} else {
  await Promise.all(configs.map(c => build(c)));
  console.log('Build complete.');
}
```

- [ ] **Step 4: Create placeholder icons**

Generate simple 16x16, 48x48, 128x128 gold "R" icons using canvas (or use placeholder PNGs). For now, create simple colored squares as data URIs converted to PNG files.

- [ ] **Step 5: Install dependencies and verify build**

```bash
cd revint-extension && npm install && npm run build
```

Expected: `Build complete.` with `dist/background.js`, `dist/popup/index.js`, `dist/content.js` created.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold project with MV3 manifest and esbuild"
```

---

## Task 2: Service Worker — Token Capture + API Proxy

**Files:**
- Create: `src/background/service-worker.js`
- Create: `src/background/vinted-api.js`

- [ ] **Step 1: Create vinted-api.js — all Vinted API methods**

```javascript
// src/background/vinted-api.js

const VINTED_DOMAINS = [
  'www.vinted.fr', 'www.vinted.be', 'www.vinted.es', 'www.vinted.it',
  'www.vinted.de', 'www.vinted.nl', 'www.vinted.pt', 'www.vinted.pl',
  'www.vinted.lt', 'www.vinted.co.uk', 'www.vinted.com',
];

let state = { csrf: null, anonId: null, origin: null, userId: null };

export function setState(patch) {
  Object.assign(state, patch);
  chrome.storage.session.set({ vintedState: state });
}

export function getState() {
  return state;
}

export async function restoreState() {
  const data = await chrome.storage.session.get('vintedState');
  if (data.vintedState) Object.assign(state, data.vintedState);
}

function headers(extra = {}) {
  return {
    'accept': 'application/json, text/plain, */*',
    'x-csrf-token': state.csrf,
    'x-anon-id': state.anonId || '',
    'x-enable-multiple-size-groups': 'true',
    ...extra,
  };
}

async function api(method, path, body = null) {
  if (!state.origin || !state.csrf) throw new Error('Not authenticated');
  const url = `${state.origin}${path}`;
  const opts = {
    method,
    headers: headers(body ? { 'content-type': 'application/json' } : {}),
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── User ────────────────────────────────────────────
export async function getCurrentUser() {
  const data = await api('GET', '/api/v2/users/me');
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
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  return res.blob();
}

export async function uploadPhoto(blob, filename = 'photo.jpg') {
  if (!state.origin || !state.csrf) throw new Error('Not authenticated');
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
  if (!res.ok) throw new Error(`Photo upload failed: ${res.status}`);
  return res.json();
}

// ─── Repost ──────────────────────────────────────────
export async function repostItem(itemId) {
  // 1. Get full item details
  const { item } = await getItemDetails(itemId);

  // 2. Download and re-upload all photos
  const newPhotos = [];
  for (const photo of item.photos || []) {
    const url = photo.full_size_url || photo.url;
    if (!url) continue;
    const blob = await fetchImageAsBlob(url);
    const uploaded = await uploadPhoto(blob);
    newPhotos.push({ id: uploaded.id, orientation: photo.orientation || 0 });
    // Random delay 1-3s between photo uploads
    await delay(1000 + Math.random() * 2000);
  }

  // 3. Delete original
  await deleteItem(itemId);
  await delay(500 + Math.random() * 1000);

  // 4. Create new item with same data + new photo IDs
  const payload = {
    item: {
      id: null,
      currency: item.price_currency || 'EUR',
      temp_uuid: crypto.randomUUID(),
      title: item.title,
      description: item.description,
      brand_id: item.brand_id,
      brand: item.brand_title || item.brand,
      size_id: item.size_id,
      catalog_id: item.catalog_id,
      isbn: item.isbn || null,
      author: item.author || null,
      book_title: item.book_title || null,
      model: item.model || null,
      video_game_rating_id: item.video_game_rating_id || null,
      is_unisex: item.is_unisex || false,
      status_id: item.status_id || 1,
      price: item.price_numeric || item.price,
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
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export { delay };
```

- [ ] **Step 2: Create service-worker.js**

```javascript
// src/background/service-worker.js

import {
  setState, getState, restoreState,
  getCurrentUser, getUserItems, getItemDetails,
  updateItem, repostItem, uploadPhoto, fetchImageAsBlob,
  getNotifications, sendMessage, getInbox, delay,
} from './vinted-api.js';

// ─── Restore state on wake ──────────────────────────
restoreState();

// ─── Intercept Vinted requests to capture tokens ────
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    let csrf = null;
    let anonId = null;
    for (const h of details.requestHeaders) {
      const name = h.name.toLowerCase();
      if (name === 'x-csrf-token') csrf = h.value;
      if (name === 'x-anon-id') anonId = h.value;
    }
    if (csrf) {
      const url = new URL(details.url);
      const origin = url.origin;
      setState({ csrf, anonId, origin });
    }
  },
  {
    urls: [
      "https://www.vinted.fr/api/*",
      "https://www.vinted.be/api/*",
      "https://www.vinted.es/api/*",
      "https://www.vinted.it/api/*",
      "https://www.vinted.de/api/*",
      "https://www.vinted.nl/api/*",
      "https://www.vinted.pt/api/*",
      "https://www.vinted.pl/api/*",
      "https://www.vinted.lt/api/*",
      "https://www.vinted.co.uk/api/*",
      "https://www.vinted.com/api/*",
    ],
  },
  ["requestHeaders"]
);

// ─── Message handler for popup/content scripts ──────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch(e => sendResponse({ error: e.message }));
  return true; // keep channel open for async
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'revint:getState':
      return getState();

    case 'revint:connect': {
      const state = getState();
      if (!state.csrf || !state.origin) {
        return { connected: false, error: 'Ouvrez Vinted dans un onglet et naviguez pour capturer la session.' };
      }
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
    }

    case 'revint:getItems': {
      const state = getState();
      if (!state.userId) throw new Error('Not connected');
      const data = await getUserItems(state.userId, msg.page || 1, msg.perPage || 96);
      return data;
    }

    case 'revint:getItemDetails':
      return getItemDetails(msg.itemId);

    case 'revint:updateItem':
      return updateItem(msg.itemId, msg.fields);

    case 'revint:repost': {
      const result = await repostItem(msg.itemId);
      return { success: true, newItem: result };
    }

    case 'revint:repostBatch': {
      const results = [];
      for (const itemId of msg.itemIds) {
        try {
          const result = await repostItem(itemId);
          results.push({ itemId, success: true, newId: result.item?.id });
        } catch (e) {
          results.push({ itemId, success: false, error: e.message });
        }
        // Random delay 3-12 minutes between reposts (anti-spam)
        if (msg.itemIds.indexOf(itemId) < msg.itemIds.length - 1) {
          const delayMs = msg.delayMin
            ? (msg.delayMin + Math.random() * (msg.delayMax - msg.delayMin)) * 60000
            : (180 + Math.random() * 540) * 1000; // default 3-12 min
          await delay(delayMs);
        }
      }
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
      return { ok: true };
    }

    default:
      throw new Error(`Unknown message type: ${msg.type}`);
  }
}

// ─── Alarms for scheduled tasks ─────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'revint:autoReply') {
    await processAutoReply();
  }
  if (alarm.name.startsWith('revint:scheduledRepost:')) {
    const itemId = parseInt(alarm.name.split(':')[2]);
    if (itemId) {
      try {
        await repostItem(itemId);
      } catch (e) {
        console.error('Scheduled repost failed:', e);
      }
    }
  }
});

async function processAutoReply() {
  const settings = await chrome.storage.local.get(['revint_auto_reply']);
  const config = settings.revint_auto_reply;
  if (!config?.enabled) return;

  try {
    const { notifications } = await getNotifications(1);
    const favoriteNotifs = (notifications || []).filter(n =>
      n.link && n.link.includes('?offering_id=')
    );

    const replied = await chrome.storage.local.get(['revint_replied_ids']);
    const repliedIds = new Set(replied.revint_replied_ids || []);

    for (const notif of favoriteNotifs) {
      if (repliedIds.has(notif.id)) continue;

      // Extract conversation ID from notification link
      const match = notif.link.match(/\/inbox\/(\d+)/);
      if (!match) continue;
      const convId = match[1];

      // Apply template
      let message = config.template || '';
      // Replace variables if we can extract them from notification body
      message = message.replace(/\{\{prenom\}\}/g, extractName(notif.body) || 'Bonjour');

      await sendMessage(convId, message);
      repliedIds.add(notif.id);

      // Random delay 1-5 min between messages
      await delay((60 + Math.random() * 240) * 1000);

      // Check daily limit
      if (repliedIds.size >= (config.dailyLimit || 30)) break;
    }

    await chrome.storage.local.set({ revint_replied_ids: [...repliedIds] });
  } catch (e) {
    console.error('Auto-reply error:', e);
  }
}

function extractName(html) {
  if (!html) return null;
  const m = html.match(/>([^<]+)<\/a>/);
  return m ? m[1].split('_')[0] : null;
}

// ─── Install / startup ──────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('revint:autoReply', { periodInMinutes: 5 });
});
```

- [ ] **Step 3: Build and verify no errors**

```bash
cd revint-extension && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: service worker with token capture, Vinted API, repost + messaging"
```

---

## Task 3: Content Script — CSRF Fallback Extraction

**Files:**
- Create: `src/content/content.js`

- [ ] **Step 1: Create content.js**

```javascript
// src/content/content.js
// Fallback CSRF extraction from Vinted page DOM

(function() {
  function extractCsrf() {
    // Method 1: from inline script containing CSRF_TOKEN
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const m = s.textContent.match(/"CSRF_TOKEN"\s*:\s*"([^"]+)"/);
      if (m) return m[1];
    }
    // Method 2: from meta tag
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.content;
    return null;
  }

  function extractAnonId() {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const m = s.textContent.match(/"ANON_ID"\s*:\s*"([^"]+)"/);
      if (m) return m[1];
    }
    return null;
  }

  // Send tokens to background on page load
  const csrf = extractCsrf();
  const anonId = extractAnonId();
  if (csrf) {
    chrome.runtime.sendMessage({
      type: 'revint:tokensFromContent',
      csrf,
      anonId,
      origin: window.location.origin,
    });
  }

  // Listen for requests from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'revint:extractTokens') {
      sendResponse({ csrf: extractCsrf(), anonId: extractAnonId(), origin: window.location.origin });
    }
  });
})();
```

- [ ] **Step 2: Add handler in service-worker.js for content token messages**

Add to the `handleMessage` switch in `service-worker.js`:

```javascript
    case 'revint:tokensFromContent': {
      if (msg.csrf) {
        setState({ csrf: msg.csrf, anonId: msg.anonId, origin: msg.origin });
      }
      return { ok: true };
    }
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: content script CSRF extraction fallback"
```

---

## Task 4: Popup — HTML Shell + CSS Design System + Entry Point

**Files:**
- Create: `src/popup/index.html`
- Create: `src/popup/styles.css`
- Create: `src/popup/index.jsx`

- [ ] **Step 1: Create popup index.html**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=400">
  <title>ReVint</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script src="index.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create styles.css**

Copy the full CSS design system from the extension.html file we already built. This includes all `.ext-popup`, `.ext-header`, `.ext-tabs`, `.btn`, `.inp`, `.card`, `.stat`, `.art-row`, `.chip`, `.toggle`, `.cb`, dark mode overrides, etc.

The CSS is already complete and production-ready — it's the exact same file from our design prototype.

- [ ] **Step 3: Create index.jsx**

```jsx
// src/popup/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

- [ ] **Step 4: Update esbuild config to copy CSS**

Add to `esbuild.config.mjs` after the HTML copy:
```javascript
copyFileSync('src/popup/styles.css', 'dist/popup/styles.css');
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: popup shell with design system CSS"
```

---

## Task 5: Shared Components (Icons, Header, Tabs, Toggle, Chip, StatTile, ArticleRow)

**Files:**
- Create: `src/popup/components/Icons.jsx`
- Create: `src/popup/components/Header.jsx`
- Create: `src/popup/components/Tabs.jsx`
- Create: `src/popup/components/Toggle.jsx`
- Create: `src/popup/components/Chip.jsx`
- Create: `src/popup/components/StatTile.jsx`
- Create: `src/popup/components/ArticleRow.jsx`

- [ ] **Step 1: Create Icons.jsx** — all SVG icons as named exports

All icons from the design (search, close, check, chev, chevD, back, heart, eye, settings, refresh, boost, msg, edit, plus, cal, zap, trash, sun, moon). Each as a React component.

- [ ] **Step 2: Create Header.jsx**

Props: `title`, `onBack`, `right` (ReactNode for action buttons).
Renders: `.ext-header` with logo mark "R" or back button, title, status chip, actions.

- [ ] **Step 3: Create Tabs.jsx**

Props: `current`, `onChange`, `tabs` (array of {id, label, badge?}).
Renders: `.ext-tabs` with active state and gold underline.

- [ ] **Step 4: Create Toggle.jsx, Chip.jsx, StatTile.jsx, ArticleRow.jsx**

Each matches the design pixel-perfectly. ArticleRow takes `article`, `selected`, `onToggle`, `onClick` props.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: shared UI components (Header, Tabs, Toggle, Chip, StatTile, ArticleRow)"
```

---

## Task 6: Hooks (useVinted, useArticles, useStats, useTheme)

**Files:**
- Create: `src/popup/hooks/useVinted.js`
- Create: `src/popup/hooks/useArticles.js`
- Create: `src/popup/hooks/useStats.js`
- Create: `src/popup/hooks/useTheme.js`

- [ ] **Step 1: Create useVinted.js** — auth state hook

Manages: connection status, user info, loading state.
Calls: `revint:connect` on mount, stores user in chrome.storage.local.
Returns: `{ connected, user, loading, error, reconnect }`.

- [ ] **Step 2: Create useArticles.js** — articles list + selection

Manages: fetching items via `revint:getItems`, filtering (all/hot/active/stale), search, selection state.
Returns: `{ articles, loading, selected, toggleSelect, selectAll, clearSelection, filter, setFilter, query, setQuery, refresh }`.

- [ ] **Step 3: Create useStats.js** — computed stats from articles

Computes: total items, views/7d, favorites, sales estimate, top articles, view history.
Returns: `{ stats, topArticles, viewData, loading }`.

- [ ] **Step 4: Create useTheme.js** — dark/light mode

Persists to chrome.storage.local. Toggles `.dark` class on popup root.
Returns: `{ dark, toggle }`.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: React hooks for Vinted auth, articles, stats, theme"
```

---

## Task 7: Screens — Onboarding + Dashboard

**Files:**
- Create: `src/popup/screens/Onboarding.jsx`
- Create: `src/popup/screens/Dashboard.jsx`

- [ ] **Step 1: Create Onboarding.jsx**

Animated auto-connect flow matching the design:
- Scanner animation with "R" logo
- 4-step progress (detect session, fetch profile, sync articles, ready)
- Steps auto-advance with 1.4s delay each
- "Ouvrir le dashboard" button on completion
- Calls `revint:connect` to actually authenticate

- [ ] **Step 2: Create Dashboard.jsx**

Matching the design:
- Greeting with user name and date
- 4 stat tiles (articles actifs, vues/7j, favoris, ventes/mois)
- Quick actions (repost, auto-reponse) linking to respective screens
- Recent activity feed (from notifications API)

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Onboarding and Dashboard screens"
```

---

## Task 8: Screens — Articles List + Edit Article

**Files:**
- Create: `src/popup/screens/Articles.jsx`
- Create: `src/popup/screens/EditArticle.jsx`

- [ ] **Step 1: Create Articles.jsx**

- Search bar with icon
- Filter chips (Tous/Hot/Actifs/A booster) — status derived from article age + views
- Article rows with checkboxes, thumbnails, title, brand, size, status chip, price, views, favs
- Footer with selection count + "Editer" and "Reposter" buttons
- Real data from `useArticles` hook

- [ ] **Step 2: Create EditArticle.jsx**

- Photo grid (real thumbnails from article data)
- Editable title with character count
- Editable price + category dropdown
- AI suggestion box ("baissez a X€ pour entrer dans le top recherche")
- Editable description textarea
- Read-only brand + size
- Stats bar (published days ago, views, favs)
- Save calls `revint:updateItem`, Delete calls `revint:deleteItem` (with confirmation)

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Articles list and Edit article screens"
```

---

## Task 9: Screen — Repost (the critical one)

**Files:**
- Create: `src/popup/screens/Repost.jsx`

- [ ] **Step 1: Create Repost.jsx**

This is the most important screen. Matching the design:
- Count of selected articles with thumbnail preview strip
- **When** selector: Maintenant / Planifier / Heure opti.
  - "Maintenant": launches immediately
  - "Planifier": shows date/time picker
  - "Heure opti.": shows calculated optimal window from stats
- Toggle: "Delai aleatoire entre posts" (3-12 min, ON by default)
- Toggle: "Conserver les statistiques" (always on — we do this by copying all item data)
- Estimation box: duree totale + gain vues estime
- "Lancer" button triggers `revint:repostBatch` via chrome.runtime.sendMessage
- Progress indicator during repost (updates via chrome.storage changes)

**Implementation detail for "Lancer":**
```javascript
async function handleLaunch() {
  setRunning(true);
  const response = await chrome.runtime.sendMessage({
    type: 'revint:repostBatch',
    itemIds: selectedIds,
    delayMin: delayEnabled ? 3 : 0.5,
    delayMax: delayEnabled ? 12 : 1,
  });
  setRunning(false);
  setResults(response.results);
}
```

- [ ] **Step 2: Add progress tracking in service worker**

In `service-worker.js`, update the `revint:repostBatch` handler to emit progress:

```javascript
// After each repost, save progress to storage
await chrome.storage.local.set({
  revint_repost_progress: {
    total: msg.itemIds.length,
    done: results.length,
    current: itemId,
    status: results[results.length - 1]?.success ? 'ok' : 'error',
  },
});
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Repost screen with batch repost + progress tracking"
```

---

## Task 10: Screen — Automation (Auto-Reply to Favorites)

**Files:**
- Create: `src/popup/screens/Automation.jsx`

- [ ] **Step 1: Create Automation.jsx**

Matching the design:
- Main toggle: Reponse auto aux favoris (ON/OFF)
  - When ON: dark bg card with zap icon, "ACTIF · X envoyes aujourd'hui"
  - Saves to `chrome.storage.local` key `revint_auto_reply`
- Template editor textarea with current template text
- Variable buttons: `{{prenom}}`, `{{article}}`, `{{prix}}`, `{{marque}}`
  - Clicking inserts variable at cursor position
- Preview card: shows template rendered with real example data
- Conditions section:
  - Delai avant envoi: 5-15 min (configurable)
  - Max par jour: 30 messages (configurable)
  - Ignorer si favori < 24h: toggle
  - Ne pas envoyer 2x: toggle (always on)

**On toggle change:**
```javascript
async function handleToggle(enabled) {
  setEnabled(enabled);
  const config = { enabled, template: tpl, dailyLimit, delay: delayConfig, noDupes: true };
  await chrome.storage.local.set({ revint_auto_reply: config });
  // The alarm in service-worker picks this up every 5 min
}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Automation screen with auto-reply config"
```

---

## Task 11: Screen — Stats

**Files:**
- Create: `src/popup/screens/Stats.jsx`

- [ ] **Step 1: Create Stats.jsx**

Matching the design:
- Period header: "14 derniers jours"
- Bar chart (SVG): views per day, last bar gold, others ink
- Total views with delta %
- Top articles table: ranked by views, with thumb, title, stats, price
- Conversion funnel: VUES → FAVORIS → MESSAGES → VENDUS with progress bars

Data comes from `useStats` hook. The hook computes derived metrics from the articles data (views, favs aggregated).

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Stats screen with chart and funnel"
```

---

## Task 12: Screen — Settings

**Files:**
- Create: `src/popup/screens/Settings.jsx`

- [ ] **Step 1: Create Settings.jsx**

Matching the design:
- Account card: avatar (initial), @username, plan badge, "Gerer" button
- Preferences section: Langue, Devise, Notifications bureau, Theme sombre (wired to useTheme)
- Automatisation section: Fenetre d'activite, Jours actifs, Limite quotidienne
- Compte Vinted section: Session status, Reconnecter (triggers re-auth), Se deconnecter (clears storage)
- Version footer: REVINT v1.0.0 · BUILD XXXX

All settings persisted in `chrome.storage.local` under key `revint_settings`.

- [ ] **Step 2: Build and verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Settings screen with preferences and account management"
```

---

## Task 13: App.jsx — Screen Router + Main Layout

**Files:**
- Create: `src/popup/App.jsx`

- [ ] **Step 1: Create App.jsx**

```jsx
import React, { useState, useMemo } from 'react';
import { useVinted } from './hooks/useVinted.js';
import { useArticles } from './hooks/useArticles.js';
import { useTheme } from './hooks/useTheme.js';
import Header from './components/Header.jsx';
import Tabs from './components/Tabs.jsx';
import { IconRefresh, IconSettings, IconEdit, IconBoost } from './components/Icons.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Articles from './screens/Articles.jsx';
import EditArticle from './screens/EditArticle.jsx';
import Repost from './screens/Repost.jsx';
import Automation from './screens/Automation.jsx';
import Stats from './screens/Stats.jsx';
import Settings from './screens/Settings.jsx';

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { connected, user, loading: authLoading } = useVinted();
  const articles = useArticles(connected);

  const [screen, setScreen] = useState(connected ? 'main' : 'onboard');
  const [tab, setTab] = useState('dashboard');
  const [editingArticle, setEditingArticle] = useState(null);

  const go = (s, payload) => {
    if (s === 'edit') { setEditingArticle(payload); setScreen('edit'); return; }
    if (['dashboard', 'articles', 'automation', 'stats'].includes(s)) {
      setTab(s); setScreen('main'); return;
    }
    setScreen(s);
  };

  const popupClass = `ext-popup${dark ? ' dark' : ''}`;

  if (screen === 'onboard' || (!connected && !authLoading)) {
    return (
      <div className={popupClass}>
        <Onboarding onDone={() => { setScreen('main'); setTab('dashboard'); }} />
      </div>
    );
  }

  if (screen === 'edit' && editingArticle) {
    return (
      <div className={popupClass}>
        <EditArticle
          article={editingArticle}
          onBack={() => setScreen('main')}
          onSave={() => { articles.refresh(); setScreen('main'); }}
        />
      </div>
    );
  }

  if (screen === 'repost') {
    return (
      <div className={popupClass}>
        <Repost
          selectedIds={articles.selected}
          articles={articles.articles}
          onBack={() => setScreen('main')}
          onDone={() => { articles.refresh(); articles.clearSelection(); setScreen('main'); }}
        />
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div className={popupClass}>
        <Settings user={user} onBack={() => setScreen('main')} />
      </div>
    );
  }

  // Main with tabs
  return (
    <div className={popupClass}>
      <Header right={
        <>
          <ThemeToggle dark={dark} onToggle={toggleTheme} />
          <button className="ext-iconbtn" title="Rafraichir" onClick={() => articles.refresh()}>
            <IconRefresh />
          </button>
          <button className="ext-iconbtn" title="Parametres" onClick={() => setScreen('settings')}>
            <IconSettings />
          </button>
        </>
      } />
      <Tabs
        current={tab}
        onChange={setTab}
        tabs={[
          { id: 'dashboard', label: 'Dash' },
          { id: 'articles', label: 'Articles', badge: articles.articles.length || null },
          { id: 'automation', label: 'Auto' },
          { id: 'stats', label: 'Stats' },
        ]}
      />
      <div className="ext-main">
        {tab === 'dashboard' && <Dashboard user={user} articles={articles} go={go} />}
        {tab === 'articles' && <Articles articles={articles} go={go} />}
        {tab === 'automation' && <Automation />}
        {tab === 'stats' && <Stats articles={articles.articles} />}
      </div>
      {tab === 'articles' && articles.selected.length > 0 && (
        <div className="ext-footer">
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ext-fg-4)',letterSpacing:'0.05em'}}>
            {articles.selected.length} SELECTIONNE{articles.selected.length !== 1 ? 'S' : ''}
          </div>
          <div style={{flex:1}} />
          <button className="btn btn-sm" onClick={() => go('edit', articles.articles.find(a => articles.selected.includes(a.id)))}>
            <IconEdit /> Editer
          </button>
          <button className="btn btn-sm btn-gold" onClick={() => go('repost')}>
            <IconBoost /> Reposter
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build and verify full extension loads**

```bash
npm run build
```

Load the extension in Chrome via `chrome://extensions` → Load unpacked → select `revint-extension/`.
Click the extension icon — popup should render with the design.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: App router connecting all screens"
```

---

## Task 14: End-to-End Testing on Vinted

- [ ] **Step 1: Test auth flow**

1. Open vinted.fr, log in normally
2. Click ReVint icon → should show Onboarding
3. Onboarding should auto-detect session (tokens captured by webRequest)
4. Click "Ouvrir le dashboard" → Dashboard with real user data

- [ ] **Step 2: Test articles loading**

1. Navigate to Articles tab
2. Should show real articles from the user's wardrobe
3. Search and filters should work
4. Clicking an article → Edit screen with real data

- [ ] **Step 3: Test single repost (on a test article)**

1. Create a cheap test article on Vinted
2. Select it in Articles
3. Click Reposter → Repost screen
4. Click "Lancer (1)"
5. Verify: old article deleted, new article created with same title/price/description/photos

- [ ] **Step 4: Test auto-reply config**

1. Go to Auto tab
2. Toggle ON, edit template
3. Verify config saved in chrome.storage

- [ ] **Step 5: Fix any issues found during testing**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "fix: adjustments from end-to-end testing"
```

---

## Task 15: Polish + Production Build

- [ ] **Step 1: Generate proper icons**

Create `assets/icon-16.png`, `icon-48.png`, `icon-128.png` — dark square with gold "R" matching the design's `.ext-logo-mark` and `.lp-nav-mark` style.

- [ ] **Step 2: Add error boundaries and loading states**

Wrap each screen in an error boundary. Add skeleton loading states for articles and stats.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Verify the `dist/` folder contains everything needed:
- `dist/background.js`
- `dist/content.js`
- `dist/popup/index.html`
- `dist/popup/index.js`
- `dist/popup/styles.css`

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: production-ready ReVint Chrome extension v1.0.0"
```
