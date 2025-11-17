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
  
  // Calculate academic year start (first Monday of September)
  // If we're before September, use previous year's September
  const academicYearStart = now.getMonth() < 8 
    ? new Date(currentYear - 1, 8, 1) // September 1st of previous year
    : new Date(currentYear, 8, 1); // September 1st of current year
  
  // Find the first Monday of September (or September 1st if it's already Monday)
  const firstMonday = startOfWeek(academicYearStart, { weekStartsOn: 1 });
  
  // If September 1st is not a Monday, find the next Monday
  const academicStart = firstMonday.getDate() <= 7 
    ? firstMonday 
    : addWeeks(firstMonday, 1);
  
  // Calculate weeks since academic year start
  const weeksSinceStart = differenceInWeeks(now, academicStart);
  
  // Calculate current academic week (1-52, reset after 52)
  const currentWeek = ((weeksSinceStart % 52) + 1);
  
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
  const academicYear = academicStart.getFullYear() + '/' + (academicStart.getFullYear() + 1);
  
  return {
    currentWeek,
    totalWeeks: 52,
    weekProgress,
    currentTerm: getCurrentTerm(currentWeek),
    weekRange,
    academicYear,
  };
}