// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Notifications Check Edge Function
// Cron-triggered function that scans for:
//  1. Tasks due today (reminder)
//  2. Tasks overdue (alert)
//  3. Financial goals nearing deadline
// Creates notification rows so users see them in real-time.
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
    // Use service role for cron context (no user auth)
    const insforge = createClient({
      baseUrl:
        Deno.env.get("INSFORGE_INTERNAL_URL") ??
        Deno.env.get("INSFORGE_BASE_URL") ??
        "",
      anonKey: Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("ANON_KEY") ?? "",
    });

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

    let notificationsCreated = 0;

    // ── 1. Tasks due today ──────────────────────────────────

    const { data: tasksDueToday } = await insforge.database
      .from("tasks")
      .select("id, user_id, title")
      .eq("due_date", todayStr)
      .neq("status", "done");

    if (tasksDueToday?.length) {
      // Check existing notifications to avoid duplicates
      const dueTodayNotifs = tasksDueToday.map((task: any) => ({
        user_id: task.user_id,
        type: "task",
        title: "Tarea vence hoy",
        message: `"${task.title}" vence hoy. ¡No olvides completarla!`,
        metadata: { task_id: task.id, trigger: "due_today" },
        action_url: "/dashboard/tareas",
      }));

      // Deduplicate: only insert if no matching notification exists today
      for (const notif of dueTodayNotifs) {
        const { data: existing } = await insforge.database
          .from("notifications")
          .select("id")
          .eq("user_id", notif.user_id)
          .eq("type", "task")
          .gte("created_at", todayStr + "T00:00:00")
          .contains("metadata", { task_id: notif.metadata.task_id, trigger: "due_today" })
          .limit(1);

        if (!existing?.length) {
          await insforge.database.from("notifications").insert(notif);
          notificationsCreated++;
        }
      }
    }

    // ── 2. Tasks overdue ────────────────────────────────────

    const { data: overdueTasks } = await insforge.database
      .from("tasks")
      .select("id, user_id, title, due_date")
      .lt("due_date", todayStr)
      .neq("status", "done");

    if (overdueTasks?.length) {
      for (const task of overdueTasks as any[]) {
        const { data: existing } = await insforge.database
          .from("notifications")
          .select("id")
          .eq("user_id", task.user_id)
          .eq("type", "task")
          .gte("created_at", todayStr + "T00:00:00")
          .contains("metadata", { task_id: task.id, trigger: "overdue" })
          .limit(1);

        if (!existing?.length) {
          await insforge.database.from("notifications").insert({
            user_id: task.user_id,
            type: "task",
            title: "Tarea atrasada",
            message: `"${task.title}" venció el ${task.due_date}. Revisa tus tareas pendientes.`,
            metadata: { task_id: task.id, trigger: "overdue" },
            action_url: "/dashboard/tareas",
          });
          notificationsCreated++;
        }
      }
    }

    // ── 3. Tasks due tomorrow ───────────────────────────────

    const { data: tasksDueTomorrow } = await insforge.database
      .from("tasks")
      .select("id, user_id, title")
      .eq("due_date", tomorrowStr)
      .neq("status", "done");

    if (tasksDueTomorrow?.length) {
      for (const task of tasksDueTomorrow as any[]) {
        const { data: existing } = await insforge.database
          .from("notifications")
          .select("id")
          .eq("user_id", task.user_id)
          .eq("type", "reminder")
          .gte("created_at", todayStr + "T00:00:00")
          .contains("metadata", { task_id: task.id, trigger: "due_tomorrow" })
          .limit(1);

        if (!existing?.length) {
          await insforge.database.from("notifications").insert({
            user_id: task.user_id,
            type: "reminder",
            title: "Tarea vence mañana",
            message: `"${task.title}" vence mañana. Planifica tu tiempo.`,
            metadata: { task_id: task.id, trigger: "due_tomorrow" },
            action_url: "/dashboard/tareas",
          });
          notificationsCreated++;
        }
      }
    }

    // ── 4. Financial goals nearing deadline ──────────────────

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const { data: urgentGoals } = await insforge.database
      .from("financial_goals")
      .select("id, user_id, name, target_amount, current_amount, deadline")
      .eq("status", "active")
      .lte("deadline", nextWeekStr)
      .gte("deadline", todayStr);

    if (urgentGoals?.length) {
      for (const goal of urgentGoals as any[]) {
        const progress =
          (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) *
          100;
        if (progress < 90) {
          const { data: existing } = await insforge.database
            .from("notifications")
            .select("id")
            .eq("user_id", goal.user_id)
            .eq("type", "finance")
            .gte("created_at", todayStr + "T00:00:00")
            .contains("metadata", { goal_id: goal.id, trigger: "goal_deadline" })
            .limit(1);

          if (!existing?.length) {
            await insforge.database.from("notifications").insert({
              user_id: goal.user_id,
              type: "finance",
              title: "Meta financiera próxima a vencer",
              message: `"${goal.name}" vence el ${goal.deadline} y llevas ${Math.round(progress)}% de progreso.`,
              metadata: { goal_id: goal.id, trigger: "goal_deadline" },
              action_url: "/dashboard/finanzas",
            });
            notificationsCreated++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}
