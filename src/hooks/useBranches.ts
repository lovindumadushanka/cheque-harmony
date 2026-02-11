import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Branch } from '@/types/cheque';

// Default branches to seed for new users
const DEFAULT_BRANCHES: Omit<Branch, 'id'>[] = [
  { name: 'Downtown Central', code: 'DTC' },
  { name: 'Westside Plaza', code: 'WSP' },
  { name: 'North Mall', code: 'NML' },
  { name: 'East Market', code: 'EMK' },
];

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setBranches([]);
        return;
      }

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) throw error;

      // If no branches exist, seed defaults
      if (!data || data.length === 0) {
        const seedData = DEFAULT_BRANCHES.map(b => ({
          ...b,
          user_id: session.user.id,
        }));
        const { data: seeded, error: seedError } = await supabase
          .from('branches')
          .insert(seedData)
          .select();

        if (seedError) throw seedError;
        setBranches((seeded || []).map(r => ({ id: r.id, name: r.name, code: r.code })));
      } else {
        setBranches(data.map(r => ({ id: r.id, name: r.name, code: r.code })));
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchBranches();
    });
    return () => subscription.unsubscribe();
  }, [fetchBranches]);

  const addBranch = useCallback(async (name: string, code: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase
        .from('branches')
        .insert({ name, code, user_id: session.user.id })
        .select()
        .single();

      if (error) throw error;

      setBranches(prev => [...prev, { id: data.id, name: data.name, code: data.code }].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Branch Added', description: `"${name}" has been added.` });
      return true;
    } catch (error) {
      console.error('Error adding branch:', error);
      toast({ title: 'Error', description: 'Failed to add branch.', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  const removeBranch = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;

      setBranches(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Branch Removed', description: 'Branch has been removed.' });
      return true;
    } catch (error) {
      console.error('Error removing branch:', error);
      toast({ title: 'Error', description: 'Failed to remove branch.', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  return { branches, isLoading, addBranch, removeBranch, refetch: fetchBranches };
}
