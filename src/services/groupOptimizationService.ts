import { supabase } from '@/integrations/supabase/client';

export interface StudentConflict {
  studentId: number;
  studentName: string;
  conflictingLessonId: string;
  conflictingLessonTitle: string;
  conflictTime: string;
}

export interface MergeOpportunity {
  targetLesson: {
    id: string;
    title: string;
    subject: string;
    startTime: string;
    endTime: string;
    tutor: { id: string; name: string };
    currentStudents: number;
    maxCapacity: number;
    studentNames: string[];
  };
  studentConflicts: StudentConflict[];
  canMerge: boolean;
  availableSpots: number;
}

export interface AlternativeSlot {
  dayOfWeek: string;
  date: string;
  startTime: string;
  endTime: string;
  tutor: { id: string; name: string };
  existingGroupAtTime?: {
    lessonId: string;
    title: string;
    currentStudents: number;
    studentNames: string[];
  };
  conflicts: StudentConflict[];
  isNewSlot: boolean;
}

export interface LessonDetails {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  tutor: { id: string; name: string };
  students: { id: number; name: string }[];
}

export interface GroupOptimizationResult {
  currentLesson: LessonDetails;
  mergeOpportunities: MergeOpportunity[];
  alternativeSlots: AlternativeSlot[];
  recommendations: string[];
}

const MAX_GROUP_CAPACITY = 6;
const LOOKAHEAD_WEEKS = 4;

/**
 * Find all group lessons with the same subject that have room for more students
 */
