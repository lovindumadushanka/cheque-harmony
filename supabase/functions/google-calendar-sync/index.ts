import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Cheque {
  id: string;
  cheque_number: string;
  payee_name: string;
  amount: number;
  due_date: string;
  reminder_date: string | null;
  google_event_id: string | null;
  synced_to_calendar: boolean | null;
  status: string;
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

async function createCalendarEvent(accessToken: string, cheque: Cheque): Promise<string | null> {
  try {
    const reminderDate = cheque.reminder_date || cheque.due_date;
    const eventDate = new Date(reminderDate);
    
    const event = {
      summary: `Cheque Due: ${cheque.cheque_number}`,
      description: `Payee: ${cheque.payee_name}\nAmount: LKR ${cheque.amount.toLocaleString()}\nDue Date: ${cheque.due_date}`,
      start: {
        date: reminderDate,
      },
      end: {
        date: reminderDate,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 1440 }, // 1 day before
          { method: "popup", minutes: 60 },   // 1 hour before
        ],
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      console.error("Failed to create event:", await response.text());
      return null;
    }

    const data = await response.json();
    console.log("Created calendar event:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

async function updateCalendarEvent(accessToken: string, eventId: string, cheque: Cheque): Promise<boolean> {
  try {
    const reminderDate = cheque.reminder_date || cheque.due_date;
    
    const event = {
      summary: `Cheque Due: ${cheque.cheque_number}`,
      description: `Payee: ${cheque.payee_name}\nAmount: LKR ${cheque.amount.toLocaleString()}\nDue Date: ${cheque.due_date}\nStatus: ${cheque.status}`,
      start: {
        date: reminderDate,
      },
      end: {
        date: reminderDate,
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      console.error("Failed to update event:", await response.text());
      return false;
    }

    console.log("Updated calendar event:", eventId);
    return true;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    return false;
  }
}

async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 204 No Content or 410 Gone are both success cases
    if (response.status === 204 || response.status === 410) {
      console.log("Deleted calendar event:", eventId);
      return true;
    }

    console.error("Failed to delete event:", await response.text());
    return false;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify user authentication
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

    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's Google Calendar tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    const expiresAt = new Date(tokenData.expires_at);
    
    if (expiresAt <= new Date()) {
      console.log("Access token expired, refreshing...");
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      
      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: "OAuth not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newAccessToken = await refreshAccessToken(tokenData.refresh_token, clientId, clientSecret);
      if (!newAccessToken) {
        // Token refresh failed, user needs to reconnect
        return new Response(JSON.stringify({ error: "Token refresh failed. Please reconnect Google Calendar." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      accessToken = newAccessToken;
      
      // Update token in database
      await supabase
        .from("google_calendar_tokens")
        .update({
          access_token: newAccessToken,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Get user's pending cheques
    const { data: cheques, error: chequesError } = await supabase
      .from("cheques")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (chequesError) {
      console.error("Failed to fetch cheques:", chequesError);
      return new Response(JSON.stringify({ error: "Failed to fetch cheques" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let synced = 0;
    let updated = 0;
    let errors = 0;

    // Sync each pending cheque
    for (const cheque of cheques || []) {
      if (cheque.google_event_id) {
        // Update existing event
        const success = await updateCalendarEvent(accessToken, cheque.google_event_id, cheque);
        if (success) {
          updated++;
        } else {
          errors++;
        }
      } else {
        // Create new event
        const eventId = await createCalendarEvent(accessToken, cheque);
        if (eventId) {
          await supabase
            .from("cheques")
            .update({ 
              google_event_id: eventId, 
              synced_to_calendar: true 
            })
            .eq("id", cheque.id);
          synced++;
        } else {
          errors++;
        }
      }
    }

    // Handle cleared/bounced cheques - remove their events
    const { data: completedCheques } = await supabase
      .from("cheques")
      .select("id, google_event_id")
      .eq("user_id", user.id)
      .in("status", ["cleared", "bounced"])
      .not("google_event_id", "is", null);

    let deleted = 0;
    for (const cheque of completedCheques || []) {
      if (cheque.google_event_id) {
        const success = await deleteCalendarEvent(accessToken, cheque.google_event_id);
        if (success) {
          await supabase
            .from("cheques")
            .update({ google_event_id: null, synced_to_calendar: false })
            .eq("id", cheque.id);
          deleted++;
        }
      }
    }

    console.log(`Sync complete: ${synced} created, ${updated} updated, ${deleted} deleted, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        updated,
        deleted,
        errors,
        message: `Synced ${synced} new, updated ${updated}, removed ${deleted} events`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: "Sync failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
