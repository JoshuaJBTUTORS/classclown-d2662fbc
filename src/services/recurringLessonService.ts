
import { supabase } from '@/integrations/supabase/client';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

interface RecurringLessonData {
  originalLessonId: string;
  title: string;
  description?: string;
  subject?: string;
  tutorId: string;
  startTime: Date;
  endTime: Date;
  isGroup: boolean;
  recurrenceInterval: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: Date;
  isInfinite?: boolean;
  selectedStudents: number[];
}

export const generateRecurringLessonInstances = async (data: RecurringLessonData) => {
  const {
    originalLessonId,
    title,
    description,
    subject,
    tutorId,
    startTime,
    endTime,
    isGroup,
    recurrenceInterval,
    recurrenceEndDate,
    isInfinite,
    selectedStudents
  } = data;

  // Fetch the original lesson to get room details
  const { data: originalLesson, error: originalLessonError } = await supabase
    .from('lessons')
    .select('lesson_space_room_id, lesson_space_room_url, lesson_space_space_id')
    .eq('id', originalLessonId)
    .single();

  if (originalLessonError) {
    console.error('Error fetching original lesson room details:', originalLessonError);
  }

  const instances = [];
  const lessonDuration = endTime.getTime() - startTime.getTime();
  
  // Extract time components from original lesson
  const startHour = startTime.getUTCHours();
  const startMinute = startTime.getUTCMinutes();
  
  // Generate first 20 instances or until end date (whichever comes first)
  let currentDate = new Date(startTime);
  let instanceCount = 0;
  const maxInstances = 20;
  
  // Calculate end date (3 months from start if infinite)
  const effectiveEndDate = isInfinite 
    ? addMonths(startTime, 3) 
    : recurrenceEndDate;

  while (instanceCount < maxInstances && currentDate <= (effectiveEndDate || new Date())) {
    // Move to next occurrence
    switch (recurrenceInterval) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
    }

    if (currentDate <= (effectiveEndDate || new Date())) {
      // Apply the original lesson's time-of-day to the new date
      const instanceStartTime = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        startHour,
        startMinute,
        0
      ));
      const instanceEndTime = new Date(instanceStartTime.getTime() + lessonDuration);
      
      instances.push({
        title,
        description: description || '',
        subject,
        tutor_id: tutorId,
        start_time: instanceStartTime.toISOString(),
        end_time: instanceEndTime.toISOString(),
        is_group: isGroup,
        status: 'scheduled',
        is_recurring: false,
        is_recurring_instance: true,
        parent_lesson_id: originalLessonId,
        instance_date: format(currentDate, 'yyyy-MM-dd'),
        recurrence_interval: null,
        recurrence_end_date: null,
        recurrence_day: null,
        // Inherit room details from original lesson
        lesson_space_room_id: originalLesson?.lesson_space_room_id || null,
        lesson_space_room_url: originalLesson?.lesson_space_room_url || null,
        lesson_space_space_id: originalLesson?.lesson_space_space_id || null,
      });

      instanceCount++;
    }
  }

  console.log(`Generated ${instances.length} recurring lesson instances with inherited room details`);

  // Insert all instances at once
  if (instances.length > 0) {
    const { data: insertedLessons, error: lessonsError } = await supabase
      .from('lessons')
      .insert(instances)
      .select('id');

    if (lessonsError) {
      throw new Error(`Failed to create lesson instances: ${lessonsError.message}`);
    }

    // Add students to all instances
    const lessonStudentsData = [];
    for (const lesson of insertedLessons) {
      for (const studentId of selectedStudents) {
        lessonStudentsData.push({
          lesson_id: lesson.id,
          student_id: studentId
        });
      }
    }

    if (lessonStudentsData.length > 0) {
      const { error: studentsError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentsData);

      if (studentsError) {
        throw new Error(`Failed to add students to lesson instances: ${studentsError.message}`);
      }
    }

    // Generate participant URLs for all new lesson instances
    await generateParticipantUrlsForInstances(insertedLessons, selectedStudents);

    // Create or update recurring lesson group record
    const nextGenerationDate = isInfinite 
      ? addMonths(startTime, 3)
      : null;

    const { error: groupError } = await supabase
      .from('recurring_lesson_groups')
      .insert({
        original_lesson_id: originalLessonId,
        group_name: `${title} - ${recurrenceInterval}`,
        recurrence_pattern: {
          interval: recurrenceInterval,
          endDate: recurrenceEndDate?.toISOString(),
          isInfinite: isInfinite || false
        },
        instances_generated_until: instances[instances.length - 1]?.start_time,
        total_instances_generated: instances.length,
        is_infinite: isInfinite || false,
        next_extension_date: nextGenerationDate?.toISOString()
      });

    if (groupError) {
      console.warn('Failed to create recurring lesson group record:', groupError);
      // Don't throw error as this is not critical for lesson creation
    }
  }

  return instances.length;
};

