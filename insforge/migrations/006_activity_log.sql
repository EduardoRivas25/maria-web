-- ═══════════════════════════════════════════════════════════════
-- M.A.R.I.A. — Migration 006: Activity Log & Analytics
-- Tracks user actions for productivity analytics
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.activity_log IS 'Audit trail and productivity analytics data source';

-- Auto-log task completions
CREATE OR REPLACE FUNCTION public.log_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.user_id,
      'task_completed',
      'task',
      NEW.id,
      jsonb_build_object(
        'title', NEW.title,
        'priority', NEW.priority,
        'tags', to_jsonb(NEW.tags)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_completed ON public.tasks;
CREATE TRIGGER on_task_completed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_completion();

-- Auto-log task creation
CREATE OR REPLACE FUNCTION public.log_task_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.user_id,
    'task_created',
    'task',
    NEW.id,
    jsonb_build_object('title', NEW.title)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_created ON public.tasks;
CREATE TRIGGER on_task_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_creation();
