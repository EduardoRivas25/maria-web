// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Finances API Service
// Transactions CRUD, financial goals, aggregations
// ═══════════════════════════════════════════════════════════════

import { insforge } from '../insforge';

async function getUserId() {
  const { data: { user }, error } = await insforge.auth.getCurrentUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

export const financesApi = {
  // ── Transactions ─────────────────────────────────────────

  /**
   * Get all transactions, optionally filtered.
   * @param {Object} [filters]
   * @param {'income'|'expense'} [filters.type]
   * @param {string} [filters.category]
   * @param {string} [filters.startDate]
   * @param {string} [filters.endDate]
   * @param {number} [filters.limit]
   */
  async getTransactions(filters = {}) {
    let query = insforge.database
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.category) query = query.eq('category_name', filters.category);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new transaction.
   */
  async addTransaction(transaction) {
    const userId = await getUserId();

    // Fallback: ensure profile exists before creating transaction
    const { data: authData } = await insforge.auth.getCurrentUser();
    if (authData?.user) {
      const u = authData.user;
      await insforge.database.from('profiles').insert({
        id: u.id,
        email: u.email || 'usuario@maria.app',
        full_name: u.email?.split('@')[0] || 'Usuario'
      }).then(() => {}).catch(() => {}); // ignore error if it already exists
    }

    const { data, error } = await insforge.database
      .from('transactions')
      .insert({
        user_id: userId,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        category_name: transaction.category,
        category_id: transaction.categoryId || null,
        description: transaction.description,
        date: transaction.date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a transaction.
   */
  async deleteTransaction(id) {
    const { error } = await insforge.database
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get financial summary: total income, total expenses, balance.
   * @param {string} [startDate] - Filter from this date
   * @param {string} [endDate] - Filter to this date
   */
  async getSummary(startDate, endDate) {
    let query = insforge.database
      .from('transactions')
      .select('type, amount');

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const summary = { income: 0, expense: 0, balance: 0 };
    (data || []).forEach(t => {
      if (t.type === 'income') summary.income += parseFloat(t.amount);
      else summary.expense += parseFloat(t.amount);
    });
    summary.balance = summary.income - summary.expense;

    return summary;
  },

  /**
   * Get expenses grouped by category.
   */
  async getExpensesByCategory(startDate, endDate) {
    let query = insforge.database
      .from('transactions')
      .select('category_name, amount')
      .eq('type', 'expense');

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const COLORS = ['#f99e02', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#ec4899', '#14b8a6', '#eab308'];
    const grouped = {};
    (data || []).forEach(t => {
      const cat = t.category_name;
      grouped[cat] = (grouped[cat] || 0) + parseFloat(t.amount);
    });

    return Object.entries(grouped).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }));
  },

  /**
   * Get monthly financial data for charts.
   */
  async getMonthlyData(year) {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const { data, error } = await insforge.database
      .from('transactions')
      .select('type, amount, date')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const months = monthNames.map((month, i) => ({
      month,
      monthNum: i,
      ingresos: 0,
      gastos: 0,
    }));

    (data || []).forEach(t => {
      const monthIdx = new Date(t.date + 'T12:00:00').getMonth();
      if (t.type === 'income') months[monthIdx].ingresos += parseFloat(t.amount);
      else months[monthIdx].gastos += parseFloat(t.amount);
    });

    return months;
  },

  // ── Financial Goals ──────────────────────────────────────

  async getGoals() {
    const { data, error } = await insforge.database
      .from('financial_goals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createGoal(goal) {
    const userId = await getUserId();

    const { data, error } = await insforge.database
      .from('financial_goals')
      .insert({
        user_id: userId,
        name: goal.name,
        target_amount: parseFloat(goal.targetAmount),
        current_amount: parseFloat(goal.currentAmount || 0),
        color: goal.color || '#f99e02',
        deadline: goal.deadline || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.targetAmount !== undefined) payload.target_amount = parseFloat(updates.targetAmount);
    if (updates.currentAmount !== undefined) payload.current_amount = parseFloat(updates.currentAmount);
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await insforge.database
      .from('financial_goals')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGoal(id) {
    const { error } = await insforge.database
      .from('financial_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ── Categories ───────────────────────────────────────────

  async getCategories() {
    const { data, error } = await insforge.database
      .from('categories')
      .select('*')
      .eq('type', 'finance')
      .order('name');

    if (error) throw error;
    return data || [];
  },
};

export default financesApi;
