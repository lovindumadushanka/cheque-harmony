import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cheque, ChequeStatus } from '@/types/cheque';
import { getReminderDate } from '@/lib/sriLankanHolidays';
import { format } from 'date-fns';

interface ChequeInput {
  chequeNumber: string;
  bankName: string;
  accountNumber: string;
  payeeName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: ChequeStatus;
  branch: string;
  notes?: string;
}

interface UseCheques {
  cheques: Cheque[];
  isLoading: boolean;
  addCheque: (cheque: ChequeInput) => Promise<boolean>;
  updateStatus: (id: string, status: ChequeStatus) => Promise<boolean>;
  deleteCheque: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

// Map database row to frontend Cheque type
function mapDbToCheque(row: any): Cheque {
  return {
    id: row.id,
    chequeNumber: row.cheque_number,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    payeeName: row.payee_name,
    amount: parseFloat(row.amount),
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status as ChequeStatus,
    branch: row.branch,
    notes: row.notes,
    createdAt: row.created_at,
    reminderDate: row.reminder_date,
    isHolidayAdjusted: row.is_holiday_adjusted,
    holidaySkipped: row.holiday_skipped,
  };
}

export function useCheques(): UseCheques {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCheques = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setCheques([]);
        return;
      }

      const { data, error } = await supabase
        .from('cheques')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCheques((data || []).map(mapDbToCheque));
    } catch (error) {
      console.error('Error fetching cheques:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cheques.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCheques();
    
    // Listen for auth changes to refetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCheques();
    });

    return () => subscription.unsubscribe();
  }, [fetchCheques]);

  const addCheque = useCallback(async (chequeInput: ChequeInput): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to add cheques.',
          variant: 'destructive',
        });
        return false;
      }

      // Calculate reminder date based on Sri Lankan holidays
      const { reminderDate, isAdjusted, skippedDays } = getReminderDate(new Date(chequeInput.dueDate));
      
      // Format dates for database (YYYY-MM-DD)
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return format(date, 'yyyy-MM-dd');
      };

      const chequeData = {
        user_id: session.user.id,
        cheque_number: chequeInput.chequeNumber,
        bank_name: chequeInput.bankName,
        account_number: chequeInput.accountNumber,
        payee_name: chequeInput.payeeName,
        amount: chequeInput.amount,
        issue_date: formatDate(chequeInput.issueDate),
        due_date: formatDate(chequeInput.dueDate),
        status: chequeInput.status,
        branch: chequeInput.branch,
        notes: chequeInput.notes,
        reminder_date: format(reminderDate, 'yyyy-MM-dd'),
        is_holiday_adjusted: isAdjusted,
        holiday_skipped: skippedDays,
      };

      const { data, error } = await supabase
        .from('cheques')
        .insert(chequeData)
        .select()
        .single();

      if (error) throw error;

      const newCheque = mapDbToCheque(data);
      setCheques(prev => [newCheque, ...prev]);

      if (isAdjusted) {
        toast({
          title: 'Cheque Added with Holiday Adjustment',
          description: `Due date falls on ${skippedDays.join(', ')}. Reminder set for next working day.`,
        });
      } else {
        toast({
          title: 'Cheque Added',
          description: 'Cheque has been saved successfully.',
        });
      }

      // Trigger calendar sync after adding a cheque
      try {
        await supabase.functions.invoke('google-calendar-sync');
      } catch (e) {
        // Silent fail - calendar sync is optional
        console.log('Calendar sync skipped:', e);
      }

      return true;
    } catch (error) {
      console.error('Error adding cheque:', error);
      toast({
        title: 'Error',
        description: 'Failed to add cheque.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const updateStatus = useCallback(async (id: string, status: ChequeStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cheques')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCheques(prev => 
        prev.map(c => c.id === id ? { ...c, status } : c)
      );

      toast({
        title: 'Status Updated',
        description: `Cheque has been marked as ${status}.`,
      });

      // Trigger calendar sync after status change
      try {
        await supabase.functions.invoke('google-calendar-sync');
      } catch (e) {
        console.log('Calendar sync skipped:', e);
      }

      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const deleteCheque = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cheques')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCheques(prev => prev.filter(c => c.id !== id));

      toast({
        title: 'Cheque Deleted',
        description: 'Cheque has been removed.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting cheque:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete cheque.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    cheques,
    isLoading,
    addCheque,
    updateStatus,
    deleteCheque,
    refetch: fetchCheques,
  };
}