async function findExistingGroupsForSubject(
  subject: string,
  excludeLessonId: string,
  dateRange: { start: Date; end: Date }
): Promise<MergeOpportunity['targetLesson'][]> {
  // Extract core subject from title (e.g., "GCSE Physics Group" -> "Physics")
  const subjectKeywords = extractSubjectKeywords(subject);
  
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      subject,
      start_time,
      end_time,
      tutor_id,
      tutors!inner(id, first_name, last_name),
      lesson_students(
        student_id,
        students(id, first_name, last_name)
      )
    `)
    .eq('is_group', true)
    .eq('status', 'scheduled')
    .gte('start_time', dateRange.start.toISOString())
    .lte('start_time', dateRange.end.toISOString())
    .neq('id', excludeLessonId);

  if (error) {
    console.error('Error fetching existing groups:', error);
    return [];
  }

  // Filter by subject match and capacity
  const matchingGroups = (lessons || [])
    .filter(lesson => {
      const lessonSubject = (lesson.subject || lesson.title || '').toLowerCase();
      return subjectKeywords.some(keyword => lessonSubject.includes(keyword.toLowerCase()));
    })
    .filter(lesson => {
      const studentCount = lesson.lesson_students?.length || 0;
      return studentCount < MAX_GROUP_CAPACITY;
    })
    .map(lesson => {
      const tutor = lesson.tutors as any;
      const students = lesson.lesson_students || [];
      return {
        id: lesson.id,
        title: lesson.title,
        subject: lesson.subject || '',
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        tutor: {
          id: tutor?.id || lesson.tutor_id,
          name: `${tutor?.first_name || ''} ${tutor?.last_name || ''}`.trim()
        },
        currentStudents: students.length,
        maxCapacity: MAX_GROUP_CAPACITY,
        studentNames: students.map((ls: any) => 
          `${ls.students?.first_name || ''} ${ls.students?.last_name || ''}`.trim()
        )
      };
    });

  return matchingGroups;
}

/**
 * Check if students have conflicts at a given time
 */
async function checkStudentConflicts(
  studentIds: number[],
  targetStartTime: string,
  targetEndTime: string,
  excludeLessonId?: string
): Promise<StudentConflict[]> {
  const conflicts: StudentConflict[] = [];
  
  for (const studentId of studentIds) {
    const { data: studentLessons, error } = await supabase
      .from('lesson_students')
      .select(`
        lesson_id,
        lessons!inner(id, title, start_time, end_time, status),
        students!inner(id, first_name, last_name)
      `)
      .eq('student_id', studentId);

    if (error) {
      console.error('Error checking student conflicts:', error);
      continue;
    }

    const targetStart = new Date(targetStartTime);
    const targetEnd = new Date(targetEndTime);

    for (const sl of studentLessons || []) {
      const lesson = sl.lessons as any;
      if (lesson.status !== 'scheduled') continue;
      if (excludeLessonId && lesson.id === excludeLessonId) continue;

      const lessonStart = new Date(lesson.start_time);
      const lessonEnd = new Date(lesson.end_time);

      // Check for time overlap
      if (lessonStart < targetEnd && lessonEnd > targetStart) {
        const student = sl.students as any;
        conflicts.push({
          studentId,
          studentName: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
          conflictingLessonId: lesson.id,
          conflictingLessonTitle: lesson.title,
          conflictTime: lesson.start_time
        });
      }
    }
  }

  return conflicts;
}

/**
 * Find alternative time slots from tutors who teach this subject
 */
async function findAlternativeTimeSlots(
  subject: string,
  studentIds: number[],
  currentLessonId: string,
  dateRange: { start: Date; end: Date }
): Promise<AlternativeSlot[]> {
  const subjectKeywords = extractSubjectKeywords(subject);
  
  // Get tutors who teach this subject
  const { data: tutorSubjects, error: tsError } = await supabase
    .from('tutor_subjects')
    .select(`
      tutor_id,
      subjects!inner(id, name),
      tutors!inner(id, first_name, last_name, status)
    `);

  if (tsError) {
    console.error('Error fetching tutor subjects:', tsError);
    return [];
  }

  // Filter to tutors who teach matching subjects
  const relevantTutors = (tutorSubjects || [])
    .filter(ts => {
      const subjectName = (ts.subjects as any)?.name || '';
      const tutor = ts.tutors as any;
      return tutor?.status === 'active' && 
        subjectKeywords.some(keyword => subjectName.toLowerCase().includes(keyword.toLowerCase()));
    })
    .map(ts => ({
      id: ts.tutor_id,
      name: `${(ts.tutors as any)?.first_name || ''} ${(ts.tutors as any)?.last_name || ''}`.trim()
    }));

  // Remove duplicates
  const uniqueTutors = Array.from(new Map(relevantTutors.map(t => [t.id, t])).values());

  if (uniqueTutors.length === 0) {
    return [];
  }

  // Get tutor availability
  const tutorIds = uniqueTutors.map(t => t.id);
  const { data: availability, error: avError } = await supabase
    .from('tutor_availability')
    .select('*')
    .in('tutor_id', tutorIds);

  if (avError) {
    console.error('Error fetching tutor availability:', avError);
    return [];
  }

  // Get existing lessons for these tutors in date range
  const { data: existingLessons, error: elError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      start_time,
      end_time,
      tutor_id,
      is_group,
      lesson_students(
        student_id,
        students(id, first_name, last_name)
      )
    `)
    .in('tutor_id', tutorIds)
    .eq('status', 'scheduled')
    .gte('start_time', dateRange.start.toISOString())
    .lte('start_time', dateRange.end.toISOString());

  if (elError) {
    console.error('Error fetching existing lessons:', elError);
  }

  const alternativeSlots: AlternativeSlot[] = [];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Generate slots for each day in range
  const currentDate = new Date(dateRange.start);
  while (currentDate <= dateRange.end) {
    const dayName = daysOfWeek[currentDate.getDay()];
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const tutor of uniqueTutors) {
      // Find availability for this tutor on this day
      const tutorAvail = (availability || []).filter(
        a => a.tutor_id === tutor.id && a.day_of_week === dayName
      );

      for (const slot of tutorAvail) {
        const slotStartTime = `${dateStr}T${slot.start_time}`;
        const slotEndTime = `${dateStr}T${slot.end_time}`;

        // Check if there's an existing group lesson at this time
        const existingGroup = (existingLessons || []).find(l => {
          if (l.tutor_id !== tutor.id) return false;
          if (l.id === currentLessonId) return false;
          
          const lessonDate = l.start_time.split('T')[0];
          if (lessonDate !== dateStr) return false;

          // Check if same time slot (within 30 min window)
          const lessonTime = l.start_time.split('T')[1]?.substring(0, 5);
          const slotTime = slot.start_time.substring(0, 5);
          return lessonTime === slotTime;
        });

        // Check student conflicts
        const conflicts = await checkStudentConflicts(
          studentIds,
          slotStartTime,
          slotEndTime,
          currentLessonId
        );

        // Only include if no conflicts or if joining existing group with space
        if (conflicts.length === 0 || (existingGroup?.is_group && (existingGroup.lesson_students?.length || 0) < MAX_GROUP_CAPACITY)) {
          const existingGroupInfo = existingGroup ? {
            lessonId: existingGroup.id,
            title: existingGroup.title,
            currentStudents: existingGroup.lesson_students?.length || 0,
            studentNames: (existingGroup.lesson_students || []).map((ls: any) =>
              `${ls.students?.first_name || ''} ${ls.students?.last_name || ''}`.trim()
            )
          } : undefined;

          // Check if this matches the subject we're looking for
          const isSubjectMatch = existingGroup ? 
            subjectKeywords.some(keyword => 
              (existingGroup.title || '').toLowerCase().includes(keyword.toLowerCase())
            ) : true;

          if (isSubjectMatch || !existingGroup) {
            alternativeSlots.push({
              dayOfWeek: dayName,
              date: dateStr,
              startTime: slot.start_time,
              endTime: slot.end_time,
              tutor,
              existingGroupAtTime: existingGroupInfo,
              conflicts,
              isNewSlot: !existingGroup
            });
          }
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort: existing groups first, then by date
  return alternativeSlots.sort((a, b) => {
    if (a.existingGroupAtTime && !b.existingGroupAtTime) return -1;
    if (!a.existingGroupAtTime && b.existingGroupAtTime) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

/**
 * Generate human-readable recommendations
 */
function generateRecommendations(
  currentLesson: LessonDetails,
  mergeOpportunities: MergeOpportunity[],
  alternativeSlots: AlternativeSlot[]
): string[] {
  const recommendations: string[] = [];
  const studentNames = currentLesson.students.map(s => s.name).join(', ');

  // Best merge opportunities
  const viableMerges = mergeOpportunities.filter(m => m.canMerge && m.availableSpots > 0);
  if (viableMerges.length > 0) {
    const best = viableMerges[0];
    const date = new Date(best.targetLesson.startTime);
    const dayTime = `${date.toLocaleDateString('en-GB', { weekday: 'long' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    recommendations.push(
      `✅ BEST: Move ${studentNames} to ${dayTime} group with ${best.targetLesson.tutor.name} (joins ${best.targetLesson.currentStudents} students)`
    );
  }

  // Existing groups they could join
  const slotsWithGroups = alternativeSlots.filter(s => s.existingGroupAtTime && s.conflicts.length === 0);
  if (slotsWithGroups.length > 0 && viableMerges.length === 0) {
    const slot = slotsWithGroups[0];
    recommendations.push(
      `📅 Could join ${slot.existingGroupAtTime!.title} on ${slot.dayOfWeek} ${slot.startTime} with ${slot.tutor.name} (${slot.existingGroupAtTime!.currentStudents} students)`
    );
  }

  // New slot options
  const newSlots = alternativeSlots.filter(s => !s.existingGroupAtTime && s.conflicts.length === 0);
  if (newSlots.length > 0) {
    const uniqueDays = [...new Set(newSlots.slice(0, 3).map(s => `${s.dayOfWeek} ${s.startTime}`))];
    recommendations.push(
      `🕐 Alternative time slots available: ${uniqueDays.join(', ')}`
    );
  }

  // Conflict warnings
  const conflictingMerges = mergeOpportunities.filter(m => !m.canMerge);
  if (conflictingMerges.length > 0) {
    recommendations.push(
      `⚠️ ${conflictingMerges.length} potential merge(s) blocked by student schedule conflicts`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('ℹ️ No immediate optimization opportunities found. Consider expanding search range.');
  }

  return recommendations;
}

/**
 * Extract subject keywords from a lesson title/subject
 */
function extractSubjectKeywords(subject: string): string[] {
  const normalized = subject.toLowerCase();
  const keywords: string[] = [];

  // Core subject extraction
  const coreSubjects = ['physics', 'chemistry', 'biology', 'maths', 'math', 'english', 'science', 'history', 'geography'];
  for (const core of coreSubjects) {
    if (normalized.includes(core)) {
      keywords.push(core);
    }
  }

  // Level extraction
  const levels = ['gcse', 'a-level', 'alevel', 'ks3', 'ks2', '11+', '11 plus'];
  for (const level of levels) {
    if (normalized.includes(level)) {
      keywords.push(level);
    }
  }

  // If no keywords found, use original
  if (keywords.length === 0) {
    keywords.push(subject);
  }

  return keywords;
}

/**
 * Main function: Find optimization opportunities for a lesson
 */
export async function findGroupOptimizations(
  lessonId: string
): Promise<GroupOptimizationResult | null> {
  // Get current lesson details
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      subject,
      start_time,
      end_time,
      tutor_id,
      tutors!inner(id, first_name, last_name),
      lesson_students(
        student_id,
        students!inner(id, first_name, last_name)
      )
    `)
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson) {
    console.error('Error fetching lesson:', lessonError);
    return null;
  }

  const tutor = lesson.tutors as any;
  const students = (lesson.lesson_students || []).map((ls: any) => ({
    id: ls.student_id,
    name: `${ls.students?.first_name || ''} ${ls.students?.last_name || ''}`.trim()
  }));

  const currentLesson: LessonDetails = {
    id: lesson.id,
    title: lesson.title,
    subject: lesson.subject || lesson.title,
    startTime: lesson.start_time,
    endTime: lesson.end_time,
    tutor: {
      id: tutor?.id || lesson.tutor_id,
      name: `${tutor?.first_name || ''} ${tutor?.last_name || ''}`.trim()
    },
    students
  };

  const studentIds = students.map(s => s.id);
  const subjectToSearch = lesson.subject || lesson.title;

  // Date range: next 4 weeks
  const dateRange = {
    start: new Date(),
    end: new Date(Date.now() + LOOKAHEAD_WEEKS * 7 * 24 * 60 * 60 * 1000)
  };

  // Find existing groups with same subject
  const existingGroups = await findExistingGroupsForSubject(
    subjectToSearch,
    lessonId,
    dateRange
  );

  // Check merge viability for each group
  const mergeOpportunities: MergeOpportunity[] = [];
  for (const group of existingGroups) {
    const conflicts = await checkStudentConflicts(
      studentIds,
      group.startTime,
      group.endTime,
      lessonId
    );

    const availableSpots = group.maxCapacity - group.currentStudents;
    const canMerge = conflicts.length === 0 && availableSpots >= students.length;

    mergeOpportunities.push({
      targetLesson: group,
      studentConflicts: conflicts,
      canMerge,
      availableSpots
    });
  }

  // Sort by viability and date
  mergeOpportunities.sort((a, b) => {
    if (a.canMerge && !b.canMerge) return -1;
    if (!a.canMerge && b.canMerge) return 1;
    return new Date(a.targetLesson.startTime).getTime() - new Date(b.targetLesson.startTime).getTime();
  });

  // Find alternative time slots
  const alternativeSlots = await findAlternativeTimeSlots(
    subjectToSearch,
    studentIds,
    lessonId,
    dateRange
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    currentLesson,
    mergeOpportunities,
    alternativeSlots.slice(0, 10) // Limit for performance
  );

  return {
    currentLesson,
    mergeOpportunities: mergeOpportunities.slice(0, 10),
    alternativeSlots: alternativeSlots.slice(0, 20),
    recommendations
  };
}

/**
 * Batch optimization: Find opportunities for multiple lessons
 */
export async function findBatchOptimizations(
  lessonIds: string[]
): Promise<Map<string, GroupOptimizationResult>> {
  const results = new Map<string, GroupOptimizationResult>();

  for (const lessonId of lessonIds) {
    const result = await findGroupOptimizations(lessonId);
    if (result) {
      results.set(lessonId, result);
    }
  }

  return results;
}