export const generateNextBatchOfInstances = async (originalLessonId: string, batchSize: number = 20) => {
  // Get the recurring group info
  const { data: recurringGroup, error: groupError } = await supabase
    .from('recurring_lesson_groups')
    .select('*')
    .eq('original_lesson_id', originalLessonId)
    .single();

  if (groupError || !recurringGroup) {
    throw new Error('Recurring group not found');
  }

  // Check if this recurring series is still active (has instances in last 3 weeks)
  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const lastGenerated = new Date(recurringGroup.instances_generated_until);

  // If last generation point is recent, check for instances
  if (lastGenerated >= threeWeeksAgo) {
    const { data: recentInstances, error: recentError } = await supabase
      .from('lessons')
      .select('id')
      .eq('parent_lesson_id', originalLessonId)
      .eq('is_recurring_instance', true)
      .gte('instance_date', threeWeeksAgo.toISOString())
      .limit(1);

    if (!recentError && (!recentInstances || recentInstances.length === 0)) {
      console.log('No instances in last 3 weeks - series appears cancelled, skipping generation');
      throw new Error('Recurring series appears to be cancelled - no recent instances found');
    }

    console.log('Series is active (found recent instances) - proceeding with generation');
  } else {
    console.log('Last generation was >3 weeks ago - assuming we\'re just behind on generation');
  }

  // Get the LAST INSTANCE to use as template (never the original)
  const { data: lastInstance, error: lastInstanceError } = await supabase
    .from('lessons')
    .select('*')
    .eq('parent_lesson_id', originalLessonId)
    .eq('is_recurring_instance', true)
    .order('instance_date', { ascending: false })
    .limit(1)
    .single();

  if (lastInstanceError || !lastInstance) {
    throw new Error('No last instance found - cannot generate next batch');
  }

  // Get students from the last instance (reflects current enrollment)
  const { data: lessonStudents, error: studentsError } = await supabase
    .from('lesson_students')
    .select('student_id')
    .eq('lesson_id', lastInstance.id);

  if (studentsError) {
    throw new Error('Failed to get lesson students');
  }

  const selectedStudents = lessonStudents.map(ls => ls.student_id);

  // Generate next batch starting from last generated date, using last instance's schedule
  const lastGeneratedDate = new Date(recurringGroup.instances_generated_until);
  const recurrencePattern = recurringGroup.recurrence_pattern as any;
  
  // Extract time-of-day from last instance
  const lastInstanceStart = new Date(lastInstance.start_time);
  const lastInstanceEnd = new Date(lastInstance.end_time);
  
  const data: RecurringLessonData = {
    originalLessonId,
    title: lastInstance.title,
    description: lastInstance.description,
    subject: lastInstance.subject,
    tutorId: lastInstance.tutor_id,
    startTime: lastGeneratedDate,
    endTime: new Date(lastGeneratedDate.getTime() + (lastInstanceEnd.getTime() - lastInstanceStart.getTime())),
    isGroup: lastInstance.is_group,
    recurrenceInterval: lastInstance.recurrence_interval as any,
    recurrenceEndDate: recurrencePattern.endDate ? new Date(recurrencePattern.endDate) : undefined,
    isInfinite: recurrencePattern.isInfinite,
    selectedStudents
  };

  return await generateRecurringLessonInstances(data);
};

