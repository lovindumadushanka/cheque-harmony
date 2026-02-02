import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get tokens to revoke
    const { data: tokenData } = await supabase
      .from("google_calendar_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .single();

    // Revoke Google token
    if (tokenData?.access_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
          method: "POST",
        });
        console.log("Google token revoked");
      } catch (e) {
        console.log("Token revocation failed (might already be expired):", e);
      }
    }

    // Delete tokens from database
    const { error: deleteError } = await supabase
      .from("google_calendar_tokens")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to delete tokens:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to disconnect" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear google_event_id from all user's cheques
    await supabase
      .from("cheques")
      .update({ google_event_id: null, synced_to_calendar: false })
      .eq("user_id", user.id);

    console.log("Google Calendar disconnected for user:", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Google Calendar disconnected" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Disconnect error:", error);
    return new Response(JSON.stringify({ error: "Disconnect failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
