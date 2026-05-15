-- ═══════════════════════════════════════════════════════════════
-- M.A.R.I.A. — Migration 003: Tasks
-- Full task management with subtasks support
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  due_date        DATE,
  tags            TEXT[] DEFAULT '{}',
  sort_order      INTEGER DEFAULT 0,
  parent_task_id  UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tasks IS 'User tasks with priorities, categories, tags, and subtask hierarchy';

-- Auto-set completed_at when status changes to done
CREATE OR REPLACE FUNCTION public.handle_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_task_status_timestamps
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_status_change();

CREATE TRIGGER set_task_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
