// ─── Anti-detection system — Dotb-pattern security layer ───
// Wraps API calls with human-like delays, CAPTCHA detection, 2FA handling,
// concurrency limiting, and keep-alive mechanisms.

// ─── Abortable delay (Dotb: Tn function) ────────────
// Random delay between min and max ms, cancellable via AbortController
export function abortableDelay(minMs, maxMs, signal) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('DELAY_ABORTED'));
      });
    }
  });
}

// ─── Operation-specific delay configs (matching Dotb values) ───
export const DELAYS = {
  bulkAction:      { min: 5000,   max: 10000 },
  notification:    { min: 60000,  max: 120000 },
  repost:          { min: 40000,  max: 80000 },
  smartOffer:      { min: 20000,  max: 300000 },
  message:         { min: 1000,   max: 2000 },
  photoUpload:     { min: 500,    max: 1000 },
  hideBeforeDelete:{ min: 400,    max: 800 },
  afterPublish:    { min: 2000,   max: 5000 },
  afterCaptcha:    { min: 600000, max: 900000 },
  microJitter:     { min: 0,      max: 50 },
};

// ─── CAPTCHA detection ──────────────────────────────
// Dotb detects CAPTCHA via 403 status + captcha-delivery URL in response
export function isCaptchaError(error) {
  if (!error) return false;
  const msg = error.message || '';
  return msg.includes('DATADOME') || msg.includes('captcha') ||
    (error.status === 403 && (msg.includes('captcha-delivery') || msg.includes('datadome')));
}

