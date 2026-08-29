import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, parseISO, isAfter } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

import { 
  FileText, 
  Book, 
  Calendar, 
  Clock, 
  Plus, 
  Filter,
  Download,
  ArrowRight
} from 'lucide-react';
import { DoodleBook, DoodleCalendar, DoodleClock, DoodleClipboard } from '@/components/calendar/LessonDoodles';


import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import AssignHomeworkDialog from './AssignHomeworkDialog';
import ViewHomeworkDialog from './ViewHomeworkDialog';

interface Homework {
  id: string;
  title: string;
  description: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  due_date: string | null;
  created_at: string;
  lesson_id: string;
  lesson: {
    title: string;
    tutor: {
      first_name: string;
      last_name: string;
    } | null;
  };
  submission_count: number;
}

interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: number;
  submission_text: string | null;
  attachment_url: string | null;
  status: string;
  grade: string | null;
  feedback: string | null;
  submitted_at: string;
  student: {
    first_name: string;
    last_name: string;
  };
  homework: {
    title: string;
    lesson: {
      title: string;
    };
  };
}

const HomeworkManager: React.FC = () => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [isViewingHomework, setIsViewingHomework] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  
  useEffect(() => {
    fetchHomeworks();
    fetchSubmissions();
  }, []);
  
  const fetchHomeworks = async () => {
    setIsLoading(true);
    try {
      // Apply RLS policies
      let homeworkQuery = supabase
        .from('homework')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: homeworkData, error: homeworkError } = await homeworkQuery;

      if (homeworkError) {
        console.error('Error fetching homework:', homeworkError);
        throw homeworkError;
      }

      if (!homeworkData || homeworkData.length === 0) {
        setHomeworks([]);
        setIsLoading(false);
        return;
      }

      // Fetch lesson data for the homework that the user can access
      const lessonIds = homeworkData.map(hw => hw.lesson_id);
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title, tutor_id')
        .in('id', lessonIds);

      if (lessonError) {
        console.error('Error fetching lessons:', lessonError);
        throw lessonError;
      }

      // Fetch tutor data for the lessons
      const tutorIds = lessonData?.map(lesson => lesson.tutor_id).filter(Boolean) || [];
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('id, first_name, last_name')
        .in('id', tutorIds);

      if (tutorError) {
        console.error('Error fetching tutors:', tutorError);
        throw tutorError;
      }

      // Fetch submission counts for accessible homework
      const { data: submissionCounts, error: submissionError } = await supabase
        .from('homework_submissions')
        .select('homework_id')
        .in('homework_id', homeworkData.map(hw => hw.id));

      if (submissionError) {
        console.error('Error fetching submission counts:', submissionError);
      }

      // Build submission count map
      const submissionCountMap = new Map();
      submissionCounts?.forEach(sub => {
        const count = submissionCountMap.get(sub.homework_id) || 0;
        submissionCountMap.set(sub.homework_id, count + 1);
      });

      // Build tutor map
      const tutorMap = new Map();
      tutorData?.forEach(tutor => {
        tutorMap.set(tutor.id, tutor);
      });

      // Build lesson map
      const lessonMap = new Map();
      lessonData?.forEach(lesson => {
        const tutor = tutorMap.get(lesson.tutor_id);
        lessonMap.set(lesson.id, {
          title: lesson.title,
          tutor: tutor || null
        });
      });

      // Combine all data safely
      const processedData: Homework[] = homeworkData.map(hw => {
        const lesson = lessonMap.get(hw.lesson_id);
        console.log(`Processing homework ${hw.id}, lesson:`, lesson);
        
        return {
          ...hw,
          lesson: lesson || {
            title: 'Unknown Lesson',
            tutor: null
          },
          submission_count: submissionCountMap.get(hw.id) || 0
        };
      });
      
      console.log('Processed homework data with RLS filtering:', processedData);
      setHomeworks(processedData);
    } catch (error) {
      console.error('Error fetching homework:', error);
      toast.error('Failed to load homework assignments');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSubmissions = async () => {
    try {
      // RLS policies will automatically filter submissions based on user permissions
      const { data, error } = await supabase
        .from('homework_submissions')
        .select(`
          *,
          student:students(first_name, last_name),
          homework:homework(
            title,
            lesson:lessons(title)
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched submissions with RLS filtering:', data?.length || 0, 'submissions');
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load homework submissions');
    }
  };
  
  const handleHomeworkSuccess = () => {
    fetchHomeworks();
    fetchSubmissions();
  };
  
  const viewHomeworkDetails = (homeworkId: string) => {
    setSelectedHomeworkId(homeworkId);
    setIsViewingHomework(true);
  };
  
  const viewSubmissionDetails = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsViewingHomework(true);
  };
  
  const filteredHomeworks = homeworks.filter(hw => {
    // Apply status filter
    if (filter === 'upcoming' && hw.due_date) {
      if (!isAfter(parseISO(hw.due_date), new Date())) {
        return false;
      }
    } else if (filter === 'past' && hw.due_date) {
      if (isAfter(parseISO(hw.due_date), new Date())) {
        return false;
      }
    }
    
    // Apply search filter with additional null safety
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = hw.title?.toLowerCase()?.includes(query) || false;
      const descriptionMatch = hw.description?.toLowerCase()?.includes(query) || false;
      const lessonTitleMatch = hw.lesson?.title?.toLowerCase()?.includes(query) || false;
      const tutorFirstNameMatch = hw.lesson?.tutor?.first_name?.toLowerCase()?.includes(query) || false;
      const tutorLastNameMatch = hw.lesson?.tutor?.last_name?.toLowerCase()?.includes(query) || false;
      
      return titleMatch || descriptionMatch || lessonTitleMatch || tutorFirstNameMatch || tutorLastNameMatch;
    }
    
    return true;
  });
  
  const filteredSubmissions = submissions.filter(sub => {
    // Apply status filter
    if (filter === 'graded' && sub.status !== 'graded') {
      return false;
    } else if (filter === 'ungraded' && sub.status === 'graded') {
      return false;
    }
    
    // Apply search filter with null safety
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const homeworkTitleMatch = sub.homework?.title?.toLowerCase()?.includes(query) || false;
      const lessonTitleMatch = sub.homework?.lesson?.title?.toLowerCase()?.includes(query) || false;
      const studentFirstNameMatch = sub.student?.first_name?.toLowerCase()?.includes(query) || false;
      const studentLastNameMatch = sub.student?.last_name?.toLowerCase()?.includes(query) || false;
      
      return homeworkTitleMatch || lessonTitleMatch || studentFirstNameMatch || studentLastNameMatch;
    }
    
    return true;
  });

  // Helper function to safely get tutor name
  const getTutorName = (homework: Homework) => {
    const tutor = homework.lesson?.tutor;
    if (!tutor) {
      return 'Unknown Tutor';
    }
    const firstName = tutor.first_name || '';
    const lastName = tutor.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Tutor';
  };

  // Helper function to safely get student name
  const getStudentName = (submission: HomeworkSubmission) => {
    const student = submission.student;
    if (!student) {
      return 'Unknown Student';
    }
    const firstName = student.first_name || '';
    const lastName = student.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Student';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Search homework and submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 rounded-full border-2 border-foreground/80 bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <DoodleClipboard className="absolute left-4 top-3 h-5 w-5 text-foreground/70" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[190px] h-11 rounded-full border-2 border-foreground/80 bg-pastel-butter text-pastel-butter-foreground font-medium">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-foreground/80">
              <SelectItem value="all">All Homework</SelectItem>
              <SelectItem value="upcoming">Upcoming Due Dates</SelectItem>
              <SelectItem value="past">Past Due Dates</SelectItem>
              <SelectItem value="graded">Graded Submissions</SelectItem>
              <SelectItem value="ungraded">Ungraded Submissions</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsAssigningHomework(true)}
            className="gap-2 h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 px-5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Assign Homework</span>
            <span className="sm:hidden">Assign</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="assigned">
        <TabsList className="grid w-full grid-cols-2 h-12 rounded-full border-2 border-foreground/80 bg-background p-1">
          <TabsTrigger
            value="assigned"
            className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background font-medium"
          >
            Assigned Homework
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background font-medium"
          >
            Submissions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned" className="mt-5">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading homework assignments...</div>
          ) : filteredHomeworks.length === 0 ? (
            <div className="rounded-[1.5rem] border-2 border-dashed border-foreground/30 bg-pastel-sand/40 py-12 text-center">
              <DoodleBook className="h-10 w-10 mx-auto text-foreground/70 mb-3" />
              <p className="font-semibold">No homework assignments found</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can only see homework for lessons you teach or manage.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsAssigningHomework(true)}
                className="mt-5 rounded-full border-2 border-foreground/80 bg-transparent hover:bg-foreground/5"
              >
                Assign New Homework
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHomeworks.map((homework) => (
                <div
                  key={homework.id}
                  onClick={() => viewHomeworkDetails(homework.id)}
                  className="group relative cursor-pointer rounded-[1.5rem] border-2 border-foreground/80 bg-pastel-sky p-5 pb-14 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base leading-snug text-pastel-sky-foreground">{homework.title}</h3>
                      <p className="text-sm text-pastel-sky-foreground/70 line-clamp-1 mt-0.5">
                        {homework.lesson?.title || 'Unknown Lesson'}
                      </p>
                    </div>
                    {homework.attachment_url && (
                      <Badge className="rounded-full border-2 border-foreground/80 bg-background text-foreground text-[10px] hover:bg-background">
                        {homework.attachment_type?.toUpperCase() || 'FILE'}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-pastel-sky-foreground/80 mt-3">
                    By {getTutorName(homework)}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/70 bg-background/70 px-3 py-1 text-xs font-medium">
                      <DoodleCalendar className="h-3.5 w-3.5" />
                      {homework.due_date ? format(parseISO(homework.due_date), 'MMM d, yyyy') : 'No due date'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/70 bg-background/70 px-3 py-1 text-xs font-medium">
                      <DoodleClipboard className="h-3.5 w-3.5" />
                      {homework.submission_count} {homework.submission_count === 1 ? 'submission' : 'submissions'}
                    </span>
                  </div>

                  <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="submissions" className="mt-5">
          {filteredSubmissions.length === 0 ? (
            <div className="rounded-[1.5rem] border-2 border-dashed border-foreground/30 bg-pastel-sand/40 py-12 text-center">
              <DoodleClipboard className="h-10 w-10 mx-auto text-foreground/70 mb-3" />
              <p className="font-semibold">No homework submissions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can only see submissions for lessons you teach or manage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubmissions.map((submission) => {
                const isGraded = submission.status === 'graded';
                return (
                <div
                  key={submission.id}
                  onClick={() => viewSubmissionDetails(submission.id)}
                  className={`group relative cursor-pointer rounded-[1.5rem] border-2 border-foreground/80 p-5 pb-14 transition-transform hover:-translate-y-0.5 ${isGraded ? 'bg-pastel-mint' : 'bg-pastel-butter'}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base leading-snug">{submission.homework?.title || 'Unknown Homework'}</h3>
                      <p className="text-sm opacity-70 line-clamp-1 mt-0.5">
                        {getStudentName(submission)}
                      </p>
                    </div>
                    <Badge className={`rounded-full border-2 border-foreground/80 text-[10px] ${isGraded ? 'bg-foreground text-background hover:bg-foreground' : 'bg-background text-foreground hover:bg-background'}`}>
                      {isGraded ? 'Graded' : 'Submitted'}
                    </Badge>
                  </div>

                  <div className="text-sm opacity-80 mt-3">
                    {submission.homework?.lesson?.title || 'Unknown Lesson'}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/70 bg-background/70 px-3 py-1 text-xs font-medium">
                      <DoodleClock className="h-3.5 w-3.5" />
                      {format(parseISO(submission.submitted_at), 'MMM d, yyyy')}
                    </span>
                    {submission.attachment_url && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/70 bg-background/70 px-3 py-1 text-xs font-medium hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(submission.attachment_url, '_blank');
                        }}
                      >
                        <Download className="h-3 w-3" />
                        File
                      </button>
                    )}
                  </div>

                  <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>


      <AssignHomeworkDialog 
        isOpen={isAssigningHomework}
        onClose={() => setIsAssigningHomework(false)}
        onSuccess={handleHomeworkSuccess}
      />

      <ViewHomeworkDialog 
        homeworkId={selectedHomeworkId}
        submissionId={selectedSubmissionId}
        isOpen={isViewingHomework}
        onClose={() => {
          setIsViewingHomework(false);
          setSelectedHomeworkId(null);
          setSelectedSubmissionId(null);
        }}
        onUpdate={handleHomeworkSuccess}
      />
    </div>
  );
};

export default HomeworkManager;
