// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Dashboard API Service
// Aggregated dashboard data via Edge Function + direct SDK
// Falls back to parallel SDK calls if edge function is unavailable
// ═══════════════════════════════════════════════════════════════

import { insforge } from '../insforge';
import { tasksApi } from './tasks';
import { financesApi } from './finances';
import { analyticsApi } from './analytics';
import { notificationsApi } from './notifications';

/**
 * @typedef {Object} DashboardSummary
 * @property {{ todo: number, inProgress: number, done: number, total: number }} tasks
 * @property {Array} upcomingTasks
 * @property {{ income: number, expense: number, balance: number }} finance
 * @property {Array} goals
 * @property {Array} notifications
 * @property {number} unreadNotifications
 * @property {Array<{ day: string, tareas: number }>} weeklyProductivity
 */

export const dashboardApi = {
  /**
   * Fetch aggregated dashboard data.
   * Tries the edge function first for optimal performance,
   * falls back to parallel direct queries.
   * @returns {Promise<DashboardSummary>}
   */
  async getSummary() {
    try {
      // Attempt edge function (single request, server-side aggregation)
      const { data, error } = await insforge.functions.invoke('dashboard-summary', {
        body: {},
      });

      if (!error && data) {
        return data;
      }

      // Edge function unavailable — fall back to direct queries
      console.warn('[Dashboard] Edge function unavailable, using fallback:', error);
    } catch (err) {
      console.warn('[Dashboard] Edge function error, using fallback:', err);
    }

    return this._fallbackSummary();
  },

  /**
   * Fallback: parallel direct SDK calls when edge function is unavailable.
   * @private
   */
  async _fallbackSummary() {
    const [
      taskStats,
      financeSummary,
      weeklyProductivity,
      notifications,
      goals,
      upcomingTasksRaw,
    ] = await Promise.allSettled([
      tasksApi.getStats(),
      financesApi.getSummary(),
      analyticsApi.getWeeklyProductivity(),
      notificationsApi.getAll({ limit: 10 }),
      financesApi.getGoals(),
      tasksApi.getAll({ preset: 'today' }),
    ]);

    const resolveOrDefault = (result, defaultVal) =>
      result.status === 'fulfilled' ? result.value : defaultVal;

    const stats = resolveOrDefault(taskStats, { todo: 0, inProgress: 0, done: 0, total: 0 });
    const finance = resolveOrDefault(financeSummary, { income: 0, expense: 0, balance: 0 });
    const weekly = resolveOrDefault(weeklyProductivity, []);
    const notifs = resolveOrDefault(notifications, []);
    const goalsData = resolveOrDefault(goals, []);
    const upcoming = resolveOrDefault(upcomingTasksRaw, []);

    return {
      tasks: stats,
      upcomingTasks: upcoming.slice(0, 5),
      finance,
      goals: goalsData,
      notifications: notifs,
      unreadNotifications: notifs.filter(n => !n.read).length,
      weeklyProductivity: weekly,
    };
  },
};

export default dashboardApi;
