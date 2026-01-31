import { Cheque, Branch } from '@/types/cheque';
import { getReminderDate } from '@/lib/sriLankanHolidays';

export const branches: Branch[] = [
  { id: '1', name: 'Downtown Central', code: 'DTC' },
  { id: '2', name: 'Westside Plaza', code: 'WSP' },
  { id: '3', name: 'North Mall', code: 'NML' },
  { id: '4', name: 'East Market', code: 'EMK' },
];

// Helper function to calculate reminder dates for cheques
function calculateReminderInfo(dueDate: string): {
  reminderDate: string;
  isHolidayAdjusted: boolean;
  holidaySkipped: string[];
} {
  const { reminderDate, isAdjusted, skippedDays } = getReminderDate(new Date(dueDate));
  return {
    reminderDate: reminderDate.toISOString(),
    isHolidayAdjusted: isAdjusted,
    holidaySkipped: skippedDays,
  };
}

export const mockCheques: Cheque[] = [
  {
    id: '1',
    chequeNumber: 'CHQ-2024-001',
    bankName: 'Bank of Ceylon',
    accountNumber: '****4521',
    payeeName: 'Fresh Produce Suppliers Ltd',
    amount: 1575000.00,
    issueDate: '2024-01-15',
    dueDate: '2024-02-04', // National Day - will be adjusted
    status: 'cleared',
    branch: 'Downtown Central',
    notes: 'Monthly produce supply',
    createdAt: '2024-01-15T10:30:00Z',
    ...calculateReminderInfo('2024-02-04'),
  },
  {
    id: '2',
    chequeNumber: 'CHQ-2025-002',
    bankName: 'Commercial Bank',
    accountNumber: '****7832',
    payeeName: 'Dairy Products Co.',
    amount: 842050.50,
    issueDate: '2025-01-10',
    dueDate: '2025-01-13', // Duruthu Poya Day - will be adjusted
    status: 'pending',
    branch: 'Westside Plaza',
    createdAt: '2025-01-10T14:15:00Z',
    ...calculateReminderInfo('2025-01-13'),
  },
  {
    id: '3',
    chequeNumber: 'CHQ-2025-003',
    bankName: 'Sampath Bank',
    accountNumber: '****2156',
    payeeName: 'Beverage Distributors Inc',
    amount: 2310000.00,
    issueDate: '2025-01-20',
    dueDate: '2025-02-04', // National Day - will be adjusted
    status: 'pending',
    branch: 'North Mall',
    notes: 'Quarterly beverage order',
    createdAt: '2025-01-20T09:45:00Z',
    ...calculateReminderInfo('2025-02-04'),
  },
  {
    id: '4',
    chequeNumber: 'CHQ-2025-004',
    bankName: 'Peoples Bank',
    accountNumber: '****9043',
    payeeName: 'Cleaning Supplies Co',
    amount: 325075.00,
    issueDate: '2025-01-10',
    dueDate: '2025-04-13', // Day Prior to Sinhala & Tamil New Year
    status: 'pending',
    branch: 'East Market',
    notes: 'Cleaning supplies quarterly',
    createdAt: '2025-01-10T11:20:00Z',
    ...calculateReminderInfo('2025-04-13'),
  },
  {
    id: '5',
    chequeNumber: 'CHQ-2025-005',
    bankName: 'Bank of Ceylon',
    accountNumber: '****4521',
    payeeName: 'Bakery Supplies Ltd',
    amount: 689000.00,
    issueDate: '2025-01-22',
    dueDate: '2025-02-08', // Saturday - will be adjusted to Monday
    status: 'pending',
    branch: 'Downtown Central',
    createdAt: '2025-01-22T16:00:00Z',
    ...calculateReminderInfo('2025-02-08'),
  },
  {
    id: '6',
    chequeNumber: 'CHQ-2025-006',
    bankName: 'Commercial Bank',
    accountNumber: '****7832',
    payeeName: 'Meat Processors Inc',
    amount: 3450000.00,
    issueDate: '2025-01-25',
    dueDate: '2025-05-12', // Vesak Full Moon Poya Day
    status: 'pending',
    branch: 'Westside Plaza',
    createdAt: '2025-01-25T10:10:00Z',
    ...calculateReminderInfo('2025-05-12'),
  },
  {
    id: '7',
    chequeNumber: 'CHQ-2025-007',
    bankName: 'HNB',
    accountNumber: '****5567',
    payeeName: 'Rice Merchants Association',
    amount: 1250000.00,
    issueDate: '2025-01-28',
    dueDate: '2025-03-15', // Regular working day
    status: 'pending',
    branch: 'North Mall',
    createdAt: '2025-01-28T08:30:00Z',
    ...calculateReminderInfo('2025-03-15'),
  },
  {
    id: '8',
    chequeNumber: 'CHQ-2025-008',
    bankName: 'NSB',
    accountNumber: '****3321',
    payeeName: 'Frozen Foods Ltd',
    amount: 780500.00,
    issueDate: '2025-01-30',
    dueDate: '2025-04-14', // Sinhala & Tamil New Year
    status: 'pending',
    branch: 'East Market',
    notes: 'Frozen goods - quarterly order',
    createdAt: '2025-01-30T12:00:00Z',
    ...calculateReminderInfo('2025-04-14'),
  },
];
