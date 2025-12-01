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

export interface BulkOptimizationResult {
  lessonId: string;
  lessonTitle: string;
  subject: string;
  dateTime: string;
  tutor: string;
  tutorId: string;
  currentStudents: string[];
  studentCount: number;
  mergeOpportunities: {
    targetLessonId: string;
    targetLesson: string;
    targetDateTime: string;
    targetTutor: string;
    currentSize: number;
    canMerge: boolean;
    conflicts: string[];
  }[];
  recommendation: string;
  potentialSavings: number; // £12.50 if 1-student group can be eliminated
}

const MAX_GROUP_CAPACITY = 6;
const LOOKAHEAD_WEEKS = 4;

/**
 * Extract subject keywords from a lesson title/subject
 */
function extractSubjectKeywords(subject: string): string[] {
  const normalized = subject.toLowerCase();
  const keywords: string[] = [];

  const coreSubjects = ['physics', 'chemistry', 'biology', 'maths', 'math', 'english', 'science', 'history', 'geography'];
  for (const core of coreSubjects) {
    if (normalized.includes(core)) {
      keywords.push(core);
    }
  }

  const levels = ['gcse', 'a-level', 'alevel', 'ks3', 'ks2', '11+', '11 plus'];
  for (const level of levels) {
    if (normalized.includes(level)) {
      keywords.push(level);
    }
  }

  if (keywords.length === 0) {
    keywords.push(subject);
  }

  return keywords;
}

/**
 * Check if two time ranges overlap
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 < e2 && e1 > s2;
}

/**
 * Check if a lesson subject matches the target subject
 */
function matchesSubject(lesson: any, targetSubject: string): boolean {
  const lessonSubject = (lesson.subject || lesson.title || '').toLowerCase();
  const keywords = extractSubjectKeywords(targetSubject);
  // ALL keywords must match (e.g., "KS3 English" requires both 'ks3' AND 'english')
  return keywords.every(keyword => lessonSubject.includes(keyword.toLowerCase()));
}

/**
 * Analyze ALL underfilled group lessons at once - OPTIMIZED VERSION
 * Uses only 3 database queries and processes everything in-memory
 */
