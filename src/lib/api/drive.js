// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Google Drive API Service
// Direct REST API calls using access token from GIS
// ═══════════════════════════════════════════════════════════════

import { googleFetch } from '../google-auth';

const BASE = 'https://www.googleapis.com/drive/v3';
const FIELDS = 'files(id,name,mimeType,modifiedTime,size,iconLink,webViewLink,webContentLink),nextPageToken';

export const driveApi = {
  /**
   * List files.
   * @param {Object} [params]
   * @param {string} [params.folderId] - Parent folder ID ('root' for root)
   * @param {number} [params.pageSize]
   * @param {string} [params.pageToken]
   * @param {string} [params.orderBy] - e.g. 'modifiedTime desc'
   */
  async listFiles(params = {}) {
    const folderId = params.folderId || 'root';
    const q = `'${folderId}' in parents and trashed = false`;
    const qs = new URLSearchParams({
      q,
      pageSize: String(params.pageSize || 20),
      orderBy: params.orderBy || 'modifiedTime desc',
      fields: FIELDS,
    });
    if (params.pageToken) qs.set('pageToken', params.pageToken);

    const data = await googleFetch(`${BASE}/files?${qs}`);
    return { files: data.files || [], nextPageToken: data.nextPageToken || null };
  },

  /**
   * Search files by name or content.
   */
  async search(query, pageSize = 20) {
    const q = `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`;
    const qs = new URLSearchParams({
      q,
      pageSize: String(pageSize),
      orderBy: 'modifiedTime desc',
      fields: FIELDS,
    });
    const data = await googleFetch(`${BASE}/files?${qs}`);
    return { files: data.files || [] };
  },

  /**
   * Get file download URL.
   */
  async getDownloadUrl(fileId) {
    const data = await googleFetch(`${BASE}/files/${fileId}?fields=webContentLink,webViewLink`);
    return data.webContentLink || data.webViewLink;
  },

  /**
   * Delete a file.
   */
  async deleteFile(fileId) {
    await googleFetch(`${BASE}/files/${fileId}`, { method: 'DELETE' });
  },

  /**
   * Get recent files for dashboard.
   */
  async getRecent(pageSize = 8) {
    return this.listFiles({ pageSize, orderBy: 'viewedByMeTime desc' });
  },
};

export default driveApi;
