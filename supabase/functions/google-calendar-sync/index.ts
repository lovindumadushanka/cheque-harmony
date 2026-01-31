import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ChequeData {
  id?: string;
  cheque_number: string;
  bank_name: string;
  account_number: string;
  payee_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  branch: string;
  notes?: string;
  reminder_date?: string;
  is_holiday_adjusted?: boolean;
  holiday_skipped?: string[];
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
  }

  return data;
}

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokens, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokens) {
    throw new Error('Google Calendar not connected');
  }

  const now = new Date();
  const expiresAt = new Date(tokens.expires_at);

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Refreshing access token for user:', userId);
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    
    await supabase
      .from('google_calendar_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq('user_id', userId);

    return newTokens.access_token;
  }

  return tokens.access_token;
}

async function createCalendarEvent(accessToken: string, cheque: ChequeData): Promise<string> {
  const eventDate = cheque.reminder_date || cheque.due_date;
  
  const event = {
    summary: `💰 Cheque Due: ${cheque.payee_name}`,
    description: `Cheque Number: ${cheque.cheque_number}\nAmount: LKR ${cheque.amount.toLocaleString()}\nPayee: ${cheque.payee_name}`,
    start: {
      date: eventDate,
    },
    end: {
      date: eventDate,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 day before
      ],
    },
  };

  console.log('Creating calendar event:', event.summary);

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Failed to create event:', data);
    throw new Error(`Failed to create event: ${data.error?.message || 'Unknown error'}`);
  }

  console.log('Created calendar event with ID:', data.id);
  return data.id;
}

async function updateCalendarEvent(accessToken: string, eventId: string, cheque: ChequeData): Promise<void> {
  const eventDate = cheque.reminder_date || cheque.due_date;
  
  const event = {
    summary: `💰 Cheque Due: ${cheque.payee_name}`,
    description: `Cheque Number: ${cheque.cheque_number}\nAmount: LKR ${cheque.amount.toLocaleString()}\nPayee: ${cheque.payee_name}`,
    start: {
      date: eventDate,
    },
    end: {
      date: eventDate,
    },
  };

  console.log('Updating calendar event:', eventId);

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const data = await response.json();
    console.error('Failed to update event:', data);
    throw new Error(`Failed to update event: ${data.error?.message || 'Unknown error'}`);
  }
}

async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  console.log('Deleting calendar event:', eventId);

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const data = await response.json();
    console.error('Failed to delete event:', data);
    throw new Error(`Failed to delete event: ${data.error?.message || 'Unknown error'}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, cheque } = await req.json() as { action: string; cheque?: ChequeData };

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id);

    if (action === 'create') {
      if (!cheque) {
        throw new Error('Cheque data required');
      }

      // Create event in Google Calendar
      const eventId = await createCalendarEvent(accessToken, cheque);

      // Store cheque in database with event ID
      const { data: savedCheque, error: insertError } = await supabase
        .from('cheques')
        .insert({
          user_id: user.id,
          cheque_number: cheque.cheque_number,
          bank_name: cheque.bank_name,
          account_number: cheque.account_number,
          payee_name: cheque.payee_name,
          amount: cheque.amount,
          issue_date: cheque.issue_date,
          due_date: cheque.due_date,
          status: cheque.status,
          branch: cheque.branch,
          notes: cheque.notes,
          reminder_date: cheque.reminder_date,
          is_holiday_adjusted: cheque.is_holiday_adjusted,
          holiday_skipped: cheque.holiday_skipped,
          google_event_id: eventId,
          synced_to_calendar: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to save cheque:', insertError);
        // Try to delete the calendar event since we couldn't save the cheque
        try {
          await deleteCalendarEvent(accessToken, eventId);
        } catch (e) {
          console.error('Failed to rollback calendar event:', e);
        }
        throw new Error('Failed to save cheque');
      }

      console.log('Created cheque with calendar sync:', savedCheque.id);

      return new Response(
        JSON.stringify({ success: true, cheque: savedCheque, eventId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      if (!cheque || !cheque.id) {
        throw new Error('Cheque ID required');
      }

      // Get existing cheque
      const { data: existingCheque, error: fetchError } = await supabase
        .from('cheques')
        .select('google_event_id')
        .eq('id', cheque.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error('Cheque not found');
      }

      // Update calendar event if exists
      if (existingCheque.google_event_id) {
        await updateCalendarEvent(accessToken, existingCheque.google_event_id, cheque);
      }

      // Update cheque in database
      const { data: updatedCheque, error: updateError } = await supabase
        .from('cheques')
        .update({
          cheque_number: cheque.cheque_number,
          bank_name: cheque.bank_name,
          account_number: cheque.account_number,
          payee_name: cheque.payee_name,
          amount: cheque.amount,
          issue_date: cheque.issue_date,
          due_date: cheque.due_date,
          status: cheque.status,
          branch: cheque.branch,
          notes: cheque.notes,
          reminder_date: cheque.reminder_date,
          is_holiday_adjusted: cheque.is_holiday_adjusted,
          holiday_skipped: cheque.holiday_skipped,
        })
        .eq('id', cheque.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to update cheque');
      }

      return new Response(
        JSON.stringify({ success: true, cheque: updatedCheque }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      if (!cheque?.id) {
        throw new Error('Cheque ID required');
      }

      // Get existing cheque
      const { data: existingCheque, error: fetchError } = await supabase
        .from('cheques')
        .select('google_event_id')
        .eq('id', cheque.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error('Cheque not found');
      }

      // Delete calendar event if exists
      if (existingCheque.google_event_id) {
        await deleteCalendarEvent(accessToken, existingCheque.google_event_id);
      }

      // Delete cheque from database
      const { error: deleteError } = await supabase
        .from('cheques')
        .delete()
        .eq('id', cheque.id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error('Failed to delete cheque');
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Google Calendar Sync Error:', error);
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
