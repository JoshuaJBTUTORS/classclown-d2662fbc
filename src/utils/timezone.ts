import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';

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
 * Format a date in UK timezone
 * @param date - Date object or ISO string
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
  const ukDateTime = new Date(date);
  ukDateTime.setHours(hours, minutes, 0, 0);
  return ukDateTime;
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