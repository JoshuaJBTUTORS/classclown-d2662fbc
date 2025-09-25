import { endOfMonth, addDays, startOfWeek, endOfWeek } from 'date-fns';

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