import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cheque } from '@/types/cheque';

interface ChequeData {
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

interface UseChequeCalendarSyncReturn {
  createChequeWithSync: (cheque: ChequeData) => Promise<Cheque | null>;
  updateChequeWithSync: (id: string, cheque: ChequeData) => Promise<Cheque | null>;
  deleteChequeWithSync: (id: string) => Promise<boolean>;
}

export function useChequeCalendarSync(): UseChequeCalendarSyncReturn {
  const { toast } = useToast();

  const createChequeWithSync = useCallback(async (chequeData: ChequeData): Promise<Cheque | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to add cheques.',
          variant: 'destructive',
        });
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            cheque: chequeData,
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        // If Google Calendar not connected, still save locally
        if (result.error.includes('not connected')) {
          console.log('Google Calendar not connected, saving locally only');
          return null;
        }
        throw new Error(result.error);
      }

      toast({
        title: 'Cheque Added',
        description: 'Cheque has been added and synced to Google Calendar.',
      });

      // Convert database cheque to frontend Cheque type
      const dbCheque = result.cheque;
      return {
        id: dbCheque.id,
        chequeNumber: dbCheque.cheque_number,
        bankName: dbCheque.bank_name,
        accountNumber: dbCheque.account_number,
        payeeName: dbCheque.payee_name,
        amount: parseFloat(dbCheque.amount),
        issueDate: dbCheque.issue_date,
        dueDate: dbCheque.due_date,
        status: dbCheque.status,
        branch: dbCheque.branch,
        notes: dbCheque.notes,
        createdAt: dbCheque.created_at,
        reminderDate: dbCheque.reminder_date,
        isHolidayAdjusted: dbCheque.is_holiday_adjusted,
        holidaySkipped: dbCheque.holiday_skipped,
      };
    } catch (error) {
      console.error('Error creating cheque with sync:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync with Google Calendar',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateChequeWithSync = useCallback(async (id: string, chequeData: ChequeData): Promise<Cheque | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update',
            cheque: { id, ...chequeData },
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const dbCheque = result.cheque;
      return {
        id: dbCheque.id,
        chequeNumber: dbCheque.cheque_number,
        bankName: dbCheque.bank_name,
        accountNumber: dbCheque.account_number,
        payeeName: dbCheque.payee_name,
        amount: parseFloat(dbCheque.amount),
        issueDate: dbCheque.issue_date,
        dueDate: dbCheque.due_date,
        status: dbCheque.status,
        branch: dbCheque.branch,
        notes: dbCheque.notes,
        createdAt: dbCheque.created_at,
        reminderDate: dbCheque.reminder_date,
        isHolidayAdjusted: dbCheque.is_holiday_adjusted,
        holidaySkipped: dbCheque.holiday_skipped,
      };
    } catch (error) {
      console.error('Error updating cheque with sync:', error);
      return null;
    }
  }, []);

  const deleteChequeWithSync = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            cheque: { id },
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return true;
    } catch (error) {
      console.error('Error deleting cheque with sync:', error);
      return false;
    }
  }, []);

  return {
    createChequeWithSync,
    updateChequeWithSync,
    deleteChequeWithSync,
  };
}
