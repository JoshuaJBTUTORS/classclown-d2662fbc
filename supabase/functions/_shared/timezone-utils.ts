import { toZonedTime, fromZonedTime, formatInTimeZone } from 'npm:date-fns-tz@3.2.0';
import { format, parseISO } from 'npm:date-fns@3.6.0';

// UK timezone constant
export const UK_TIMEZONE = 'Europe/London';

/**
 * Convert a UK local time to UTC for database storage
 * @param ukLocalTime - Date object representing UK local time
 * @returns Date object in UTC
 */
export function convertUKToUTC(ukLocalTime: Date): Date {
  return fromZonedTime(ukLocalTime, UK_TIMEZONE);
}

/**
 * Convert UTC time from database to UK local time for display
 * @param utcTime - Date object or ISO string in UTC
 * @returns Date object in UK timezone
 */
export function convertUTCToUK(utcTime: Date | string): Date {
  const date = typeof utcTime === 'string' ? parseISO(utcTime) : utcTime;
  return toZonedTime(date, UK_TIMEZONE);
}

/**
 * Format a date in UK timezone - DIRECT formatting without conversion
 * @param date - Date object or ISO string in UTC
 * @param formatString - Format string for date-fns
 * @returns Formatted date string in UK timezone
 */
export function formatInUKTime(date: Date | string, formatString: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, UK_TIMEZONE, formatString);
}

/**
 * Create a Date object from UK local date and time components
 * @param date - Date object representing the day
 * @param timeString - Time string in format "HH:mm"
 * @returns Date object representing UK local time
 */
export function createUKDateTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create ISO string in UK timezone format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hourStr = String(hours).padStart(2, '0');
  const minuteStr = String(minutes).padStart(2, '0');
  
  // Create ISO string and interpret it as UK time
  const isoString = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00`;
  
  // Parse as if it were in UK timezone
  return toZonedTime(new Date(isoString), UK_TIMEZONE);
}

/**
 * Get current UK date/time
 * @returns Date object in UK timezone
 */
export function getCurrentUKTime(): Date {
  return toZonedTime(new Date(), UK_TIMEZONE);
}

/**
 * Format lesson time for LessonSpace API (in UTC)
 * @param ukDateTime - Date object in UK timezone
 * @returns ISO string in UTC
 */
export function formatForLessonSpaceAPI(ukDateTime: Date): string {
  const utcTime = convertUKToUTC(ukDateTime);
  return utcTime.toISOString();
}