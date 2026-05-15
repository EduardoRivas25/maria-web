-- ═══════════════════════════════════════════════════════════════
-- M.A.R.I.A. — Migration 007: OAuth Tokens
-- Secure storage for Google/GitHub API tokens
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('google', 'github')),
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes           TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

COMMENT ON TABLE public.oauth_tokens IS 'OAuth tokens for Google and GitHub API access — server-side only';

CREATE TRIGGER set_oauth_tokens_updated_at
  BEFORE UPDATE ON public.oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
