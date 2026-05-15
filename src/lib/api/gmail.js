// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Gmail API Service
// Direct REST API calls using access token from GIS
// ═══════════════════════════════════════════════════════════════

import { googleFetch } from '../google-auth';

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export const gmailApi = {
  /**
   * List emails with optional filters.
   * Returns simplified message objects with metadata.
   * @param {Object} [params]
   * @param {number} [params.maxResults]
   * @param {string} [params.q] - Gmail search query
   * @param {string} [params.pageToken] - Pagination token
   * @param {string} [params.labelIds] - Filter by label
   */
  async listEmails(params = {}) {
    const qs = new URLSearchParams({
      maxResults: String(params.maxResults || 20),
    });
    if (params.q) qs.set('q', params.q);
    if (params.pageToken) qs.set('pageToken', params.pageToken);
    if (params.labelIds) qs.set('labelIds', params.labelIds);

    const listData = await googleFetch(`${BASE}/messages?${qs}`);

    // Fetch metadata for each message
    const messages = [];
    if (listData.messages) {
      for (const msg of listData.messages) {
        try {
          const fullMsg = await googleFetch(
            `${BASE}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
          );

          const headers = fullMsg.payload?.headers || [];
          const from = headers.find(h => h.name === 'From')?.value || '';
          const subject = headers.find(h => h.name === 'Subject')?.value || '(Sin asunto)';
          const date = headers.find(h => h.name === 'Date')?.value || '';

          messages.push({
            id: msg.id,
            threadId: msg.threadId,
            snippet: fullMsg.snippet,
            from,
            subject,
            date,
            isUnread: fullMsg.labelIds?.includes('UNREAD'),
            isStarred: fullMsg.labelIds?.includes('STARRED'),
          });
        } catch (e) {
          console.error('[Gmail] Error fetching message details:', e);
        }
      }
    }

    return { messages, nextPageToken: listData.nextPageToken || null };
  },

  /**
   * Get a single email by ID (full format).
   */
  async getEmail(messageId) {
    const data = await googleFetch(`${BASE}/messages/${messageId}?format=full`);
    return data;
  },

  /**
   * Get starred emails.
   */
  async getStarred(maxResults = 10) {
    return this.listEmails({ q: 'is:starred', maxResults });
  },

  /**
   * Get important emails.
   */
  async getImportant(maxResults = 10) {
    return this.listEmails({ q: 'is:important', maxResults });
  },

  /**
   * Search emails.
   */
  async search(query, maxResults = 20) {
    return this.listEmails({ q: query, maxResults });
  },

  /**
   * Get recent emails for dashboard.
   */
  async getRecent(maxResults = 5) {
    return this.listEmails({ maxResults });
  },
};

export default gmailApi;
