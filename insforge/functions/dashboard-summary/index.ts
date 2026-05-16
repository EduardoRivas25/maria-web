// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Dashboard Summary Edge Function
// Aggregates data from tasks, finances, upcoming events, recent
// emails, and notifications into a single response for the
// DashboardHome page. Reduces N+1 queries on the frontend.
// ═══════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@insforge/sdk@latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async function (req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const insforge = createClient({
      baseUrl:
        Deno.env.get("INSFORGE_INTERNAL_URL") ??
        Deno.env.get("INSFORGE_BASE_URL") ??
        "",
      anonKey: Deno.env.get("ANON_KEY") ?? "",
      headers: { Authorization: authHeader },
    });

    // 1. Verify user
    const { data: user, error: authError } =
      await insforge.auth.getCurrentUser();
    if (authError || !user)
      throw new Error("Unauthorized");

    // ── Run all queries in parallel ──────────────────────────

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const [
      tasksResult,
      transactionsResult,
      notificationsResult,
      weeklyActivityResult,
      goalsResult,
    ] = await Promise.all([
      // Tasks — all statuses for counts
      insforge.database
        .from("tasks")
        .select("id, status, title, due_date, priority")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Transactions — current month
      insforge.database
        .from("transactions")
        .select("type, amount")
        .eq("user_id", user.id)
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),

      // Notifications — unread first, limit 10
      insforge.database
        .from("notifications")
        .select("id, type, title, message, read, created_at")
        .eq("user_id", user.id)
        .order("read", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(10),

      // Activity log — weekly productivity (tasks completed)
      insforge.database
        .from("activity_log")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("action", "task_completed")
        .gte("created_at", weekAgo.toISOString())
        .lte("created_at", now.toISOString()),

      // Financial goals
      insforge.database
        .from("financial_goals")
        .select("id, name, target_amount, current_amount, color")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(5),
    ]);

    // ── Process task counts ──────────────────────────────────

    const tasks = tasksResult.data || [];
    const taskCounts = {
      todo: 0,
      inProgress: 0,
      done: 0,
      total: tasks.length,
    };
    const upcomingTasks: any[] = [];
    const todayStr = now.toISOString().split("T")[0];

    tasks.forEach((t: any) => {
      if (t.status === "todo") taskCounts.todo++;
      else if (t.status === "in-progress") taskCounts.inProgress++;
      else if (t.status === "done") taskCounts.done++;

      // Collect tasks due today or overdue
      if (
        t.due_date &&
        t.due_date <= todayStr &&
        t.status !== "done" &&
        upcomingTasks.length < 5
      ) {
        upcomingTasks.push(t);
      }
    });

    // ── Process financial summary ────────────────────────────

    const transactions = transactionsResult.data || [];
    const financeSummary = { income: 0, expense: 0, balance: 0 };
    transactions.forEach((t: any) => {
      const amount = parseFloat(t.amount);
      if (t.type === "income") financeSummary.income += amount;
      else financeSummary.expense += amount;
    });
    financeSummary.balance = financeSummary.income - financeSummary.expense;

    // ── Process weekly productivity ──────────────────────────

    const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    const weeklyProductivity: { day: string; tareas: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const count = (weeklyActivityResult.data || []).filter((a: any) =>
        a.created_at.startsWith(dateStr)
      ).length;
      weeklyProductivity.push({ day: dayNames[d.getDay()], tareas: count });
    }

    // ── Build response ───────────────────────────────────────

    const summary = {
      tasks: taskCounts,
      upcomingTasks,
      finance: financeSummary,
      goals: goalsResult.data || [],
      notifications: notificationsResult.data || [],
      unreadNotifications: (notificationsResult.data || []).filter(
        (n: any) => !n.read
      ).length,
      weeklyProductivity,
      timestamp: now.toISOString(),
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}
