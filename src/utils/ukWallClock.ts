import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const UK_TZ = 'Europe/London';

/** UK wall-clock "HH:mm" of an instant. */
export const ukTimeOf = (d: Date): string => formatInTimeZone(d, UK_TZ, 'HH:mm');

/** UK calendar date "yyyy-MM-dd" of an instant. */
export const ukDateOf = (d: Date): string => formatInTimeZone(d, UK_TZ, 'yyyy-MM-dd');

/** Instant for a UK calendar date + UK wall time; correct across clock changes. */
export const ukInstant = (ukDate: string, ukTime: string): Date =>
  fromZonedTime(`${ukDate}T${ukTime}:00`, UK_TZ);

/** Add whole days to a UK calendar date string. */
export const addUkDays = (ukDate: string, days: number): string => {
  const [y, m, d] = ukDate.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
};
