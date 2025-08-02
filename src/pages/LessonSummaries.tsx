import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Video, RefreshCw, BookOpen } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import LessonSummaryCard from '@/components/learningHub/LessonSummaryCard';
import { format, parseISO, subDays } from 'date-fns';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  start_time: string;
  end_time: string;
  lesson_space_session_id?: string;
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
      let query = supabase
        .from('lessons')
        .select(`
          id,
          title,
          subject,
          start_time,
          end_time,
          lesson_space_session_id,
          tutor:tutors!inner(first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name, email)
          )
        `)
        .not('lesson_space_session_id', 'is', null)
        .order('start_time', { ascending: false });

      // Apply role-based filtering
      if (!isTeacherRole) {
        // For parents and students, filter based on their access through RLS policies
        // The database policies will automatically filter the results
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageTitle 
          title="Lesson Summaries"
          subtitle="View lesson recordings and AI-generated student summaries"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Lesson Summaries"
        subtitle="View lesson recordings and AI-generated student summaries"
      />

      {/* Filters Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search lessons, subjects, or tutors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {getUniqueSubjects().map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={fetchLessons}
              className="w-full md:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No lesson summaries found</h3>
            <p className="text-muted-foreground">
              {lessons.length === 0 
                ? "No lessons with recordings are available yet."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLessons.length} of {lessons.length} lessons
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredLessons.map((lesson) => (
              <LessonSummaryCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LessonSummaries;