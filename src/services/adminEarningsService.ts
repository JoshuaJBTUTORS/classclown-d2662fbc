import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AdminEarningGoal {
  id: string;
  admin_id: string;
  goal_amount: number;
  period: 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

interface AdminEarningsData {
  currentEarnings: number;
  goalAmount: number;
  progressPercentage: number;
  uniqueBookingsCount: number;
  totalBookingsCount: number;
  period: 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
}

export const getAdminEarningGoal = async (adminId: string, period: 'weekly' | 'monthly' = 'monthly'): Promise<AdminEarningGoal | null> => {
  try {
    const { data, error } = await supabase
      .from('admin_earning_goals')
      .select('*')
      .eq('admin_id', adminId)
      .eq('period', period)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin earning goal:', error);
      return null;
    }

    return data as AdminEarningGoal;
  } catch (error) {
    console.error('Error fetching admin earning goal:', error);
    return null;
  }
};

export const setAdminEarningGoal = async (adminId: string, goalAmount: number, period: 'weekly' | 'monthly'): Promise<AdminEarningGoal> => {
  try {
    // First, try to update existing goal
    const existingGoal = await getAdminEarningGoal(adminId, period);
    
    if (existingGoal) {
      const { data, error } = await supabase
        .from('admin_earning_goals')
        .update({ 
          goal_amount: goalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGoal.id)
        .select()
        .single();

      if (error) throw error;
      return data as AdminEarningGoal;
    } else {
      // Create new goal
      const { data, error } = await supabase
        .from('admin_earning_goals')
        .insert({
          admin_id: adminId,
          goal_amount: goalAmount,
          period
        })
        .select()
        .single();

      if (error) throw error;
      return data as AdminEarningGoal;
    }
  } catch (error) {
    console.error('Error setting admin earning goal:', error);
    throw error;
  }
};

export const calculateAdminEarnings = async (adminId: string, period: 'weekly' | 'monthly' = 'monthly'): Promise<number> => {
  try {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === 'weekly') {
      startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // Count unique Musa bookings in the period
    // Each booking is worth R23 (South African Rands)
    const earningsPerUniqueBooking = 2300; // R23 in cents

    const { data, error } = await supabase
      .from('trial_bookings')
      .select('id')
      .eq('booking_source', 'musa')
      .eq('is_unique_booking', true)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error calculating admin earnings:', error);
      return 0;
    }

    const uniqueBookingsCount = data?.length || 0;
    return uniqueBookingsCount * earningsPerUniqueBooking;
  } catch (error) {
    console.error('Error calculating admin earnings:', error);
    return 0;
  }
};

export const getAdminEarningsData = async (adminId: string, period: 'weekly' | 'monthly' = 'monthly'): Promise<AdminEarningsData> => {
  try {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (period === 'weekly') {
      periodStart = startOfWeek(now, { weekStartsOn: 1 });
      periodEnd = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
    }

    // Get current earnings
    const currentEarnings = await calculateAdminEarnings(adminId, period);

    // Get goal
    const goal = await getAdminEarningGoal(adminId, period);
    const goalAmount = goal?.goal_amount || 0;

    // Calculate progress percentage
    const progressPercentage = goalAmount > 0 ? Math.min((currentEarnings / goalAmount) * 100, 100) : 0;

    // Get booking counts
    const { data: uniqueBookings } = await supabase
      .from('trial_bookings')
      .select('id')
      .eq('booking_source', 'musa')
      .eq('is_unique_booking', true)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    const { data: totalBookings } = await supabase
      .from('trial_bookings')
      .select('id')
      .eq('booking_source', 'musa')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    return {
      currentEarnings,
      goalAmount,
      progressPercentage,
      uniqueBookingsCount: uniqueBookings?.length || 0,
      totalBookingsCount: totalBookings?.length || 0,
      period,
      periodStart,
      periodEnd
    };
  } catch (error) {
    console.error('Error getting admin earnings data:', error);
    return {
      currentEarnings: 0,
      goalAmount: 0,
      progressPercentage: 0,
      uniqueBookingsCount: 0,
      totalBookingsCount: 0,
      period,
      periodStart: new Date(),
      periodEnd: new Date()
    };
  }
};