import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
  syncAllCheques: () => Promise<void>;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsConnected(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=check`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      setIsConnected(result.connected || false);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to connect Google Calendar.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=auth-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: session.access_token }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Open Google OAuth in new window
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setIsConnected(false);
      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: 'Disconnect Failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect Google Calendar',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const syncAllCheques = useCallback(async () => {
    try {
      setIsSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to sync cheques.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'sync-all' }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Sync Complete',
        description: `Successfully synced ${result.synced || 0} cheques to Google Calendar.`,
      });
    } catch (error) {
      console.error('Error syncing cheques:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync cheques to Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  // Check connection on mount and when URL has success param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_calendar_connected') === 'true') {
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      toast({
        title: 'Connected!',
        description: 'Google Calendar is now connected. Cheques will sync automatically.',
      });
    }
    checkConnection();
  }, [checkConnection, toast]);

  return {
    isConnected,
    isLoading,
    isConnecting,
    isSyncing,
    connect,
    disconnect,
    checkConnection,
    syncAllCheques,
  };
}
