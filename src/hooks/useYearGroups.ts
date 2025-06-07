
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface YearGroup {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
}

export const useYearGroups = () => {
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYearGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('year_groups')
          .select('id, name, display_name, description, sort_order')
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setYearGroups(data || []);
      } catch (err) {
        console.error('Error fetching year groups:', err);
        setError('Failed to load year groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchYearGroups();
  }, []);

  return { yearGroups, isLoading, error };
};
