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

    // Fetch metadata for ALL messages in parallel (not one-by-one)
    const messages = [];
    if (listData.messages) {
      const results = await Promise.allSettled(
        listData.messages.map(msg =>
          googleFetch(
            `${BASE}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
          )
        )
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status !== 'fulfilled') continue;

        const fullMsg = result.value;
        const headers = fullMsg.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '(Sin asunto)';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        messages.push({
          id: listData.messages[i].id,
          threadId: listData.messages[i].threadId,
          snippet: fullMsg.snippet,
          from,
          subject,
          date,
          isUnread: fullMsg.labelIds?.includes('UNREAD'),
          isStarred: fullMsg.labelIds?.includes('STARRED'),
        });
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
