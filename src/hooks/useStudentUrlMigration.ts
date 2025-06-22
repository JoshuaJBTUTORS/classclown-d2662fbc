
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStudentUrlMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  const migrateExistingLessons = async () => {
    setIsMigrating(true);
    try {
      console.log("Migration no longer needed - old lesson space system has been removed");
      
      // Since we removed all old video conferencing columns, this migration is no longer relevant
      // We only support Flexible Classroom now
      
      const { data: lessonsWithFlexibleClassroom, error: fetchError } = await supabase
        .from('lessons')
        .select('id, title, flexible_classroom_room_id')
        .not('flexible_classroom_room_id', 'is', null);

      if (fetchError) {
        console.error("Error fetching lessons:", fetchError);
        toast.error('Failed to fetch lessons');
        return;
      }

      if (!lessonsWithFlexibleClassroom || lessonsWithFlexibleClassroom.length === 0) {
        toast.info('No lessons with Flexible Classroom found');
        return;
      }

      toast.success(`Found ${lessonsWithFlexibleClassroom.length} lessons with Flexible Classroom configured`);
      console.log(`Migration completed: ${lessonsWithFlexibleClassroom.length} lessons already using Flexible Classroom`);
      
    } catch (error) {
      console.error('Error during migration check:', error);
      toast.error('Migration check failed: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    migrateExistingLessons,
    isMigrating
  };
};
