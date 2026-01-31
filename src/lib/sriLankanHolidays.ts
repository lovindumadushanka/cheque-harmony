// Sri Lankan Bank Holidays Calendar
// Includes public holidays and bank-specific holidays

export interface Holiday {
  date: string; // Format: MM-DD
  name: string;
  year?: number; // If specified, only applies to that year (for variable dates)
}

// Fixed holidays (same date every year)
const fixedHolidays: Holiday[] = [
  { date: '01-01', name: 'New Year\'s Day' },
  { date: '01-15', name: 'Thai Pongal' },
  { date: '02-04', name: 'National Day' },
  { date: '04-13', name: 'Day Prior to Sinhala & Tamil New Year' },
  { date: '04-14', name: 'Sinhala & Tamil New Year' },
  { date: '05-01', name: 'May Day' },
  { date: '12-25', name: 'Christmas Day' },
];

// Variable holidays for 2024-2026 (Poya days, Eid, Deepavali, etc.)
const variableHolidays: Holiday[] = [
  // 2024
  { date: '01-25', name: 'Duruthu Full Moon Poya Day', year: 2024 },
  { date: '02-23', name: 'Navam Full Moon Poya Day', year: 2024 },
  { date: '03-24', name: 'Medin Full Moon Poya Day', year: 2024 },
  { date: '03-29', name: 'Good Friday', year: 2024 },
  { date: '04-11', name: 'Id-Ul-Fitr (Eid)', year: 2024 },
  { date: '04-23', name: 'Bak Full Moon Poya Day', year: 2024 },
  { date: '05-23', name: 'Vesak Full Moon Poya Day', year: 2024 },
  { date: '05-24', name: 'Day After Vesak', year: 2024 },
  { date: '06-17', name: 'Id-Ul-Alha (Hadji)', year: 2024 },
  { date: '06-21', name: 'Poson Full Moon Poya Day', year: 2024 },
  { date: '07-20', name: 'Esala Full Moon Poya Day', year: 2024 },
  { date: '08-19', name: 'Nikini Full Moon Poya Day', year: 2024 },
  { date: '09-16', name: 'Milad-Un-Nabi', year: 2024 },
  { date: '09-17', name: 'Binara Full Moon Poya Day', year: 2024 },
  { date: '10-17', name: 'Vap Full Moon Poya Day', year: 2024 },
  { date: '11-01', name: 'Deepavali', year: 2024 },
  { date: '11-15', name: 'Ill Full Moon Poya Day', year: 2024 },
  { date: '12-14', name: 'Unduvap Full Moon Poya Day', year: 2024 },
  
  // 2025
  { date: '01-13', name: 'Duruthu Full Moon Poya Day', year: 2025 },
  { date: '02-12', name: 'Navam Full Moon Poya Day', year: 2025 },
  { date: '03-13', name: 'Medin Full Moon Poya Day', year: 2025 },
  { date: '03-31', name: 'Id-Ul-Fitr (Eid)', year: 2025 },
  { date: '04-12', name: 'Bak Full Moon Poya Day', year: 2025 },
  { date: '04-18', name: 'Good Friday', year: 2025 },
  { date: '05-12', name: 'Vesak Full Moon Poya Day', year: 2025 },
  { date: '05-13', name: 'Day After Vesak', year: 2025 },
  { date: '06-07', name: 'Id-Ul-Alha (Hadji)', year: 2025 },
  { date: '06-11', name: 'Poson Full Moon Poya Day', year: 2025 },
  { date: '07-10', name: 'Esala Full Moon Poya Day', year: 2025 },
  { date: '08-08', name: 'Nikini Full Moon Poya Day', year: 2025 },
  { date: '09-05', name: 'Milad-Un-Nabi', year: 2025 },
  { date: '09-07', name: 'Binara Full Moon Poya Day', year: 2025 },
  { date: '10-06', name: 'Vap Full Moon Poya Day', year: 2025 },
  { date: '10-20', name: 'Deepavali', year: 2025 },
  { date: '11-05', name: 'Ill Full Moon Poya Day', year: 2025 },
  { date: '12-04', name: 'Unduvap Full Moon Poya Day', year: 2025 },

  // 2026
  { date: '01-03', name: 'Duruthu Full Moon Poya Day', year: 2026 },
  { date: '02-01', name: 'Navam Full Moon Poya Day', year: 2026 },
  { date: '03-03', name: 'Medin Full Moon Poya Day', year: 2026 },
  { date: '03-20', name: 'Id-Ul-Fitr (Eid)', year: 2026 },
  { date: '04-01', name: 'Bak Full Moon Poya Day', year: 2026 },
  { date: '04-03', name: 'Good Friday', year: 2026 },
  { date: '05-01', name: 'Vesak Full Moon Poya Day', year: 2026 },
  { date: '05-02', name: 'Day After Vesak', year: 2026 },
  { date: '05-27', name: 'Id-Ul-Alha (Hadji)', year: 2026 },
  { date: '05-31', name: 'Poson Full Moon Poya Day', year: 2026 },
  { date: '06-29', name: 'Esala Full Moon Poya Day', year: 2026 },
  { date: '07-29', name: 'Nikini Full Moon Poya Day', year: 2026 },
  { date: '08-26', name: 'Milad-Un-Nabi', year: 2026 },
  { date: '08-27', name: 'Binara Full Moon Poya Day', year: 2026 },
  { date: '09-26', name: 'Vap Full Moon Poya Day', year: 2026 },
  { date: '11-08', name: 'Deepavali', year: 2026 },
  { date: '10-25', name: 'Ill Full Moon Poya Day', year: 2026 },
  { date: '11-24', name: 'Unduvap Full Moon Poya Day', year: 2026 },
];

