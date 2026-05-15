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

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const body = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'list':
        const { maxResults, q, pageToken, labelIds } = body;
        const res = await gmail.users.messages.list({
          userId: 'me',
          maxResults: maxResults || 20,
          q: q || '',
          pageToken,
          labelIds: labelIds ? [labelIds] : undefined,
        });

        // Fetch snippets for each message
        const messages = [];
        if (res.data.messages) {
          for (const msg of res.data.messages) {
            try {
              const fullMsg = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Date'],
              });
              
              const headers = fullMsg.data.payload?.headers || [];
              const from = headers.find(h => h.name === 'From')?.value || '';
              const subject = headers.find(h => h.name === 'Subject')?.value || '(Sin asunto)';
              const date = headers.find(h => h.name === 'Date')?.value || '';

              messages.push({
                id: msg.id,
                threadId: msg.threadId,
                snippet: fullMsg.data.snippet,
                from,
                subject,
                date,
                isUnread: fullMsg.data.labelIds?.includes('UNREAD'),
                isStarred: fullMsg.data.labelIds?.includes('STARRED'),
              });
            } catch (e) {
              console.error("Error fetching message details:", e);
            }
          }
        }

        result = { 
          messages,
          nextPageToken: res.data.nextPageToken
        };
        break;

      case 'get':
        const getRes = await gmail.users.messages.get({
          userId: 'me',
          id: body.messageId,
          format: 'full',
        });
        result = { message: getRes.data };
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
