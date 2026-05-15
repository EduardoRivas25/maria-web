import { createClient } from "https://esm.sh/@insforge/sdk@latest";
import { google } from "https://esm.sh/googleapis@126.0.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const insforge = createClient({
      baseUrl: Deno.env.get('INSFORGE_INTERNAL_URL') ?? Deno.env.get('INSFORGE_BASE_URL') ?? '',
      anonKey: Deno.env.get('ANON_KEY') ?? '',
      headers: { Authorization: authHeader }
    });

    const { data: user, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: tokenData, error: tokenError } = await insforge.database
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Google OAuth token not found. Please connect your Google account.');
    }

    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      Deno.env.get('GOOGLE_REDIRECT_URI')
    );

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: new Date(tokenData.token_expires_at).getTime()
    });

    oauth2Client.on('tokens', async (tokens) => {
      const updates = { updated_at: new Date().toISOString() };
      if (tokens.access_token) updates.access_token = tokens.access_token;
      if (tokens.refresh_token) updates.refresh_token = tokens.refresh_token;
      if (tokens.expiry_date) updates.token_expires_at = new Date(tokens.expiry_date).toISOString();

      await insforge.database
        .from('oauth_tokens')
        .update(updates)
        .eq('id', tokenData.id);
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const body = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'list':
        const { folderId, pageSize, pageToken, orderBy } = body;
        const query = folderId ? `'${folderId}' in parents and trashed = false` : 'trashed = false';
        
        const res = await drive.files.list({
          q: query,
          pageSize: pageSize || 20,
          pageToken,
          orderBy: orderBy || 'modifiedTime desc',
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, webContentLink)',
        });
        
        result = { 
          files: res.data.files,
          nextPageToken: res.data.nextPageToken
        };
        break;

      case 'search':
        const { q, pageSize: searchSize } = body;
        const searchRes = await drive.files.list({
          q: `name contains '${q}' and trashed = false`,
          pageSize: searchSize || 20,
          orderBy: 'modifiedTime desc',
          fields: 'files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, webContentLink)',
        });
        result = { files: searchRes.data.files };
        break;

      case 'delete':
        await drive.files.delete({
          fileId: body.fileId,
        });
        result = { success: true };
        break;

      case 'download-url':
        // Generate a secure, short-lived download URL if needed, 
        // or just return the webContentLink
        const file = await drive.files.get({
          fileId: body.fileId,
          fields: 'webContentLink, webViewLink'
        });
        result = { downloadUrl: file.data.webContentLink || file.data.webViewLink };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}
