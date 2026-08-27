import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen } from 'lucide-react';
import LessonSummaryCard from '@/components/learningHub/LessonSummaryCard';
import { LessonSummariesHero } from '@/components/lessonPlans/LessonSummariesHero';
import { parseISO, subDays } from 'date-fns';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  start_time: string;
  end_time: string;
  lesson_space_session_id?: string;
  lesson_space_recording_url?: string;
  tutor: {
    first_name: string;
    last_name: string;
  };
  lesson_students: Array<{
    student: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
}

const LessonSummaries: React.FC = () => {
  const { user, isAdmin, isOwner, isTutor, isParent, isStudent } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('last-30-days');
  const [studentFilter, setStudentFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const isTeacherRole = isTutor || isAdmin || isOwner;

  useEffect(() => {
    fetchLessons();
  }, [user]);

  useEffect(() => {
    applyFilters();
    setPage(1);
  }, [lessons, searchTerm, subjectFilter, dateFilter, studentFilter]);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      let query;
      
      if (isOwner || isAdmin) {
        // Owners and admins can see ALL lessons with recordings
        query = supabase
          .from('lessons')
          .select(`
            id,
            title,
            subject,
            start_time,
            end_time,
            lesson_space_session_id,
            lesson_space_recording_url,
            tutor:tutors!inner(first_name, last_name),
            lesson_students(
              student:students(id, first_name, last_name, email)
            )
          `)
          .not('lesson_space_session_id', 'is', null)
          .order('start_time', { ascending: false });

      } else if (isTutor) {
        // Tutors can only see their own lessons with recordings
        const { data: tutorData, error: tutorError } = await supabase
          .from('tutors')
          .select('id')
          .ilike('email', user?.email)
          .maybeSingle();

        if (tutorError) {
          console.error('Error fetching tutor data:', tutorError);
          toast.error('Failed to load tutor data');
          setIsLoading(false);
          return;
        }

        if (!tutorData) {
          console.log('No tutor record found for email:', user?.email);
          setLessons([]);
          setIsLoading(false);
          return;
        }

        query = supabase
          .from('lessons')
          .select(`
            id,
            title,
            subject,
            start_time,
            end_time,
            lesson_space_session_id,
            lesson_space_recording_url,
            tutor:tutors!inner(first_name, last_name),
            lesson_students(
              student:students(id, first_name, last_name, email)
            )
          `)
          .not('lesson_space_session_id', 'is', null)
          .eq('tutor_id', tutorData.id)
          .order('start_time', { ascending: false });

      } else if (isParent) {
        // For parents, first get the parent record using email (like calendar does)
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('id')
          .eq('email', user?.email)
          .maybeSingle();

        if (parentError) {
          console.error('Error fetching parent data:', parentError);
          toast.error('Failed to load parent data');
          setIsLoading(false);
          return;
        }

        if (!parentData) {
          console.log('No parent record found for email:', user?.email);
          setLessons([]);
          setIsLoading(false);
          return;
        }

        // Get all students linked to this parent
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', parentData.id);

        if (studentError) {
          console.error('Error fetching parent\'s students:', studentError);
          toast.error('Failed to load student data');
          setIsLoading(false);
          return;
        }

        if (!studentData || studentData.length === 0) {
          console.log('No students found for parent:', parentData.id);
          setLessons([]);
          setIsLoading(false);
          return;
        }

        const studentIds = studentData.map(s => s.id);

        query = supabase
          .from('lessons')
          .select(`
            id,
            title,
            subject,
            start_time,
            end_time,
            lesson_space_session_id,
            lesson_space_recording_url,
            tutor:tutors!inner(first_name, last_name),
            lesson_students!inner(
              student:students(id, first_name, last_name, email)
            )
          `)
          .not('lesson_space_session_id', 'is', null)
          .in('lesson_students.student_id', studentIds)
          .order('start_time', { ascending: false });

      } else if (isStudent) {
        // Students can only see lessons they are enrolled in
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('email', user?.email)
          .maybeSingle();

        if (studentError) {
          console.error('Error fetching student data:', studentError);
          toast.error('Failed to load student data');
          setIsLoading(false);
          return;
        }

        if (!studentData) {
          console.log('No student record found for email:', user?.email);
          setLessons([]);
          setIsLoading(false);
          return;
        }

        query = supabase
          .from('lessons')
          .select(`
            id,
            title,
            subject,
            start_time,
            end_time,
            lesson_space_session_id,
            lesson_space_recording_url,
            tutor:tutors!inner(first_name, last_name),
            lesson_students!inner(
              student:students(id, first_name, last_name, email)
            )
          `)
          .not('lesson_space_session_id', 'is', null)
          .eq('lesson_students.student_id', studentData.id)
          .order('start_time', { ascending: false });
      } else {
        // No valid role - show no lessons
        setLessons([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching lessons:', error);
        return;
      }

      // Filter out lessons without valid student data, and any lesson that
      // has not finished yet — a future lesson can never have a real summary.
      const nowMs = Date.now();
      const validLessons = data?.filter(lesson => {
        if (!lesson.lesson_students || lesson.lesson_students.length === 0) return false;
        const endsAt = lesson.end_time ? Date.parse(lesson.end_time) : Date.parse(lesson.start_time);
        return Number.isFinite(endsAt) && endsAt <= nowMs;
      }) || [];

      setLessons(validLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = lessons;

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let dateThreshold: Date;

      switch (dateFilter) {
        case 'last-7-days':
          dateThreshold = subDays(now, 7);
          break;
        case 'last-30-days':
          dateThreshold = subDays(now, 30);
          break;
        case 'last-90-days':
          dateThreshold = subDays(now, 90);
          break;
        default:
          dateThreshold = new Date(0); // No filter
      }

      filtered = filtered.filter(lesson => 
        parseISO(lesson.start_time) >= dateThreshold
      );
    }

    // Apply subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(lesson => 
        lesson.subject?.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }

    // Apply student filter
    if (studentFilter !== 'all') {
      filtered = filtered.filter(lesson =>
        lesson.lesson_students?.some(ls => String(ls.student?.id) === studentFilter)
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${lesson.tutor.first_name} ${lesson.tutor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLessons(filtered);
  };

  const getUniqueSubjects = () => {
    const subjects = lessons
      .map(lesson => lesson.subject)
      .filter(Boolean)
      .filter((subject, index, array) => array.indexOf(subject) === index)
      .sort();
    return subjects;
  };

  const studentOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    lessons.forEach(lesson => {
      lesson.lesson_students?.forEach(ls => {
        const student = ls.student;
        if (!student?.id) return;
        const name = `${student.first_name || ''} ${student.last_name || ''}`.trim();
        if (name) map.set(String(student.id), name);
      });
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [lessons]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLessons = filteredLessons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <MobileMenuButton toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-auto">
            <div className="w-full space-y-8 p-4 md:p-6">
              <LessonSummariesHero
                searchTerm=""
                onSearchChange={() => {}}
                subjectFilter="all"
                onSubjectFilterChange={() => {}}
                dateFilter="last-30-days"
                onDateFilterChange={() => {}}
                onRefresh={() => {}}
                uniqueSubjects={[]}
                totalLessons={0}
                filteredCount={0}
              />
              <div className="grid gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-[1.5rem] bg-card p-6 shadow-[var(--shadow-soft)]"
                  >
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 w-3/4 rounded-full bg-muted" />
                      <div className="aspect-video rounded-[1.25rem] bg-muted" />
                      <div className="space-y-2">
                        <div className="h-3 rounded-full bg-muted" />
                        <div className="h-3 w-2/3 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto">
          <div className="flex min-h-full w-full flex-col gap-8 p-4 pb-12 md:p-6 md:pb-12">
            <LessonSummariesHero
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={setSubjectFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              studentFilter={studentFilter}
              onStudentFilterChange={setStudentFilter}
              students={studentOptions}
              onRefresh={fetchLessons}
              uniqueSubjects={getUniqueSubjects()}
              totalLessons={lessons.length}
              filteredCount={filteredLessons.length}
            />

            {filteredLessons.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[1.5rem] border-2 border-dashed border-muted-foreground/20 bg-muted/20 px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pastel-mint">
                  <BookOpen className="h-7 w-7 text-pastel-mint-foreground" />
                </div>
                <h3 className="font-heading text-xl font-extrabold tracking-tight text-foreground">
                  No lesson summaries found
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {lessons.length === 0
                    ? 'No lessons with recordings are available yet. Summaries appear here once a session has finished.'
                    : 'Try adjusting your filters to see more results.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm font-medium text-muted-foreground">
                  Showing {pagedLessons.length} of {filteredLessons.length} lessons
                </p>

                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {pagedLessons.map((lesson) => (
                    <LessonSummaryCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-11 rounded-full bg-card px-5 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] disabled:opacity-40"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 2)
                      .flatMap((n, i, arr) => (i > 0 && n - arr[i - 1] > 1 ? ['gap-' + n, n] : [n]))
                      .map((n) => typeof n === 'string' ? (
                        <span key={n} className="px-1 text-muted-foreground">…</span>
                      ) : (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPage(n)}
                        className={
                          n === currentPage
                            ? 'h-11 w-11 rounded-full bg-foreground text-sm font-bold text-background shadow-[var(--shadow-soft)]'
                            : 'h-11 w-11 rounded-full bg-card text-sm font-medium text-foreground shadow-[var(--shadow-soft)]'
                        }
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-11 rounded-full bg-card px-5 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonSummaries;