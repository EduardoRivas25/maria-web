-- ═══════════════════════════════════════════════════════════════
-- M.A.R.I.A. — Migration 002: Categories
-- Shared categories for tasks and finances
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#f99e02',
  type       TEXT NOT NULL CHECK (type IN ('task', 'finance')),
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'User-defined categories for tasks and financial transactions';

-- Seed default categories on profile creation
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, type) VALUES
    -- Task categories
    (NEW.id, 'Frontend',       '#f99e02', 'task'),
    (NEW.id, 'Backend',        '#3b82f6', 'task'),
    (NEW.id, 'Diseño',         '#8b5cf6', 'task'),
    (NEW.id, 'Documentación',  '#10b981', 'task'),
    (NEW.id, 'Testing',        '#ef4444', 'task'),
    (NEW.id, 'Académico',      '#ec4899', 'task'),
    -- Finance categories
    (NEW.id, 'Comida',         '#f99e02', 'finance'),
    (NEW.id, 'Transporte',     '#3b82f6', 'finance'),
    (NEW.id, 'Entretenimiento','#8b5cf6', 'finance'),
    (NEW.id, 'Escuela',        '#ef4444', 'finance'),
    (NEW.id, 'Tecnología',     '#10b981', 'finance'),
    (NEW.id, 'Freelance',      '#f99e02', 'finance'),
    (NEW.id, 'Beca',           '#3b82f6', 'finance'),
    (NEW.id, 'Sueldo',         '#10b981', 'finance');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_seed_categories ON public.profiles;
CREATE TRIGGER on_profile_created_seed_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();
