// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Google Calendar API Service
// Direct REST API calls using access token from GIS
// ═══════════════════════════════════════════════════════════════

import { googleFetch } from '../google-auth';

const BASE = 'https://www.googleapis.com/calendar/v3';

export const calendarApi = {
  /**
   * List upcoming events.
   * @param {Object} [params]
   * @param {string} [params.timeMin] - ISO string
   * @param {string} [params.timeMax] - ISO string
   * @param {number} [params.maxResults]
   */
  async listEvents(params = {}) {
    const qs = new URLSearchParams({
      calendarId: 'primary',
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: params.timeMin || new Date().toISOString(),
      maxResults: String(params.maxResults || 50),
    });
    if (params.timeMax) qs.set('timeMax', params.timeMax);

    const data = await googleFetch(`${BASE}/calendars/primary/events?${qs}`);
    return data.items || [];
  },

  /**
   * Create a new calendar event.
   */
  async createEvent(event) {
    const data = await googleFetch(`${BASE}/calendars/primary/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return data;
  },

  /**
   * Update an existing event.
   */
  async updateEvent(eventId, event) {
    const data = await googleFetch(`${BASE}/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    return data;
  },

  /**
   * Delete an event.
   */
  async deleteEvent(eventId) {
    await googleFetch(`${BASE}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get events for a specific day.
   */
  async getEventsForDay(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.listEvents({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
    });
  },

  /**
   * Get upcoming events for the next N days (for dashboard).
   */
  async getUpcoming(days = 7) {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);

    return this.listEvents({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      maxResults: 10,
    });
  },
};

export default calendarApi;
