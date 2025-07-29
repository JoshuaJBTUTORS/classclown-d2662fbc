import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAvailabilitySlot {
  id: string;
  admin_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface AdminInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const useAdminAvailability = (selectedDate?: string) => {
  const [availableAdmins, setAvailableAdmins] = useState<AdminInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate) {
      setAvailableAdmins([]);
      return;
    }

    const fetchAvailableAdmins = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const date = new Date(selectedDate);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

        // Get admins who are available on this day
        const { data: adminAvailability, error: availabilityError } = await supabase
          .from('admin_availability')
          .select('admin_id, start_time, end_time')
          .eq('day_of_week', dayOfWeek);

        if (availabilityError) throw availabilityError;

        if (!adminAvailability || adminAvailability.length === 0) {
          setAvailableAdmins([]);
          return;
        }

        // Get unique admin IDs
        const adminIds = [...new Set(adminAvailability.map(slot => slot.admin_id))];

        // Fetch admin profiles
        const { data: adminProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', adminIds);

        if (profileError) throw profileError;

        // Transform the data to get admin info
        const admins: AdminInfo[] = adminProfiles?.map(profile => ({
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: '', // We'll need to fetch this separately if needed
        })) || [];

        setAvailableAdmins(admins);
      } catch (err: any) {
        console.error('Error fetching admin availability:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableAdmins();
  }, [selectedDate]);

  return { availableAdmins, isLoading, error };
};