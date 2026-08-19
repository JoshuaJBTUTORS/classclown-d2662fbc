import { format, startOfWeek, differenceInWeeks, addWeeks, addDays } from 'date-fns';

export interface AcademicWeekInfo {
  currentWeek: number;
  totalWeeks: number;
  weekProgress: number;
  currentTerm: string;
  weekRange: string;
  academicYear: string;
}

// Determine current term (without "Term" suffix to match DB)
export function getAcademicTerm(week: number): string {
  if (week >= 1 && week <= 14) return 'Autumn';
  if (week >= 15 && week <= 28) return 'Spring';
  if (week >= 29 && week <= 42) return 'Summer';
  return 'Summer Holidays';
}

/**
 * Academic week info for any given date.
 * Week 1 = Monday of the week containing 1 September
 * (e.g. Monday 31 August 2026 = Week 1 of 2026/27).
 */
export function getAcademicWeekForDate(date: Date): AcademicWeekInfo {
  const year = date.getFullYear();

  const startForYear = (y: number) =>
    startOfWeek(new Date(y, 8, 1), { weekStartsOn: 1 });

  let academicStart = startForYear(year);
  if (startOfWeek(date, { weekStartsOn: 1 }) < academicStart) {
    academicStart = startForYear(year - 1);
  }

  const weeksSinceStart = Math.max(
    0,
    differenceInWeeks(startOfWeek(date, { weekStartsOn: 1 }), academicStart)
  );

  const currentWeek = Math.min(52, weeksSinceStart + 1);
  const weekProgress = (currentWeek / 52) * 100;

  const weekStart = addWeeks(academicStart, weeksSinceStart);
  const weekEnd = addDays(weekStart, 6);
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

  const startYear = academicStart.getFullYear();
  const endYear = startYear + 1;
  const academicYear = `${startYear}/${endYear.toString().slice(-2)} academic year`;

  return {
    currentWeek,
    totalWeeks: 52,
    weekProgress,
    currentTerm: getAcademicTerm(currentWeek),
    weekRange,
    academicYear,
  };
}

export function getAcademicWeekInfo(): AcademicWeekInfo {
  return getAcademicWeekForDate(new Date());
}
