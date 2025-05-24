
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStudentUrlMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  const migrateExistingLessons = async () => {
    setIsMigrating(true);
    try {
      console.log("Starting migration of existing lessons...");
      
      // Find lessons that have lesson_space_room_id but students with NULL lesson_space_url
      const { data: lessonsToMigrate, error: fetchError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          lesson_space_room_id,
          lesson_students!inner(
            id,
            lesson_space_url,
            student:students(id, first_name, last_name)
          )
        `)
        .not('lesson_space_room_id', 'is', null)
        .is('lesson_students.lesson_space_url', null);

      if (fetchError) {
        console.error("Error fetching lessons to migrate:", fetchError);
        toast.error('Failed to fetch lessons for migration');
        return;
      }

      if (!lessonsToMigrate || lessonsToMigrate.length === 0) {
        toast.success('No lessons need migration - all student URLs are already set');
        return;
      }

      console.log(`Found ${lessonsToMigrate.length} lessons that need student URL migration`);

      let successCount = 0;
      let failureCount = 0;

      // Process each lesson
      for (const lesson of lessonsToMigrate) {
        try {
          console.log(`Regenerating student URLs for lesson: ${lesson.title} (${lesson.id})`);
          
          // Call the lesson-space-integration function to regenerate URLs
          const { data: result, error } = await supabase.functions.invoke('lesson-space-integration', {
            body: {
              action: 'create-room',
              lessonId: lesson.id,
              title: lesson.title,
              startTime: new Date().toISOString(), // Use current time for migration
              duration: 60
            }
          });

          if (error || !result?.success) {
            console.error(`Failed to regenerate URLs for lesson ${lesson.id}:`, error || result?.error);
            failureCount++;
          } else {
            console.log(`Successfully regenerated URLs for lesson ${lesson.id}`);
            successCount++;
          }
        } catch (lessonError) {
          console.error(`Error processing lesson ${lesson.id}:`, lessonError);
          failureCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Migration completed: ${successCount} lessons updated successfully`);
      }
      if (failureCount > 0) {
        toast.error(`Migration had issues: ${failureCount} lessons failed to update`);
      }

      console.log(`Migration completed: ${successCount} success, ${failureCount} failures`);
    } catch (error) {
      console.error('Error during migration:', error);
      toast.error('Migration failed: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    migrateExistingLessons,
    isMigrating
  };
};
