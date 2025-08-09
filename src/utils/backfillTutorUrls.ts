
import { supabase } from '@/integrations/supabase/client';

export const backfillMissingTutorUrls = async () => {
  try {
    console.log('🔍 Starting backfill of missing tutor URLs...');

    // Find all lessons with video rooms but missing tutor URLs
    const { data: lessonsWithRooms, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        tutor_id,
        lesson_space_space_id,
        tutor:tutors(id, first_name, last_name, email)
      `)
      .not('lesson_space_space_id', 'is', null)
      .gte('start_time', new Date().toISOString()); // Only future lessons

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
    }

    console.log(`📊 Found ${lessonsWithRooms?.length || 0} lessons with video rooms`);

    if (!lessonsWithRooms || lessonsWithRooms.length === 0) {
      return {
        success: true,
        processed: 0,
        backfilled: 0,
        message: 'No lessons with video rooms found'
      };
    }

    let backfilledCount = 0;
    const processed = lessonsWithRooms.length;

    for (const lesson of lessonsWithRooms) {
      try {
        // Check if tutor URL already exists
        const { data: existingUrl, error: urlCheckError } = await supabase
          .from('lesson_participant_urls')
          .select('id')
          .eq('lesson_id', lesson.id)
          .eq('participant_id', lesson.tutor_id)
          .eq('participant_type', 'tutor')
          .maybeSingle();

        if (urlCheckError && urlCheckError.code !== 'PGRST116') {
          console.error(`❌ Error checking URL for lesson ${lesson.id}:`, urlCheckError);
          continue;
        }

        if (existingUrl) {
          console.log(`✅ Tutor URL already exists for lesson ${lesson.id}`);
          continue;
        }

        // Generate missing tutor URL
        console.log(`🔧 Generating tutor URL for lesson ${lesson.id} (tutor: ${lesson.tutor?.first_name} ${lesson.tutor?.last_name})`);

        const { data: result, error: generateError } = await supabase.functions.invoke('lesson-space-integration', {
          body: {
            action: 'generate-tutor-url',
            lessonId: lesson.id,
            tutorId: lesson.tutor_id
          }
        });

        if (generateError) {
          console.error(`❌ Failed to generate tutor URL for lesson ${lesson.id}:`, generateError);
          continue;
        }

        if (!result?.success) {
          console.error(`❌ Generate tutor URL failed for lesson ${lesson.id}:`, result?.error);
          continue;
        }

        console.log(`✅ Successfully backfilled tutor URL for lesson ${lesson.id}`);
        backfilledCount++;

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing lesson ${lesson.id}:`, error);
        continue;
      }
    }

    const result = {
      success: true,
      processed,
      backfilled: backfilledCount,
      message: `Backfilled ${backfilledCount} missing tutor URLs out of ${processed} lessons processed`
    };

    console.log('🎉 Backfill completed:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in backfillMissingTutorUrls:', error);
    return {
      success: false,
      processed: 0,
      backfilled: 0,
      error: error.message,
      message: `Backfill failed: ${error.message}`
    };
  }
};

// Helper function to run backfill from browser console
export const runBackfillFromConsole = async () => {
  console.log('🚀 Starting tutor URL backfill from console...');
  const result = await backfillMissingTutorUrls();
  console.log('📋 Backfill result:', result);
  return result;
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).runBackfillFromConsole = runBackfillFromConsole;
}
