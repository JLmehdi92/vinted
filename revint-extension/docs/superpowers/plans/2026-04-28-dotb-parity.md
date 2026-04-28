# Dotb Feature Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all non-AI Dotb features + their anti-detection security system into ReVint, without losing any existing features.

**Architecture:** Backend-first approach — add all API functions and engines to vinted-api.js/service-worker.js, then build UI screens that consume them. Anti-detection is woven into every API call and automation engine.

**Tech Stack:** Chrome Extension MV3, React 18, esbuild (iife), Supabase, Chrome Alarms

---

## File Structure

### New files to create:
- `src/background/anti-detection.js` — Abortable delays, CAPTCHA detection, 2FA handling, keep-alive, concurrency limiter
- `src/background/smart-offers-engine.js` — Smart offers processor (extracted from service-worker for clarity)
- `src/background/restocker-engine.js` — Restocker processor
- `src/popup/screens/SmartOffers.jsx` — Smart Offers settings + live status UI
- `src/popup/screens/Restocker.jsx` — Restocker settings + event log UI
- `src/popup/screens/Orders.jsx` — Orders list + CSV export + shipping labels
- `src/popup/screens/BulkOps.jsx` — Bulk hide/unhide/publish/delete/price/title/follow
- `src/popup/screens/InboxManager.jsx` — Inbox with notes, statuses, quick replies
- `src/popup/components/QuickReply.jsx` — Quick reply template manager
- `src/popup/components/AccountSwitcher.jsx` — Multi-account dropdown component
- `src/popup/components/PhotoPresetPicker.jsx` — Photo preset selector for repost

### Files to modify:
- `src/background/vinted-api.js` — Add anti-detection wrapper, abortable delays
- `src/background/service-worker.js` — Enhanced auto-reply (entry_type 20, backlog/live, user filters), import new engines
- `src/popup/screens/Automation.jsx` — Add backlog/live mode, user filters, discount toggle, ignored users
- `src/popup/screens/Settings.jsx` — Multi-account section, delay settings, activity hours
- `src/popup/screens/Repost.jsx` — Draft mode toggle, price reduction, title modifier, photo preset selector
- `src/popup/App.jsx` — Add new screen routes, account switcher in header
- `src/popup/components/Header.jsx` — Account switcher integration
- `src/popup/components/Icons.jsx` — New icons for new screens
- `manifest.json` — Already done (27 domains)

---

### Task 1: Anti-Detection System

**Files:**
- Create: `src/background/anti-detection.js`
- Modify: `src/background/vinted-api.js`

Core: abortableDelay(), CAPTCHA detection, 2FA handling, concurrency limiter, keep-alive, operation-specific delay configs matching Dotb's exact values.

### Task 2: Enhanced Auto-Messages (Dotb Pattern)

**Files:**
- Modify: `src/background/service-worker.js` (rewrite processAutoReplyTick)
- Modify: `src/popup/screens/Automation.jsx`

Core: entry_type===20 detection, /web/api/notifications endpoint, backlog+live modes, user rating filter, ignored users, per-item/per-user limits, days-before-resend, discount offer integration, @username template.

### Task 3: Smart Offers UI

**Files:**
- Create: `src/popup/screens/SmartOffers.jsx`
- Modify: `src/popup/App.jsx`

Core: Simple/tiered offer settings, accept % / counter %, counter-offer steps, rounding toggle, accept/counter messages, per-user limits, live event log.

### Task 4: Restocker UI

**Files:**
- Create: `src/popup/screens/Restocker.jsx`
- Modify: `src/popup/App.jsx`

Core: Enable/disable, delay before restock, draft toggle, backlog orders count, event log.

### Task 5: Multi-Account UI

**Files:**
- Create: `src/popup/components/AccountSwitcher.jsx`
- Modify: `src/popup/screens/Settings.jsx`
- Modify: `src/popup/components/Header.jsx`
- Modify: `src/popup/App.jsx`

Core: Account list, add/remove/switch, current account indicator in header.

### Task 6: Bulk Operations Screen

**Files:**
- Create: `src/popup/screens/BulkOps.jsx`
- Modify: `src/popup/App.jsx`

Core: Bulk hide/unhide, bulk delete, bulk price (lower/raise/set + rounding), bulk title/desc (replace/append/prepend), bulk follow/unfollow, CSV export.

### Task 7: Orders + Shipping

**Files:**
- Create: `src/popup/screens/Orders.jsx`
- Modify: `src/popup/App.jsx`

Core: Orders list, transaction details, shipping label download, CSV export with full order data, auto-feedback after sale.

### Task 8: Inbox Management

**Files:**
- Create: `src/popup/screens/InboxManager.jsx`
- Create: `src/popup/components/QuickReply.jsx`
- Modify: `src/popup/App.jsx`

Core: Conversations list with search, quick replies CRUD, mark as read, private notes (local storage), conversation statuses (todo/in-progress/done).

### Task 9: Repost Enhancements

**Files:**
- Create: `src/popup/components/PhotoPresetPicker.jsx`
- Modify: `src/popup/screens/Repost.jsx`

Core: 26 photo presets (rotate/skew/3D), draft mode toggle, price reduction (% or fixed + rounding), title modifier (auto case-toggle or manual append/prepend), problematic brand warning.

### Task 10: New Icons + Navigation

**Files:**
- Modify: `src/popup/components/Icons.jsx`
- Modify: `src/popup/components/Tabs.jsx`

Core: Icons for all new screens, updated tab navigation with more items.
