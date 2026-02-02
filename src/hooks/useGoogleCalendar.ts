import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UseGoogleCalendar {
  isConnected: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sync: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

interface SyncResult {
  synced: number;
  updated: number;
  deleted: number;
  errors: number;
  message: string;
}

export function useGoogleCalendar(): UseGoogleCalendar {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking Google Calendar connection:', error);
        setIsConnected(false);
      } else {
        setIsConnected(!!data);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Listen for OAuth popup completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_CALENDAR_CONNECTED') {
        setIsConnected(true);
        toast({
          title: 'Google Calendar Connected',
          description: 'Your calendar is now linked. Syncing cheques...',
        });
        // Auto-sync after connection
        sync();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  // Check URL params for connection success (fallback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected') === 'true') {
      setIsConnected(true);
      toast({
        title: 'Google Calendar Connected',
        description: 'Your calendar is now linked.',
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-sync
      sync();
    }
  }, [toast]);

  const connect = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Not Logged In',
        description: 'Please log in to connect Google Calendar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('google-calendar-auth', {
        body: { redirectUrl: window.location.href },
      });

      if (response.error) {
        throw response.error;
      }

      const { authUrl } = response.data;
      
      // Open OAuth in popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await supabase.functions.invoke('google-calendar-disconnect');

      if (response.error) {
        throw response.error;
      }

      setIsConnected(false);
      setLastSyncResult(null);
      
      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected.',
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sync = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect Google Calendar first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSyncing(true);
      
      const response = await supabase.functions.invoke('google-calendar-sync');

      if (response.error) {
        throw response.error;
      }

      const result = response.data as SyncResult;
      setLastSyncResult(result);
      
      toast({
        title: 'Sync Complete',
        description: result.message,
      });
    } catch (error: any) {
      console.error('Error syncing:', error);
      
      // Check if token expired
      if (error.message?.includes('reconnect')) {
        setIsConnected(false);
        toast({
          title: 'Session Expired',
          description: 'Please reconnect your Google Calendar.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync with Google Calendar.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, toast]);

  return {
    isConnected,
    isLoading,
    isSyncing,
    lastSyncResult,
    connect,
    disconnect,
    sync,
    checkConnection,
  };
}
