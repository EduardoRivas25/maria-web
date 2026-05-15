CREATE TABLE IF NOT EXISTS public.profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT NOT NULL, full_name TEXT, avatar_url TEXT, auth_provider TEXT DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'github')), role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')), preferences JSONB DEFAULT '{}', settings JSONB DEFAULT '{"theme":"dark","language":"es","notifications":{"tasks":true,"events":true,"emails":true},"timezone":"America/Mexico_City"}', last_sign_in TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles (id, email, full_name, avatar_url, auth_provider) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', ''), COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email')); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT DEFAULT '#f99e02', type TEXT NOT NULL CHECK (type IN ('task', 'finance')), icon TEXT, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE OR REPLACE FUNCTION public.seed_default_categories() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.categories (user_id, name, color, type) VALUES (NEW.id, 'Frontend', '#f99e02', 'task'), (NEW.id, 'Backend', '#3b82f6', 'task'), (NEW.id, 'Diseño', '#8b5cf6', 'task'), (NEW.id, 'Documentación', '#10b981', 'task'), (NEW.id, 'Testing', '#ef4444', 'task'), (NEW.id, 'Académico', '#ec4899', 'task'), (NEW.id, 'Comida', '#f99e02', 'finance'), (NEW.id, 'Transporte', '#3b82f6', 'finance'), (NEW.id, 'Entretenimiento', '#8b5cf6', 'finance'), (NEW.id, 'Escuela', '#ef4444', 'finance'), (NEW.id, 'Tecnología', '#10b981', 'finance'), (NEW.id, 'Freelance', '#f99e02', 'finance'), (NEW.id, 'Beca', '#3b82f6', 'finance'), (NEW.id, 'Sueldo', '#10b981', 'finance'); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS on_profile_created_seed_categories ON public.profiles;
CREATE TRIGGER on_profile_created_seed_categories AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();

CREATE TABLE IF NOT EXISTS public.tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')), priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')), category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, due_date DATE, tags TEXT[] DEFAULT '{}', sort_order INTEGER DEFAULT 0, parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE OR REPLACE FUNCTION public.handle_task_status_change() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN NEW.completed_at = NOW(); ELSIF NEW.status != 'done' THEN NEW.completed_at = NULL; END IF; NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER set_task_status_timestamps BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_task_status_change();

CREATE TABLE IF NOT EXISTS public.transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('income', 'expense')), amount NUMERIC(12,2) NOT NULL CHECK (amount > 0), category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, category_name TEXT NOT NULL, description TEXT NOT NULL, date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.financial_goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, name TEXT NOT NULL, target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0), current_amount NUMERIC(12,2) DEFAULT 0 CHECK (current_amount >= 0), color TEXT DEFAULT '#f99e02', deadline DATE, status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('task', 'event', 'finance', 'reminder', 'system')), title TEXT NOT NULL, message TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, action_url TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.activity_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, action TEXT NOT NULL, entity_type TEXT, entity_id UUID, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());

CREATE OR REPLACE FUNCTION public.log_task_completion() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata) VALUES (NEW.user_id, 'task_completed', 'task', NEW.id, jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'tags', to_jsonb(NEW.tags))); END IF; RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS on_task_completed ON public.tasks;
CREATE TRIGGER on_task_completed AFTER UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_task_completion();

CREATE OR REPLACE FUNCTION public.log_task_creation() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata) VALUES (NEW.user_id, 'task_created', 'task', NEW.id, jsonb_build_object('title', NEW.title)); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS on_task_created ON public.tasks;
CREATE TRIGGER on_task_created AFTER INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_task_creation();

CREATE TABLE IF NOT EXISTS public.oauth_tokens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, provider TEXT NOT NULL CHECK (provider IN ('google', 'github')), access_token TEXT NOT NULL, refresh_token TEXT, token_expires_at TIMESTAMPTZ, scopes TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, provider));

CREATE TRIGGER set_oauth_tokens_updated_at BEFORE UPDATE ON public.oauth_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
