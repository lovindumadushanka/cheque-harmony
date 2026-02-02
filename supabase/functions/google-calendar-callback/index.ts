import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return new Response(`<html><body><script>window.close();</script>OAuth error: ${error}</body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code || !stateParam) {
      console.error("Missing code or state");
      return new Response(`<html><body><script>window.close();</script>Missing authorization code</body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Decode state
    let state: { userId: string; redirectUrl: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch {
      console.error("Invalid state parameter");
      return new Response(`<html><body><script>window.close();</script>Invalid state</body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const callbackUrl = `${supabaseUrl}/functions/v1/google-calendar-callback`;

    if (!clientId || !clientSecret) {
      console.error("Google OAuth credentials not configured");
      return new Response(`<html><body><script>window.close();</script>OAuth not configured</body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Exchange code for tokens
    console.log("Exchanging code for tokens...");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return new Response(`<html><body><script>window.close();</script>Failed to get tokens</body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received for user:", state.userId);

    // Store tokens in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert tokens
    const { error: upsertError } = await supabase
      .from("google_calendar_tokens")
      .upsert({
        user_id: state.userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Failed to store tokens:", upsertError);
      return new Response(`<html><body><script>window.close();</script>Failed to save connection</body></html>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    console.log("Tokens stored successfully for user:", state.userId);

    // Redirect back to the app with success message
    const redirectUrl = state.redirectUrl || "/";
    const successUrl = `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}calendar_connected=true`;

    return new Response(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_CALENDAR_CONNECTED' }, '*');
              window.close();
            } else {
              window.location.href = '${successUrl}';
            }
          </script>
          <p>Google Calendar connected! You can close this window.</p>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(`<html><body><script>window.close();</script>An error occurred</body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }
});
