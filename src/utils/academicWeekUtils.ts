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
  
  // Academic year runs from the first Monday of August.
  const academicYearStart = now.getMonth() >= 7
    ? new Date(currentYear, 7, 1) // August 1st of current year
    : new Date(currentYear - 1, 7, 1); // August 1st of previous year

  // First Monday on or after August 1st
  const monday = startOfWeek(academicYearStart, { weekStartsOn: 1 });
  const academicStart = monday < academicYearStart ? addWeeks(monday, 1) : monday;

  // Calculate weeks since academic year start
  const weeksSinceStart = Math.max(0, differenceInWeeks(now, academicStart));

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