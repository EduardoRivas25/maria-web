// Run all M.A.R.I.A. migrations via Insforge CLI
const { execSync } = require('child_process');

const queries = [
  // 1. Categories table
  `CREATE TABLE IF NOT EXISTS public.categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT DEFAULT '#f99e02', type TEXT NOT NULL CHECK (type IN ('task', 'finance')), icon TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`,

  // 2. Tasks table
  `CREATE TABLE IF NOT EXISTS public.tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')), priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')), category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, due_date DATE, tags TEXT[] DEFAULT '{}', sort_order INTEGER DEFAULT 0, parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,

  // 3. Transactions table
  `CREATE TABLE IF NOT EXISTS public.transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('income', 'expense')), amount NUMERIC(12,2) NOT NULL CHECK (amount > 0), category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, category_name TEXT NOT NULL, description TEXT NOT NULL, date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW());`,

  // 4. Financial goals table
  `CREATE TABLE IF NOT EXISTS public.financial_goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, name TEXT NOT NULL, target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0), current_amount NUMERIC(12,2) DEFAULT 0 CHECK (current_amount >= 0), color TEXT DEFAULT '#f99e02', deadline DATE, status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`,

  // 5. Notifications table
  `CREATE TABLE IF NOT EXISTS public.notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, type TEXT NOT NULL CHECK (type IN ('task', 'event', 'finance', 'reminder', 'system')), title TEXT NOT NULL, message TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, action_url TEXT, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());`,

  // 6. Activity log table
  `CREATE TABLE IF NOT EXISTS public.activity_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, action TEXT NOT NULL, entity_type TEXT, entity_id UUID, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());`,

  // 7. OAuth tokens table
  `CREATE TABLE IF NOT EXISTS public.oauth_tokens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, provider TEXT NOT NULL CHECK (provider IN ('google', 'github')), access_token TEXT NOT NULL, refresh_token TEXT, token_expires_at TIMESTAMPTZ, scopes TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, provider));`,

  // 8. RLS — profiles
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);`,
  `CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`,

  // 9. RLS — categories
  `ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY categories_select_own ON public.categories FOR SELECT USING (auth.uid() = user_id);`,
  `CREATE POLICY categories_insert_own ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY categories_update_own ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY categories_delete_own ON public.categories FOR DELETE USING (auth.uid() = user_id);`,

  // 10. RLS — tasks
  `ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY tasks_select_own ON public.tasks FOR SELECT USING (auth.uid() = user_id);`,
  `CREATE POLICY tasks_insert_own ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY tasks_update_own ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY tasks_delete_own ON public.tasks FOR DELETE USING (auth.uid() = user_id);`,

  // 11. RLS — transactions
  `ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY transactions_select_own ON public.transactions FOR SELECT USING (auth.uid() = user_id);`,
  `CREATE POLICY transactions_insert_own ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY transactions_update_own ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY transactions_delete_own ON public.transactions FOR DELETE USING (auth.uid() = user_id);`,

  // 12. RLS — financial_goals
  `ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY goals_select_own ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);`,
  `CREATE POLICY goals_insert_own ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY goals_update_own ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY goals_delete_own ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);`,

  // 13. RLS — notifications
  `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY notifications_select_own ON public.notifications FOR SELECT USING (auth.uid() = user_id);`,
  `CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
  `CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE USING (auth.uid() = user_id);`,

  // 14. RLS — activity_log
  `ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;`,
  `CREATE POLICY activity_select_own ON public.activity_log FOR SELECT USING (auth.uid() = user_id);`,

  // 15. RLS — oauth_tokens (no public access)
  `ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;`,

  // 16. Indexes
  `CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON public.tasks(user_id, due_date);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks(user_id, priority);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_user_sort ON public.tasks(user_id, sort_order);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_cat ON public.transactions(user_id, category_name);`,
  `CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.financial_goals(user_id, status);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON public.notifications(user_id, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_activity_user_date ON public.activity_log(user_id, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_activity_user_action ON public.activity_log(user_id, action, created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);`,
  `CREATE INDEX IF NOT EXISTS idx_oauth_user_provider ON public.oauth_tokens(user_id, provider);`,
];

let success = 0;
let failed = 0;

for (let i = 0; i < queries.length; i++) {
  const q = queries[i];
  const label = q.substring(0, 60).replace(/\n/g, ' ');
  try {
    execSync(`npx @insforge/cli db query --unrestricted "${q.replace(/"/g, '\\"')}"`, {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 15000,
    });
    console.log(`✅ [${i + 1}/${queries.length}] ${label}...`);
    success++;
  } catch (err) {
    const stderr = err.stderr?.toString() || err.message;
    // Skip "already exists" errors
    if (stderr.includes('already exists')) {
      console.log(`⏭️  [${i + 1}/${queries.length}] Already exists — ${label}...`);
      success++;
    } else {
      console.log(`❌ [${i + 1}/${queries.length}] FAILED — ${label}...`);
      console.log(`   Error: ${stderr.substring(0, 120)}`);
      failed++;
    }
  }
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`Migration complete: ${success} succeeded, ${failed} failed out of ${queries.length} total`);
