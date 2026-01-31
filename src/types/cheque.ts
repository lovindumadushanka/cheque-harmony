export type ChequeStatus = 'pending' | 'cleared' | 'bounced';

export interface Cheque {
  id: string;
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
  createdAt: string;
  // Reminder fields
  reminderDate?: string;
  isHolidayAdjusted?: boolean;
  holidaySkipped?: string[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface ReminderInfo {
  chequeId: string;
  chequeNumber: string;
  originalDueDate: Date;
  reminderDate: Date;
  isAdjusted: boolean;
  skippedDays: string[];
  amount: number;
  payeeName: string;
}
