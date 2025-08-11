import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import LessonSummaryCard from '@/components/learningHub/LessonSummaryCard';
import { LessonSummariesHero } from '@/components/lessonPlans/LessonSummariesHero';
import { format, parseISO, subDays } from 'date-fns';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTeacherRole = isTutor || isAdmin || isOwner;

  useEffect(() => {
    fetchLessons();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [lessons, searchTerm, subjectFilter, dateFilter]);

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
          .eq('email', user?.email)
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

      // Filter out lessons without valid student data
      const validLessons = data?.filter(lesson => 
        lesson.lesson_students && lesson.lesson_students.length > 0
      ) || [];

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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-auto">
            <div className="space-y-6 p-2 md:p-4">
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
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-96">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="aspect-video bg-muted rounded"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto">
          <div className="min-h-full bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--muted))]/20">
            <LessonSummariesHero
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={setSubjectFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onRefresh={fetchLessons}
              uniqueSubjects={getUniqueSubjects()}
              totalLessons={lessons.length}
              filteredCount={filteredLessons.length}
            />

            <div className="px-2 md:px-4 pb-12">
              {/* Results Section */}
              {filteredLessons.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-[var(--shadow-elegant)]">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--medium-blue))]/60" />
                    <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--deep-purple-blue))]">No lesson summaries found</h3>
                    <p className="text-[hsl(var(--medium-blue))]/70">
                      {lessons.length === 0 
                        ? "No lessons with recordings are available yet."
                        : "Try adjusting your filters to see more results."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-[hsl(var(--medium-blue))]/70 font-medium">
                      Showing {filteredLessons.length} of {lessons.length} lessons
                    </p>
                  </div>

                  <div className="grid gap-6">
                    {filteredLessons.map((lesson) => (
                      <LessonSummaryCard key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonSummaries;