import { endOfMonth, addDays, startOfWeek, endOfWeek, format } from 'date-fns';

/**
 * Gets the last Friday of a given month
 */
export const getLastFridayOfMonth = (date: Date): Date => {
  const lastDayOfMonth = endOfMonth(date);
  const dayOfWeek = lastDayOfMonth.getDay(); // 0 = Sunday, 5 = Friday
  
  // Calculate days to subtract to get to Friday
  const daysToSubtract = dayOfWeek >= 5 ? dayOfWeek - 5 : dayOfWeek + 2;
  
  const lastFriday = new Date(lastDayOfMonth);
  lastFriday.setDate(lastDayOfMonth.getDate() - daysToSubtract);
  
  return lastFriday;
};

/**
 * Gets the monthly earnings period boundaries (last Friday to last Friday)
 */
export const getMonthlyEarningsPeriod = (date: Date) => {
  const currentLastFriday = getLastFridayOfMonth(date);
  const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const previousLastFriday = getLastFridayOfMonth(previousMonth);
  
  return {
    start: addDays(previousLastFriday, 1), // Day after last Friday of previous month
    end: currentLastFriday // Last Friday of current month
  };
};

/**
 * Gets the earnings period boundaries based on the period type
 */
export const getEarningsPeriod = (date: Date, period: 'weekly' | 'monthly') => {
  if (period === 'weekly') {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
      end: endOfWeek(date, { weekStartsOn: 1 }) // Sunday
    };
  } else {
    return getMonthlyEarningsPeriod(date);
  }
};

/**
 * Gets the next payment date (1st of the month after the period ends)
 */
export const getNextPaymentDate = (periodEnd: Date): Date => {
  const nextMonth = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 1);
  return nextMonth;
};

/**
 * Gets the previous earnings period
 */
export const getPreviousEarningsPeriod = (currentDate: Date, period: 'weekly' | 'monthly'): { start: Date; end: Date } => {
  if (period === 'weekly') {
    const previousWeekDate = addDays(currentDate, -7);
    return getEarningsPeriod(previousWeekDate, 'weekly');
  } else {
    const previousMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15);
    return getMonthlyEarningsPeriod(previousMonthDate);
  }
};

/**
 * Gets the next earnings period
 */
export const getNextEarningsPeriod = (currentDate: Date, period: 'weekly' | 'monthly'): { start: Date; end: Date } => {
  if (period === 'weekly') {
    const nextWeekDate = addDays(currentDate, 7);
    return getEarningsPeriod(nextWeekDate, 'weekly');
  } else {
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
    return getMonthlyEarningsPeriod(nextMonthDate);
  }
};

/**
 * Checks if a period is in the future
 */
export const isPeriodInFuture = (periodStart: Date): boolean => {
  return periodStart > new Date();
};

/**
 * Formats a period for display
 */
export const formatPeriodDisplay = (start: Date, end: Date): string => {
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
};