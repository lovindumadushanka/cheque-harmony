import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  displayName: string;
  currency: string;
  dateFormat: string;
  notificationsEnabled: boolean;
}

const DEFAULT_PROFILE: Profile = {
  displayName: '',
  currency: 'LKR',
  dateFormat: 'PPP',
  notificationsEnabled: true,
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          displayName: data.display_name || '',
          currency: data.currency,
          dateFormat: data.date_format,
          notificationsEnabled: data.notifications_enabled,
        });
      } else {
        // Create default profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: session.user.id,
            display_name: session.user.email?.split('@')[0] || '',
          });
        if (insertError) throw insertError;
        setProfile({ ...DEFAULT_PROFILE, displayName: session.user.email?.split('@')[0] || '' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const dbUpdates: Record<string, any> = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      if (updates.dateFormat !== undefined) dbUpdates.date_format = updates.dateFormat;
      if (updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  return { profile, isLoading, updateProfile, refetch: fetchProfile };
}
