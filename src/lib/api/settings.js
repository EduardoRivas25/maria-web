// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Settings API Service
// Profile management, preferences, password change
// ═══════════════════════════════════════════════════════════════

import { insforge } from '../insforge';

export const settingsApi = {
  /**
   * Get current user profile.
   */
  async getProfile() {
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { data, error } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update profile fields.
   * @param {Object} updates
   * @param {string} [updates.fullName]
   * @param {string} [updates.avatarUrl]
   */
  async updateProfile(updates) {
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) throw new Error('Not authenticated');

    const payload = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

    const { data, error } = await insforge.database
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Also update auth profile metadata
    if (updates.fullName) {
      await insforge.auth.setProfile({
        fullName: updates.fullName,
      });
    }

    return data;
  },

  /**
   * Update user preferences (JSONB merge).
   * @param {Object} preferences
   */
  async updatePreferences(preferences) {
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) throw new Error('Not authenticated');

    // Get current preferences and merge
    const { data: current } = await insforge.database
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const merged = { ...(current?.preferences || {}), ...preferences };

    const { data, error } = await insforge.database
      .from('profiles')
      .update({ preferences: merged })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user settings (JSONB merge).
   * @param {Object} settings
   */
  async updateSettings(settings) {
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { data: current } = await insforge.database
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    const merged = { ...(current?.settings || {}), ...settings };

    const { data, error } = await insforge.database
      .from('profiles')
      .update({ settings: merged })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Change password.
   * @param {string} newPassword
   */
  async changePassword(newPassword) {
    const { error } = await insforge.auth.resetPassword(newPassword);

    if (error) throw error;
  },

  /**
   * Get connected OAuth providers for the current user.
   */
  async getConnectedProviders() {
    const { data: { user }, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) throw new Error('Not authenticated');

    // Check which providers have tokens stored
    // (this runs through Edge Function for security since oauth_tokens has no public RLS)
    const { data, error } = await insforge.functions.invoke('auth-callback', {
      body: { action: 'check-providers' },
    });

    if (error) {
      // Fallback: check auth identities
      return user.identities?.map(i => i.provider) || [];
    }

    return data?.providers || [];
  },
};

export default settingsApi;
