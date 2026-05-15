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

    // 1. Get user from token
    const { data: user, error: authError } = await insforge.auth.getCurrentUser();
    if (authError || !user) throw new Error('Unauthorized');

    // 2. Get Google OAuth token from DB
    const { data: tokenData, error: tokenError } = await insforge.database
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Google OAuth token not found. Please connect your Google account.');
    }

    // 3. Initialize Google Auth Client
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

    // Listen for token refreshes and update DB
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

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // 4. Handle request
    const body = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'list':
        const { timeMin, timeMax, maxResults } = body;
        const res = await calendar.events.list({
          calendarId: 'primary',
          timeMin: timeMin || new Date().toISOString(),
          timeMax: timeMax,
          maxResults: maxResults || 50,
          singleEvents: true,
          orderBy: 'startTime',
        });
        result = { events: res.data.items };
        break;

      case 'create':
        const createRes = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: body.event,
        });
        result = { event: createRes.data };
        break;

      case 'update':
        const updateRes = await calendar.events.update({
          calendarId: 'primary',
          eventId: body.eventId,
          requestBody: body.event,
        });
        result = { event: updateRes.data };
        break;

      case 'delete':
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: body.eventId,
        });
        result = { success: true };
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
