// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Google API Cache
// In-memory cache with TTL for Google API responses.
// Prevents redundant API calls when switching between dashboard
// tabs. Supports stale-while-revalidate and manual invalidation.
//
// Strategy:
//   GET requests → cached with configurable TTL
//   POST/PUT/DELETE → bypass cache + invalidate related entries
// ═══════════════════════════════════════════════════════════════

/** @type {Map<string, { data: any, timestamp: number, ttl: number }>} */
const cache = new Map();

// Default TTL per Google API service (in ms)
const TTL_CONFIG = {
  calendar:  5 * 60 * 1000,   // 5 min — events don't change that often
  gmail:     2 * 60 * 1000,   // 2 min — emails arrive more frequently
  drive:     5 * 60 * 1000,   // 5 min — files rarely change
  classroom: 10 * 60 * 1000,  // 10 min — coursework updates are infrequent
  default:   3 * 60 * 1000,   // 3 min fallback
};

/**
 * Detect which Google service a URL belongs to.
 * @param {string} url
 * @returns {string}
 */
function detectService(url) {
  if (url.includes('calendar.googleapis.com')) return 'calendar';
  if (url.includes('gmail.googleapis.com')) return 'gmail';
  if (url.includes('drive.googleapis.com')) return 'drive';
  if (url.includes('classroom.googleapis.com')) return 'classroom';
  return 'default';
}

/**
 * Generate a cache key from URL (strip timestamps for calendar queries
 * to allow semantic caching, but keep important params).
 * @param {string} url
 * @returns {string}
 */
function getCacheKey(url) {
  try {
    const parsed = new URL(url);
    // Remove rapidly-changing params that would bust the cache unnecessarily
    // Keep timeMin/timeMax rounded to the hour for calendar
    const service = detectService(url);
    if (service === 'calendar') {
      // Round timeMin to the nearest hour to improve cache hits
      const timeMin = parsed.searchParams.get('timeMin');
      if (timeMin) {
        const d = new Date(timeMin);
        d.setMinutes(0, 0, 0);
        parsed.searchParams.set('timeMin', d.toISOString());
      }
      const timeMax = parsed.searchParams.get('timeMax');
      if (timeMax) {
        const d = new Date(timeMax);
        d.setMinutes(0, 0, 0);
        parsed.searchParams.set('timeMax', d.toISOString());
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Get a cached response if available and not expired.
 * @param {string} url
 * @returns {{ data: any, isStale: boolean } | null}
 */
export function getCachedResponse(url) {
  const key = getCacheKey(url);
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > entry.ttl * 2) {
    // Too old, remove entirely
    cache.delete(key);
    return null;
  }

  return {
    data: entry.data,
    isStale: age > entry.ttl,
  };
}

/**
 * Store a response in the cache.
 * @param {string} url
 * @param {any} data
 * @param {number} [customTtl] - Override TTL in ms
 */
export function setCachedResponse(url, data, customTtl) {
  const key = getCacheKey(url);
  const service = detectService(url);
  const ttl = customTtl || TTL_CONFIG[service] || TTL_CONFIG.default;

  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });

  // Keep cache size under control (max 100 entries)
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

/**
 * Invalidate all cached entries for a specific Google service.
 * Call this after mutations (create/update/delete).
 * @param {'calendar'|'gmail'|'drive'|'classroom'|'all'} service
 */
export function invalidateCache(service = 'all') {
  if (service === 'all') {
    cache.clear();
    return;
  }

  const servicePatterns = {
    calendar: 'calendar.googleapis.com',
    gmail: 'gmail.googleapis.com',
    drive: 'drive.googleapis.com',
    classroom: 'classroom.googleapis.com',
  };

  const pattern = servicePatterns[service];
  if (!pattern) return;

  for (const [key] of cache) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate a specific URL pattern from cache.
 * @param {string} urlPattern - Partial URL to match
 */
export function invalidateCacheByUrl(urlPattern) {
  for (const [key] of cache) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics for debugging.
 */
export function getCacheStats() {
  let fresh = 0;
  let stale = 0;
  const now = Date.now();

  for (const [, entry] of cache) {
    if (now - entry.timestamp <= entry.ttl) fresh++;
    else stale++;
  }

  return {
    total: cache.size,
    fresh,
    stale,
    entries: [...cache.keys()].map(k => {
      const entry = cache.get(k);
      return {
        key: k.substring(0, 80),
        age: Math.round((now - entry.timestamp) / 1000) + 's',
        ttl: Math.round(entry.ttl / 1000) + 's',
        fresh: now - entry.timestamp <= entry.ttl,
      };
    }),
  };
}

export default {
  get: getCachedResponse,
  set: setCachedResponse,
  invalidate: invalidateCache,
  invalidateByUrl: invalidateCacheByUrl,
  stats: getCacheStats,
};
