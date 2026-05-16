// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Google OAuth Helper (Direct API Access)
// Uses Google Identity Services (GIS) implicit grant flow
// to get an access_token and call Google APIs directly.
// ═══════════════════════════════════════════════════════════════

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ');

const TOKEN_KEY = 'maria_google_token';
const TOKEN_EXPIRY_KEY = 'maria_google_token_expiry';

/**
 * Get the stored Google access token if it hasn't expired.
 */
export function getGoogleToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry, 10)) {
    // Token expired, clear it
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }
  return token;
}

/**
 * Save a Google access token.
 */
export function setGoogleToken(token, expiresIn) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
}

/**
 * Clear the stored Google token.
 */
export function clearGoogleToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Check if user has a valid Google token.
 */
export function isGoogleConnected() {
  return !!getGoogleToken();
}

/**
 * Load the Google Identity Services script if not already loaded.
 */
function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-gis-script');
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Prompt the user to sign in with Google and grant permissions.
 * Returns the access_token on success, or throws on cancel/error.
 */
export async function connectGoogle() {
  await loadGisScript();

  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        setGoogleToken(response.access_token, response.expires_in);
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message || 'Google login cancelled'));
      },
    });
    client.requestAccessToken();
  });
}

/**
 * Make an authenticated fetch to a Google API endpoint.
 * Automatically attaches the access token.
 * Uses in-memory cache for GET requests to avoid redundant calls
 * when switching between dashboard tabs.
 * Throws if no token is available.
 */
export async function googleFetch(url, options = {}) {
  const token = getGoogleToken();
  if (!token) {
    throw new Error('NO_GOOGLE_TOKEN');
  }

  const method = (options.method || 'GET').toUpperCase();
  const isRead = method === 'GET';

  // ── Cache: check for cached GET responses ─────────────────
  if (isRead) {
    const { getCachedResponse } = await import('./google-cache.js');
    const cached = getCachedResponse(url);
    if (cached && !cached.isStale) {
      // Fresh cache hit — return immediately
      return cached.data;
    }
    if (cached && cached.isStale) {
      // Stale cache — return stale data immediately, refresh in background
      _backgroundRefresh(url, token);
      return cached.data;
    }
  }

  // ── Actual fetch ──────────────────────────────────────────
  const data = await _rawGoogleFetch(url, token, options);

  // ── Cache: store GET responses ────────────────────────────
  if (isRead && data !== null) {
    const { setCachedResponse } = await import('./google-cache.js');
    setCachedResponse(url, data);
  }

  // ── Cache: invalidate on mutations ────────────────────────
  if (!isRead) {
    const { invalidateCache } = await import('./google-cache.js');
    // Detect which service and invalidate its cache
    if (url.includes('calendar.googleapis.com')) invalidateCache('calendar');
    else if (url.includes('gmail.googleapis.com')) invalidateCache('gmail');
    else if (url.includes('drive.googleapis.com')) invalidateCache('drive');
    else if (url.includes('classroom.googleapis.com')) invalidateCache('classroom');
  }

  return data;
}

/**
 * Raw fetch without cache logic (used internally).
 * @private
 */
async function _rawGoogleFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let msg;
    try {
      const json = JSON.parse(text);
      msg = json.error?.message || json.error || text;
    } catch {
      msg = text;
    }
    throw new Error(`Google API Error (${res.status}): ${msg}`);
  }

  // Handle 204 No Content (e.g. DELETE responses)
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }

  return res.json();
}

/**
 * Refresh a cached URL in the background (stale-while-revalidate).
 * @private
 */
function _backgroundRefresh(url, token) {
  _rawGoogleFetch(url, token)
    .then(async (data) => {
      if (data !== null) {
        const { setCachedResponse } = await import('./google-cache.js');
        setCachedResponse(url, data);
      }
    })
    .catch((err) => {
      console.warn('[GoogleCache] Background refresh failed:', err.message);
    });
}
