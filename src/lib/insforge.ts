// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Insforge SDK Client Singleton
// Central point of access for all Insforge services
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@insforge/sdk';

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL;
const insforgeAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

if (!insforgeUrl || !insforgeAnonKey) {
  console.error(
    '[M.A.R.I.A.] Missing Insforge env vars. ' +
    'Copy .env.example to .env.local and fill in VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY'
  );
}

/**
 * Singleton Insforge client.
 * Used for:
 * - `insforge.auth` — Authentication (sign up, sign in, OAuth, session)
 * - `insforge.database` — PostgREST CRUD (auto-protected by RLS)
 * - `insforge.functions` — Edge Function invocations
 * - `insforge.storage` — File storage (future)
 * - `insforge.realtime` — WebSocket subscriptions (Phase 4)
 */
export const insforge = createClient({
  baseUrl: insforgeUrl || '',
  anonKey: insforgeAnonKey || '',
});

export default insforge;
