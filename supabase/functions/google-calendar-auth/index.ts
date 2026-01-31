import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'auth-url') {
      // Generate OAuth URL for user to authorize
      const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth?action=callback`;
      const scope = 'https://www.googleapis.com/auth/calendar.events';
      
      // Get state from request (contains user token)
      const { state } = await req.json();
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      console.log('Generated auth URL for Google OAuth');
      
      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback') {
      // Handle OAuth callback
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // User's auth token
      
      if (!code || !state) {
        throw new Error('Missing code or state parameter');
      }

      const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth?action=callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();
      console.log('Token exchange response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokens);
        throw new Error(`Failed to exchange code: ${tokens.error_description || tokens.error}`);
      }

      // Create Supabase client with user's token
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${state}` } }
      });

      // Get user from token
      const { data: { user }, error: userError } = await supabase.auth.getUser(state);
      
      if (userError || !user) {
        console.error('Failed to get user:', userError);
        throw new Error('Failed to authenticate user');
      }

      console.log('Storing tokens for user:', user.id);

      // Store tokens in database
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      
      const { error: upsertError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Failed to store tokens:', upsertError);
        throw new Error('Failed to store tokens');
      }

      console.log('Successfully stored Google Calendar tokens');

      // Redirect back to app with success
      const appUrl = url.origin.replace('bearofkvvwawvrzcxmvp.supabase.co', 'id-preview--9c7aa91d-483d-400d-a718-50cf306dbbfd.lovable.app');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${appUrl}?google_calendar_connected=true`,
        },
      });
    }

    if (action === 'check') {
      // Check if user has connected Google Calendar
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: tokens } = await supabase
        .from('google_calendar_tokens')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .single();

      return new Response(
        JSON.stringify({ 
          connected: !!tokens,
          expiresAt: tokens?.expires_at 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect') {
      // Disconnect Google Calendar
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Unauthorized');
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Unauthorized');
      }

      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      console.log('Disconnected Google Calendar for user:', user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Google Calendar Auth Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