export function extractCaptchaUrl(error) {
  const msg = error.message || '';
  const match = msg.match(/https:\/\/[^\s"']+captcha[^\s"']*/i);
  return match ? match[0] : null;
}

// ─── 2FA detection ──────────────────────────────────
// Vinted returns code 146 when 2FA is required
export function is2FARequired(error) {
  const msg = error.message || '';
  return msg.includes('code 146') || msg.includes('entity_2fa_required') ||
    msg.includes('VINTED_API_403');
}

// ─── Rate limit detection ───────────────────────────
export function isRateLimited(error) {
  const msg = error.message || '';
  return msg.includes('RATE_LIMITED') || msg.includes('429') || msg.includes('too_many_requests');
}

// ─── Concurrency limiter ────────────────────────────
// Dotb limits most operations to 1-2 concurrent requests
export function createConcurrencyLimiter(maxConcurrent = 1) {
  let running = 0;
  const queue = [];

  return async function limit(fn) {
    while (running >= maxConcurrent) {
      await new Promise(resolve => queue.push(resolve));
    }
    running++;
    try {
      return await fn();
    } finally {
      running--;
      if (queue.length > 0) queue.shift()();
    }
  };
}

// Global limiters for different operation types
export const apiLimiter = createConcurrencyLimiter(2);
export const messageLimiter = createConcurrencyLimiter(1);
export const offerLimiter = createConcurrencyLimiter(1);
export const photoLimiter = createConcurrencyLimiter(2);

// ─── User safety checks ────────────────────────────
// Skip users that are blocked, moderators, or have low ratings
export function shouldSkipUser(user, config = {}) {
  if (!user) return { skip: true, reason: 'no_user' };
  if (user.is_blocked) return { skip: true, reason: 'user_is_blocked' };
  if (user.is_hated) return { skip: true, reason: 'user_blocked_you' };
  if (user.moderator) return { skip: true, reason: 'user_is_moderator' };

  if (config.ignoredUsers) {
    const ignored = new Set((config.ignoredUsers || '').split(',').map(s => s.trim().toLowerCase()));
    if (ignored.has((user.login || '').toLowerCase())) {
      return { skip: true, reason: 'user_in_ignored_list' };
    }
  }

  if (config.skipUsersWithoutRatings && (!user.feedback_reputation || user.feedback_reputation === 0)) {
    return { skip: true, reason: 'no_rating' };
  }

  if (config.minUserRating && user.feedback_reputation < config.minUserRating) {
    return { skip: true, reason: 'rating_too_low' };
  }

  return { skip: false };
}

// ─── Problematic brand detection ────────────────────
// Dotb warns about brands that trigger duplicate detection
const PROBLEMATIC_BRANDS = [
  'nike', 'adidas', 'zara', 'h&m', 'shein', 'primark',
  'pull&bear', 'bershka', 'stradivarius', 'mango',
];

export function isProblematicBrand(brandName) {
  if (!brandName) return false;
  return PROBLEMATIC_BRANDS.includes(brandName.toLowerCase());
}

// ─── Photo preset rotation ──────────────────────────
// 26 presets that rotate cyclically to avoid duplicate detection
export const PHOTO_PRESETS = [
  { key: 'rotate_neg3', name: 'Rotation -3°', transform: { rotate: -3 } },
  { key: 'rotate_neg2', name: 'Rotation -2°', transform: { rotate: -2 } },
  { key: 'rotate_neg1', name: 'Rotation -1°', transform: { rotate: -1 } },
  { key: 'rotate_pos1', name: 'Rotation +1°', transform: { rotate: 1 } },
  { key: 'rotate_pos2', name: 'Rotation +2°', transform: { rotate: 2 } },
  { key: 'rotate_pos3', name: 'Rotation +3°', transform: { rotate: 3 } },
  { key: 'skew_x_neg', name: 'Skew X -0.25°', transform: { skewX: -0.25 } },
  { key: 'skew_x_pos', name: 'Skew X +0.25°', transform: { skewX: 0.25 } },
  { key: 'skew_y_neg', name: 'Skew Y -0.25°', transform: { skewY: -0.25 } },
  { key: 'skew_y_pos', name: 'Skew Y +0.25°', transform: { skewY: 0.25 } },
  { key: 'bright_up', name: 'Brightness +3', transform: { brightness: 3 } },
  { key: 'bright_down', name: 'Brightness -3', transform: { brightness: -3 } },
  { key: 'contrast_up', name: 'Contrast +5', transform: { contrast: 5 } },
  { key: 'contrast_down', name: 'Contrast -5', transform: { contrast: -5 } },
  { key: 'saturation_up', name: 'Saturation +5', transform: { saturation: 5 } },
  { key: 'saturation_down', name: 'Saturation -5', transform: { saturation: -5 } },
  { key: 'crop_top', name: 'Crop top 2px', transform: { cropTop: 2 } },
  { key: 'crop_bottom', name: 'Crop bottom 2px', transform: { cropBottom: 2 } },
  { key: 'crop_left', name: 'Crop left 2px', transform: { cropLeft: 2 } },
  { key: 'crop_right', name: 'Crop right 2px', transform: { cropRight: 2 } },
  { key: 'hue_shift_pos', name: 'Hue +2°', transform: { hue: 2 } },
  { key: 'hue_shift_neg', name: 'Hue -2°', transform: { hue: -2 } },
  { key: 'noise_light', name: 'Light noise 5%', transform: { noise: 0.05 } },
  { key: 'noise_medium', name: 'Medium noise 8%', transform: { noise: 0.08 } },
  { key: 'border_thin', name: 'Border 3px', transform: { border: 3 } },
  { key: 'border_medium', name: 'Border 5px', transform: { border: 5 } },
];

export function getNextPreset(lastPresetKey) {
  if (!lastPresetKey) return PHOTO_PRESETS[0];
  const idx = PHOTO_PRESETS.findIndex(p => p.key === lastPresetKey);
  return PHOTO_PRESETS[(idx + 1) % PHOTO_PRESETS.length];
}

// ─── Title modifier (Dotb auto-toggle pattern) ──────
// Auto mode: toggles case of first character
export function autoModifyTitle(title) {
  if (!title || title.length === 0) return title;
  const first = title[0];
  const toggled = first === first.toUpperCase() ? first.toLowerCase() : first.toUpperCase();
  return toggled + title.slice(1);
}

// Manual mode: append or prepend text
export function manualModifyTitle(title, modifier, position = 'end') {
  if (!modifier) return title;
  const maxLen = 100;
  if (position === 'beginning') {
    const result = modifier + ' ' + title;
    return result.slice(0, maxLen);
  }
  const result = title + ' ' + modifier;
  return result.slice(0, maxLen);
}

// ─── Price operations (Dotb pattern) ────────────────
export function applyPriceOperation(price, operation) {
  if (!operation || !operation.type) return price;
  let result = price;

  switch (operation.type) {
    case 'percentage_decrease':
      result = price * (1 - (operation.value || 0) / 100);
      break;
    case 'fixed_decrease':
      result = price - (operation.value || 0);
      break;
    case 'percentage_increase':
      result = price * (1 + (operation.value || 0) / 100);
      break;
    case 'fixed_increase':
      result = price + (operation.value || 0);
      break;
    case 'set':
      result = operation.value || price;
      break;
  }

  if (result < 0.5) result = 0.5;

  if (operation.rounding === 'round_unit') return Math.round(result);
  if (operation.rounding === 'round_10cents') return Math.round(result * 10) / 10;
  if (operation.rounding === 'floor_unit') return Math.floor(result);
  return +result.toFixed(2);
}