/**
 * Generate participant URLs for recurring lesson instances
 */
const generateParticipantUrlsForInstances = async (
  insertedLessons: { id: string }[], 
  selectedStudents: number[]
) => {
  console.log(`Generating participant URLs for ${insertedLessons.length} recurring lesson instances`);
  
  let successCount = 0;
  let failureCount = 0;

  for (const lesson of insertedLessons) {
    try {
      // Call lesson-space-integration to create room and generate participant URLs
      const { error: integrationError } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          lessonId: lesson.id
        }
      });

      if (integrationError) {
        console.error(`Failed to generate URLs for lesson ${lesson.id}:`, integrationError);
        failureCount++;
      } else {
        console.log(`✅ Generated participant URLs for lesson ${lesson.id}`);
        successCount++;
      }
    } catch (error) {
      console.error(`Error generating URLs for lesson ${lesson.id}:`, error);
      failureCount++;
    }
  }

  console.log(`Participant URL generation complete: ${successCount} success, ${failureCount} failures`);
  
  if (failureCount > 0) {
    console.warn(`⚠️ ${failureCount} lesson instances failed to generate participant URLs. These will need to be regenerated manually.`);
  }
};

/**
 * Utility function to backfill missing participant URLs for existing recurring lessons
 */
export const backfillMissingParticipantUrls = async () => {
  console.log('🔍 Scanning for recurring lessons with missing participant URLs...');
  
  // Find lesson instances that have room details but no participant URLs
  const { data: lessonsWithoutUrls, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      is_recurring_instance,
      lesson_space_room_id,
      lesson_students!inner(student_id)
    `)
    .eq('is_recurring_instance', true)
    .not('lesson_space_room_id', 'is', null)
    .not('lesson_space_room_id', 'eq', '');

  if (error) {
    console.error('Error fetching lessons without URLs:', error);
    return { success: false, error: error.message };
  }

  if (!lessonsWithoutUrls || lessonsWithoutUrls.length === 0) {
    console.log('✅ No lessons found with missing participant URLs');
    return { success: true, processed: 0 };
  }

  // Check which ones actually need URL generation
  const lessonsNeedingUrls = [];
  for (const lesson of lessonsWithoutUrls) {
    const { data: existingUrls } = await supabase
      .from('lesson_participant_urls')
      .select('id')
      .eq('lesson_id', lesson.id)
      .limit(1);

    if (!existingUrls || existingUrls.length === 0) {
      lessonsNeedingUrls.push(lesson);
    }
  }

  console.log(`Found ${lessonsNeedingUrls.length} lessons needing participant URL generation`);

  let processedCount = 0;
  for (const lesson of lessonsNeedingUrls) {
    try {
      const studentIds = lesson.lesson_students.map((ls: any) => ls.student_id);
      
      const { data: roomData, error: integrationError } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          lessonId: lesson.id
        }
      });

      if (integrationError) {
        console.error(`Failed to backfill URLs for lesson ${lesson.id} - invoke error`);
        console.error(`Error object:`, JSON.stringify(integrationError));
        console.error(`Message: ${integrationError.message}, Status: ${integrationError.status}`);
      } else if (roomData && !roomData.success) {
        console.error(`Failed to backfill URLs for lesson ${lesson.id} - structured error`);
        console.error(`rid: ${roomData.rid}, stage: ${roomData.stage}, external_status: ${roomData.external_status}`);
        console.error(`external_body: ${roomData.external_body || 'N/A'}`);
        console.error(`error: ${roomData.error}`);
      } else {
        console.log(`✅ Backfilled participant URLs for lesson: ${lesson.title} | rid: ${roomData?.rid || 'N/A'}`);
        processedCount++;
      }
    } catch (error) {
      console.error(`Error backfilling lesson ${lesson.id}:`, error);
    }
  }

  console.log(`Backfill complete: ${processedCount}/${lessonsNeedingUrls.length} lessons processed`);
  return { success: true, processed: processedCount, total: lessonsNeedingUrls.length };
};
