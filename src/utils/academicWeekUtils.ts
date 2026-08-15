import { format, startOfWeek, differenceInWeeks, addWeeks } from 'date-fns';

export interface AcademicWeekInfo {
  currentWeek: number;
  totalWeeks: number;
  weekProgress: number;
  currentTerm: string;
  weekRange: string;
  academicYear: string;
}

export function getAcademicWeekInfo(): AcademicWeekInfo {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Week 1 starts on the Monday of the week containing 1 September
  // (e.g. Monday 31 August 2026 = Week 1 of 2026/27)
  const startForYear = (year: number) =>
    startOfWeek(new Date(year, 8, 1), { weekStartsOn: 1 });

  let academicStart = startForYear(currentYear);
  if (startOfWeek(now, { weekStartsOn: 1 }) < academicStart) {
    academicStart = startForYear(currentYear - 1);
  }

  // Whole weeks elapsed since the academic start Monday
  const weeksSinceStart = Math.max(
    0,
    differenceInWeeks(startOfWeek(now, { weekStartsOn: 1 }), academicStart)
  );

  // Calculate current academic week (1-52)
  const currentWeek = Math.min(52, weeksSinceStart + 1);

  
  // Calculate progress percentage
  const weekProgress = (currentWeek / 52) * 100;
  
  // Determine current term (without "Term" suffix to match DB)
  const getCurrentTerm = (week: number): string => {
    if (week >= 1 && week <= 14) return 'Autumn';
    if (week >= 15 && week <= 28) return 'Spring';
    if (week >= 29 && week <= 42) return 'Summer';
    return 'Summer Holidays';
  };
  
  // Get week date range
  const weekStart = addWeeks(academicStart, weeksSinceStart);
  const weekEnd = addWeeks(weekStart, 1);
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
  
  // Academic year string
  const startYear = academicStart.getFullYear();
  const endYear = startYear + 1;
  const academicYear = `${startYear}/${endYear.toString().slice(-2)} academic year`;

  
  return {
    currentWeek,
    totalWeeks: 52,
    weekProgress,
    currentTerm: getCurrentTerm(currentWeek),
    weekRange,
    academicYear,
  };
}