const { execSync } = require('child_process');

const queries = [
  // 1. handle_task_status_change
  `CREATE OR REPLACE FUNCTION public.handle_task_status_change() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN NEW.completed_at = NOW(); ELSIF NEW.status != 'done' THEN NEW.completed_at = NULL; END IF; NEW.updated_at = NOW(); RETURN NEW; END; $$;`,
  `DROP TRIGGER IF EXISTS set_task_status_timestamps ON public.tasks;`,
  `CREATE TRIGGER set_task_status_timestamps BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_task_status_change();`,
  
  // 2. update_updated_at (if missing, but handle_new_user might have created it. Just to be safe)
  `CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;`,
  `DROP TRIGGER IF EXISTS set_task_updated_at ON public.tasks;`,
  `CREATE TRIGGER set_task_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();`,

  // 3. log_task_completion
  `CREATE OR REPLACE FUNCTION public.log_task_completion() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata) VALUES (NEW.user_id, 'task_completed', 'task', NEW.id, jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'tags', to_jsonb(NEW.tags))); END IF; RETURN NEW; END; $$;`,
  `DROP TRIGGER IF EXISTS on_task_completed ON public.tasks;`,
  `CREATE TRIGGER on_task_completed AFTER UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_task_completion();`,

  // 4. log_task_creation
  `CREATE OR REPLACE FUNCTION public.log_task_creation() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata) VALUES (NEW.user_id, 'task_created', 'task', NEW.id, jsonb_build_object('title', NEW.title)); RETURN NEW; END; $$;`,
  `DROP TRIGGER IF EXISTS on_task_created ON public.tasks;`,
  `CREATE TRIGGER on_task_created AFTER INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_task_creation();`
];

for (let i = 0; i < queries.length; i++) {
  try {
    execSync(`npx @insforge/cli db query --unrestricted "${queries[i].replace(/"/g, '\\"')}"`, {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    console.log(`✅ Success ${i+1}`);
  } catch (err) {
    console.error(`❌ Failed ${i+1}`);
  }
}