/**
 * Check if a given date is a Sri Lankan bank holiday
 */
export function isHoliday(date: Date): { isHoliday: boolean; holidayName?: string } {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}`;
  const year = date.getFullYear();

  // Check fixed holidays
  const fixedHoliday = fixedHolidays.find(h => h.date === dateStr);
  if (fixedHoliday) {
    return { isHoliday: true, holidayName: fixedHoliday.name };
  }

  // Check variable holidays for specific year
  const variableHoliday = variableHolidays.find(
    h => h.date === dateStr && h.year === year
  );
  if (variableHoliday) {
    return { isHoliday: true, holidayName: variableHoliday.name };
  }

  return { isHoliday: false };
}

/**
 * Check if a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a given date is a bank working day
 */
export function isBankWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date).isHoliday;
}

/**
 * Get the next bank working day from a given date
 * If the given date is a working day, it returns the same date
 */
export function getNextBankWorkingDay(date: Date): { date: Date; skippedDays: string[] } {
  const result = new Date(date);
  const skippedDays: string[] = [];

  while (!isBankWorkingDay(result)) {
    const holidayCheck = isHoliday(result);
    if (isWeekend(result)) {
      skippedDays.push(result.getDay() === 0 ? 'Sunday' : 'Saturday');
    } else if (holidayCheck.isHoliday) {
      skippedDays.push(holidayCheck.holidayName || 'Holiday');
    }
    result.setDate(result.getDate() + 1);
  }

  return { date: result, skippedDays };
}

/**
 * Calculate the reminder date for a cheque
 * Returns the due date if it's a working day, otherwise the next working day
 */
export function getReminderDate(dueDate: Date): {
  reminderDate: Date;
  isAdjusted: boolean;
  originalDate: Date;
  skippedDays: string[];
} {
  const { date: reminderDate, skippedDays } = getNextBankWorkingDay(dueDate);
  const isAdjusted = reminderDate.getTime() !== dueDate.getTime();

  return {
    reminderDate,
    isAdjusted,
    originalDate: dueDate,
    skippedDays,
  };
}

/**
 * Get all holidays for a specific month and year
 */
export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  const monthStr = String(month + 1).padStart(2, '0');
  
  const fixed = fixedHolidays.filter(h => h.date.startsWith(monthStr));
  const variable = variableHolidays.filter(
    h => h.date.startsWith(monthStr) && h.year === year
  );

  return [...fixed, ...variable];
}

/**
 * Get upcoming holidays from today
 */
export function getUpcomingHolidays(count: number = 5): { date: Date; name: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const holidays: { date: Date; name: string }[] = [];
  const currentYear = today.getFullYear();
  
  // Check current year and next year
  for (let year = currentYear; year <= currentYear + 1 && holidays.length < count; year++) {
    // Fixed holidays
    for (const holiday of fixedHolidays) {
      const [month, day] = holiday.date.split('-').map(Number);
      const holidayDate = new Date(year, month - 1, day);
      if (holidayDate >= today) {
        holidays.push({ date: holidayDate, name: holiday.name });
      }
    }
    
    // Variable holidays
    for (const holiday of variableHolidays) {
      if (holiday.year === year) {
        const [month, day] = holiday.date.split('-').map(Number);
        const holidayDate = new Date(year, month - 1, day);
        if (holidayDate >= today) {
          holidays.push({ date: holidayDate, name: holiday.name });
        }
      }
    }
  }

  // Sort by date and return requested count
  return holidays
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

/**
 * Check if a date is a bank holiday (convenience wrapper)
 */
export function isBankHoliday(date: Date): boolean {
  return isHoliday(date).isHoliday;
}

/**
 * Get the holiday name for a date (returns null if not a holiday)
 */
export function getHolidayName(date: Date): string | null {
  const result = isHoliday(date);
  return result.isHoliday ? result.holidayName || null : null;
}
