

# Google Calendar Sync Integration Fix

## Problem Analysis

After investigating the codebase, I found the following issues:

1. **Edge functions are working correctly** - Both `google-calendar-auth` and `google-calendar-sync` are deployed and responding properly
2. **Data flow is broken** - The Index page still uses mock data (`mockCheques`) instead of fetching from the database
3. **Sync hook not integrated** - The `useChequeCalendarSync` hook exists but is never used by the UI components
4. **AddChequeDialog only updates local state** - Cheques aren't being saved to the database or synced to Google Calendar

## Solution Overview

Connect the existing sync functionality to the UI by:
- Fetching cheques from the database instead of using mock data
- Using the `useChequeCalendarSync` hook when adding/updating/deleting cheques
- Adding proper loading and error states

## Implementation Steps

### Step 1: Create a useCheques hook for database operations

Create a new hook `src/hooks/useCheques.ts` that:
- Fetches cheques from Supabase on mount
- Provides add, update, delete functions that use `useChequeCalendarSync`
- Returns loading state and cheques data

### Step 2: Update the Index page

Modify `src/pages/Index.tsx` to:
- Replace `mockCheques` state with the new `useCheques` hook
- Use the hook's functions for all cheque operations
- Show loading state while fetching data

### Step 3: Update AddChequeDialog

Modify `src/components/AddChequeDialog.tsx` to:
- Accept an async `onAdd` function
- Show loading state during submission
- Format date strings correctly for the database

### Step 4: Handle cheque status changes with sync

Update the status change functionality to:
- Use the sync hook to update cheques in the database
- Update the corresponding Google Calendar event

---

## Technical Details

### Database Schema Mapping
The cheques table uses snake_case columns which need to be mapped to camelCase for the frontend:
```text
+-----------------+------------------+
| Database Column | Frontend Field   |
+-----------------+------------------+
| cheque_number   | chequeNumber     |
| bank_name       | bankName         |
| account_number  | accountNumber    |
| payee_name      | payeeName        |
| issue_date      | issueDate        |
| due_date        | dueDate          |
| reminder_date   | reminderDate     |
| created_at      | createdAt        |
+-----------------+------------------+
```

### New useCheques Hook Structure
```typescript
interface UseCheques {
  cheques: Cheque[];
  isLoading: boolean;
  addCheque: (cheque: ChequeInput) => Promise<void>;
  updateCheque: (id: string, cheque: ChequeInput) => Promise<void>;
  deleteCheque: (id: string) => Promise<void>;
  updateStatus: (id: string, status: ChequeStatus) => Promise<void>;
  refetch: () => Promise<void>;
}
```

### Fallback Strategy
When Google Calendar is not connected:
- Save cheques to the database directly (without calendar sync)
- Show a toast suggesting the user connect their calendar
- Calendar sync will work automatically once connected

