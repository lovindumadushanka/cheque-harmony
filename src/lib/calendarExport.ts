import { Cheque } from '@/types/cheque';
import { format, parseISO } from 'date-fns';

/**
 * Generate an iCalendar (.ics) file content for a single cheque
 */
export function generateICSEvent(cheque: Cheque): string {
  const eventDate = cheque.reminderDate || cheque.dueDate;
  const dateFormatted = format(parseISO(eventDate), 'yyyyMMdd');
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  
  // Create a unique ID for the event
  const uid = `cheque-${cheque.id}@chequeflow.app`;
  
  // Format amount with currency
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
  }).format(cheque.amount);

  const description = [
    `Cheque Number: ${cheque.chequeNumber}`,
    `Payee: ${cheque.payeeName}`,
    `Amount: ${formattedAmount}`,
    `Bank: ${cheque.bankName}`,
    `Branch: ${cheque.branch}`,
    cheque.notes ? `Notes: ${cheque.notes}` : '',
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChequeFlow//Cheque Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dateFormatted}`,
    `DTEND;VALUE=DATE:${dateFormatted}`,
    `SUMMARY:💰 Cheque Due: ${cheque.payeeName}`,
    `DESCRIPTION:${description}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Cheque reminder: ${cheque.payeeName} - ${formattedAmount}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Generate an iCalendar (.ics) file content for multiple cheques
 */
export function generateICSCalendar(cheques: Cheque[]): string {
  const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  
  const events = cheques.map(cheque => {
    const eventDate = cheque.reminderDate || cheque.dueDate;
    const dateFormatted = format(parseISO(eventDate), 'yyyyMMdd');
    const uid = `cheque-${cheque.id}@chequeflow.app`;
    
    const formattedAmount = new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(cheque.amount);

    const description = [
      `Cheque Number: ${cheque.chequeNumber}`,
      `Payee: ${cheque.payeeName}`,
      `Amount: ${formattedAmount}`,
      `Bank: ${cheque.bankName}`,
      `Branch: ${cheque.branch}`,
      cheque.notes ? `Notes: ${cheque.notes}` : '',
    ].filter(Boolean).join('\\n');

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateFormatted}`,
      `DTEND;VALUE=DATE:${dateFormatted}`,
      `SUMMARY:💰 Cheque Due: ${cheque.payeeName}`,
      `DESCRIPTION:${description}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Cheque reminder: ${cheque.payeeName} - ${formattedAmount}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChequeFlow//Cheque Reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ChequeFlow Reminders',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Download a single cheque as .ics file
 */
export function downloadChequeICS(cheque: Cheque): void {
  const icsContent = generateICSEvent(cheque);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `cheque-${cheque.chequeNumber}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple cheques as a single .ics file
 */
export function downloadAllChequesICS(cheques: Cheque[]): void {
  const pendingCheques = cheques.filter(c => c.status === 'pending');
  
  if (pendingCheques.length === 0) {
    return;
  }
  
  const icsContent = generateICSCalendar(pendingCheques);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `chequeflow-reminders-${format(new Date(), 'yyyy-MM-dd')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
