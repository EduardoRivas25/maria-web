// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Analytics API Service
// Productivity metrics, streaks, heatmaps from activity_log
// ═══════════════════════════════════════════════════════════════

import { insforge } from '../insforge';

export const analyticsApi = {
  /**
   * Get weekly productivity (tasks completed per day, last 7 days).
   */
  async getWeeklyProductivity() {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const { data, error } = await insforge.database
      .from('activity_log')
      .select('created_at')
      .eq('action', 'task_completed')
      .gte('created_at', weekAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (error) throw error;

    // Build 7-day array
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = (data || []).filter(a =>
        a.created_at.startsWith(dateStr)
      ).length;
      result.push({ day: dayNames[d.getDay()], tareas: count });
    }

    return result;
  },

  /**
   * Get monthly activity (tasks created vs completed per week).
   */
  async getMonthlyActivity() {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 28);

    const { data, error } = await insforge.database
      .from('activity_log')
      .select('action, created_at')
      .in('action', ['task_created', 'task_completed'])
      .gte('created_at', monthAgo.toISOString());

    if (error) throw error;

    const weeks = [
      { week: 'Sem 1', completadas: 0, creadas: 0 },
      { week: 'Sem 2', completadas: 0, creadas: 0 },
      { week: 'Sem 3', completadas: 0, creadas: 0 },
      { week: 'Sem 4', completadas: 0, creadas: 0 },
    ];

    (data || []).forEach(a => {
      const daysDiff = Math.floor((now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const weekIdx = Math.min(3, Math.floor(daysDiff / 7));
      const reversedIdx = 3 - weekIdx; // Most recent week = Sem 4
      if (a.action === 'task_completed') weeks[reversedIdx].completadas++;
      else weeks[reversedIdx].creadas++;
    });

    return weeks;
  },

  /**
   * Get task distribution by category (for pie chart).
   */
  async getTaskDistribution() {
    const COLORS = ['#f99e02', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#ec4899'];

    const { data, error } = await insforge.database
      .from('tasks')
      .select('tags, categories(name)')
      .is('parent_task_id', null);

    if (error) throw error;

    const distribution = {};
    (data || []).forEach(t => {
      const catName = t.categories?.name || 'Sin categoría';
      distribution[catName] = (distribution[catName] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }));
  },

  /**
   * Get heatmap data (activity count per day, last N days).
   * @param {number} [days=140] - Number of days to fetch
   */
  async getHeatmapData(days = 140) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await insforge.database
      .from('activity_log')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Count per day
    const countMap = {};
    (data || []).forEach(a => {
      const dateStr = a.created_at.split('T')[0];
      countMap[dateStr] = (countMap[dateStr] || 0) + 1;
    });

    // Build array
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, count: countMap[dateStr] || 0 });
    }

    return result;
  },

  /**
   * Get productivity metrics (summary numbers).
   */
  async getMetrics() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Tasks completed this month
    const { data: completedData, error: err1 } = await insforge.database
      .from('tasks')
      .select('id')
      .eq('status', 'done')
      .gte('completed_at', monthAgo.toISOString());

    if (err1) throw err1;

    // Today's activity count
    const { data: todayData, error: err2 } = await insforge.database
      .from('activity_log')
      .select('id')
      .gte('created_at', todayStr + 'T00:00:00');

    if (err2) throw err2;

    // Streak calculation: consecutive days with activity
    const { data: streakData, error: err3 } = await insforge.database
      .from('activity_log')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(365);

    if (err3) throw err3;

    let streak = 0;
    const activeDays = new Set((streakData || []).map(a => a.created_at.split('T')[0]));
    const checkDate = new Date(now);
    while (activeDays.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      hoursToday: Math.round((todayData || []).length * 0.5 * 10) / 10, // Estimate
      tasksCompleted: (completedData || []).length,
      dailyAverage: Math.round(((completedData || []).length / 30) * 10) / 10,
      streak,
    };
  },
};

export default analyticsApi;
