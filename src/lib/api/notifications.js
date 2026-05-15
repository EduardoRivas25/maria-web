// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Notifications API Service
// CRUD for notifications with mark-read and filtering
// ═══════════════════════════════════════════════════════════════

import { insforge } from '../insforge';

export const notificationsApi = {
  /**
   * Get all notifications for the current user.
   * @param {Object} [filters]
   * @param {boolean} [filters.unreadOnly]
   * @param {number} [filters.limit]
   */
  async getAll(filters = {}) {
    let query = insforge.database
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.unreadOnly) {
      query = query.eq('read', false);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get unread count.
   */
  async getUnreadCount() {
    const { data, error } = await insforge.database
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false);

    if (error) throw error;
    return data;
  },

  /**
   * Mark a notification as read.
   */
  async markRead(id) {
    const { error } = await insforge.database
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllRead() {
    const { error } = await insforge.database
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Delete a notification.
   */
  async delete(id) {
    const { error } = await insforge.database
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Delete all read notifications.
   */
  async deleteAllRead() {
    const { error } = await insforge.database
      .from('notifications')
      .delete()
      .eq('read', true);

    if (error) throw error;
  },
};

export default notificationsApi;