export async function analyzeAllUnderfilled(): Promise<BulkOptimizationResult[]> {
  const results: BulkOptimizationResult[] = [];

  // Date range for next 4 weeks
  const dateRange = {
    start: new Date(),
    end: new Date(Date.now() + LOOKAHEAD_WEEKS * 7 * 24 * 60 * 60 * 1000)
  };

  // QUERY 1: Fetch ALL group lessons (both underfilled and potential targets)
  const { data: allGroupLessons, error: lessonsError } = await supabase
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
    .eq('is_group', true)
    .eq('status', 'scheduled')
    .gte('start_time', dateRange.start.toISOString())
    .lte('start_time', dateRange.end.toISOString());

  if (lessonsError || !allGroupLessons) {
    console.error('Error fetching group lessons:', lessonsError);
    return [];
  }

  // Filter to find underfilled lessons (1-2 students)
  const underfilledLessons = allGroupLessons.filter(lesson => {
    const studentCount = lesson.lesson_students?.length || 0;
    return studentCount >= 1 && studentCount <= 2;
  });

  if (underfilledLessons.length === 0) {
    return [];
  }

  // Collect all student IDs from underfilled lessons
  const allStudentIds = [...new Set(
    underfilledLessons.flatMap(l => (l.lesson_students || []).map((ls: any) => ls.student_id))
  )];

  // QUERY 2: Fetch ALL lessons for these students (for conflict checking)
  const { data: allStudentLessons, error: studentLessonsError } = await supabase
    .from('lesson_students')
    .select(`
      student_id,
      lessons!inner(id, title, start_time, end_time, status)
    `)
    .in('student_id', allStudentIds)
    .eq('lessons.status', 'scheduled');

  if (studentLessonsError) {
    console.error('Error fetching student lessons:', studentLessonsError);
    return [];
  }

  // Build student lessons lookup map for fast in-memory conflict checking
  const studentLessonsMap = new Map<number, any[]>();
  (allStudentLessons || []).forEach(sl => {
    if (!studentLessonsMap.has(sl.student_id)) {
      studentLessonsMap.set(sl.student_id, []);
    }
    studentLessonsMap.get(sl.student_id)!.push(sl.lessons);
  });

  // PROCESS: Now process everything in-memory (NO MORE DB CALLS!)
  for (const lesson of underfilledLessons) {
    const tutor = lesson.tutors as any;
    const students = (lesson.lesson_students || []).map((ls: any) => ({
      id: ls.student_id,
      name: `${ls.students?.first_name || ''} ${ls.students?.last_name || ''}`.trim()
    }));
    const studentIds = students.map(s => s.id);
    const subjectToSearch = lesson.subject || lesson.title;

    // Find potential target groups (same subject, has space, not the same lesson)
    const potentialTargets = allGroupLessons.filter(target => {
      if (target.id === lesson.id) return false; // Skip same lesson
      if (!matchesSubject(target, subjectToSearch)) return false; // Different subject
      const targetSize = target.lesson_students?.length || 0;
      return targetSize < MAX_GROUP_CAPACITY; // Has space
    });

    // Check conflicts for each target IN-MEMORY
    const mergeOpps: BulkOptimizationResult['mergeOpportunities'] = [];
    for (const target of potentialTargets) {
      // Check student conflicts in-memory
      const conflicts: string[] = [];
      for (const studentId of studentIds) {
        const studentLessons = studentLessonsMap.get(studentId) || [];
        for (const stdLesson of studentLessons) {
          if (stdLesson.id === lesson.id || stdLesson.id === target.id) continue;
          
          // Check time overlap
          if (timesOverlap(stdLesson.start_time, stdLesson.end_time, target.start_time, target.end_time)) {
            const student = students.find(s => s.id === studentId);
            if (student) {
              conflicts.push(student.name);
            }
          }
        }
      }

      const targetTutor = target.tutors as any;
      const targetSize = target.lesson_students?.length || 0;
      const availableSpots = MAX_GROUP_CAPACITY - targetSize;
      const canMerge = conflicts.length === 0 && availableSpots >= students.length;

      mergeOpps.push({
        targetLessonId: target.id,
        targetLesson: target.title,
        targetDateTime: target.start_time,
        targetTutor: `${targetTutor?.first_name || ''} ${targetTutor?.last_name || ''}`.trim(),
        currentSize: targetSize,
        canMerge,
        conflicts: [...new Set(conflicts)] // Remove duplicates
      });
    }

    // Sort merge opportunities: 
    // Priority 1: 1-student merging into 2-student (creates 3-student, meets goal)
    // Priority 2: Any viable merge
    // Priority 3: By date
    mergeOpps.sort((a, b) => {
      const aIsOptimal = students.length === 1 && a.currentSize === 2 && a.canMerge;
      const bIsOptimal = students.length === 1 && b.currentSize === 2 && b.canMerge;
      
      if (aIsOptimal && !bIsOptimal) return -1;
      if (!aIsOptimal && bIsOptimal) return 1;
      if (a.canMerge && !b.canMerge) return -1;
      if (!a.canMerge && b.canMerge) return 1;
      return new Date(a.targetDateTime).getTime() - new Date(b.targetDateTime).getTime();
    });

    // Generate recommendation and calculate savings
    let recommendation = '';
    let potentialSavings = 0;
    const viableMerge = mergeOpps.find(m => m.canMerge);
    
    if (viableMerge) {
      const date = new Date(viableMerge.targetDateTime);
      const willCreate3Plus = students.length === 1 && viableMerge.currentSize === 2;
      
      // Calculate savings for 1-student groups that can be eliminated
      if (students.length === 1) {
        potentialSavings = 12.50;
      }
      
      if (willCreate3Plus) {
        recommendation = `✅ OPTIMAL: Merge into ${viableMerge.targetLesson} (${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}) with ${viableMerge.targetTutor} - creates 3-student group (saves £12.50)`;
      } else {
        recommendation = `✅ Merge into ${viableMerge.targetLesson} (${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}) with ${viableMerge.targetTutor} - ${viableMerge.currentSize} students${students.length === 1 ? ' (saves £12.50)' : ''}`;
      }
    } else if (mergeOpps.length > 0) {
      recommendation = `⚠️ ${mergeOpps.length} potential merge(s) blocked by student conflicts`;
    } else {
      recommendation = 'ℹ️ No alternative groups found for this subject';
    }

    results.push({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      subject: lesson.subject || '',
      dateTime: lesson.start_time,
      tutor: `${tutor?.first_name || ''} ${tutor?.last_name || ''}`.trim(),
      tutorId: tutor?.id || lesson.tutor_id,
      currentStudents: students.map(s => s.name),
      studentCount: students.length,
      mergeOpportunities: mergeOpps.slice(0, 5), // Top 5 opportunities
      recommendation,
      potentialSavings
    });
  }

  // Sort results: 1-student groups first, then by date
  results.sort((a, b) => {
    if (a.studentCount !== b.studentCount) return a.studentCount - b.studentCount;
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });

  return results;
}
