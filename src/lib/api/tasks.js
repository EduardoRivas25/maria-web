// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Tasks API Service
// Full CRUD with filters, search, sorting, and activity logging
// ═══════════════════════════════════════════════════════════════

import { insforge } from '../insforge';

/**
 * Get the current authenticated user's ID.
 * @returns {Promise<string>}
 */
async function getUserId() {
  const { data: { user }, error } = await insforge.auth.getCurrentUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

/**
 * @typedef {Object} TaskFilters
 * @property {'all'|'todo'|'in-progress'|'done'} [status]
 * @property {'all'|'low'|'medium'|'high'} [priority]
 * @property {'today'|'urgent'|'done'|'all'} [preset]
 * @property {string} [search]
 * @property {string} [categoryId]
 */

export const tasksApi = {
  /**
   * Fetch all tasks for the current user with optional filters.
   * @param {TaskFilters} [filters]
   */
  async getAll(filters = {}) {
    let query = insforge.database
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    // Preset filters
    if (filters.preset === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('due_date', today);
    } else if (filters.preset === 'urgent') {
      query = query.eq('priority', 'high');
    } else if (filters.preset === 'done') {
      query = query.eq('status', 'done');
    }

    // Search
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    // Category
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Fetch a single task by ID (including subtasks).
   * @param {string} id
   */
  async getById(id) {
    const { data, error } = await insforge.database
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new task.
   * @param {Object} task
   * @param {string} task.title
   * @param {string} [task.description]
   * @param {'low'|'medium'|'high'} [task.priority]
   * @param {string} [task.dueDate] - ISO date string
   * @param {string[]} [task.tags]
   * @param {string} [task.categoryId]
   * @param {string} [task.parentTaskId] - For subtasks
   */
  async create(task) {
    const { data: { user }, error: authErr } = await insforge.auth.getCurrentUser();
    if (authErr || !user) throw new Error('Not authenticated');

    // Ensure profile exists (tasks.user_id FK → profiles.id)
    // Check if profile exists first, if not create it
    const { data: existingProfile } = await insforge.database
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      const { error: profileErr } = await insforge.database
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || 'usuario@maria.app',
          full_name: user.email?.split('@')[0] || 'Usuario',
        });
      if (profileErr) {
        console.warn('[Tasks] Profile insert warning (may already exist):', profileErr);
      }
    }

    const row = {
      user_id: user.id,
      title: task.title,
      description: task.description || null,
      priority: task.priority || 'medium',
      due_date: task.dueDate || null,
      tags: task.tags || [],
      status: 'todo',
    };

    // Only include FK fields if they have real values
    if (task.categoryId) row.category_id = task.categoryId;
    if (task.parentTaskId) row.parent_task_id = task.parentTaskId;

    const { data, error } = await insforge.database
      .from('tasks')
      .insert(row)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing task.
   * @param {string} id
   * @param {Object} updates
   */
  async update(id, updates) {
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;

    const { data, error } = await insforge.database
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update task status (convenience method).
   * @param {string} id
   * @param {'todo'|'in-progress'|'done'} status
   */
  async updateStatus(id, status) {
    return this.update(id, { status });
  },

  /**
   * Delete a task.
   * @param {string} id
   */
  async delete(id) {
    const { error } = await insforge.database
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Reorder tasks by updating sort_order.
   * @param {Array<{id: string, sortOrder: number}>} items
   */
  async reorder(items) {
    const promises = items.map(({ id, sortOrder }) =>
      insforge.database
        .from('tasks')
        .update({ sort_order: sortOrder })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;
  },

  /**
   * Get task statistics for the current user.
   * @returns {Promise<{todo: number, inProgress: number, done: number, total: number}>}
   */
  async getStats() {
    const { data, error } = await insforge.database
      .from('tasks')
      .select('status');

    if (error) throw error;

    const stats = { todo: 0, inProgress: 0, done: 0, total: 0 };
    (data || []).forEach(t => {
      stats.total++;
      if (t.status === 'todo') stats.todo++;
      else if (t.status === 'in-progress') stats.inProgress++;
      else if (t.status === 'done') stats.done++;
    });

    return stats;
  },
};

export default tasksApi;
