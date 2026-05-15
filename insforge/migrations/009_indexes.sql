-- ═══════════════════════════════════════════════════════════════
-- M.A.R.I.A. — Migration 009: Performance Indexes
-- Optimized indexes for all common query patterns
-- ═══════════════════════════════════════════════════════════════

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_status    ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due       ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority  ON public.tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_user_sort      ON public.tasks(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_parent         ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at   ON public.tasks(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_cat  ON public.transactions(user_id, category_name);

-- Financial Goals
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.financial_goals(user_id, status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON public.notifications(user_id, created_at DESC);

-- Activity Log
CREATE INDEX IF NOT EXISTS idx_activity_user_date   ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_action ON public.activity_log(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity      ON public.activity_log(entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);

-- OAuth Tokens
CREATE INDEX IF NOT EXISTS idx_oauth_user_provider ON public.oauth_tokens(user_id, provider);
