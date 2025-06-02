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
  Download 
} from 'lucide-react';

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
      const { data, error } = await supabase
        .from('homework')
        .select(`
          *,
          lesson:lessons(
            title,
            tutor:tutors(first_name, last_name)
          ),
          submission_count:homework_submissions(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching homework:', error);
        throw error;
      }
      
      const processedData = data.map((hw) => ({
        ...hw,
        submission_count: hw.submission_count[0]?.count || 0
      }));
      
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
      
      setSubmissions(data);
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
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        hw.title.toLowerCase().includes(query) ||
        (hw.description && hw.description.toLowerCase().includes(query)) ||
        hw.lesson.title.toLowerCase().includes(query) ||
        (hw.lesson.tutor?.first_name?.toLowerCase().includes(query)) ||
        (hw.lesson.tutor?.last_name?.toLowerCase().includes(query))
      );
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
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        sub.homework.title.toLowerCase().includes(query) ||
        sub.homework.lesson.title.toLowerCase().includes(query) ||
        sub.student.first_name.toLowerCase().includes(query) ||
        sub.student.last_name.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Search homework and submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homework</SelectItem>
              <SelectItem value="upcoming">Upcoming Due Dates</SelectItem>
              <SelectItem value="past">Past Due Dates</SelectItem>
              <SelectItem value="graded">Graded Submissions</SelectItem>
              <SelectItem value="ungraded">Ungraded Submissions</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setIsAssigningHomework(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Assign Homework</span>
            <span className="sm:hidden">Assign</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="assigned">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assigned">Assigned Homework</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned" className="mt-4">
          {isLoading ? (
            <div className="py-8 text-center">Loading homework assignments...</div>
          ) : filteredHomeworks.length === 0 ? (
            <div className="py-8 text-center">
              <Book className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No homework assignments found</p>
              <Button variant="outline" onClick={() => setIsAssigningHomework(true)} className="mt-4">
                Assign New Homework
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHomeworks.map((homework) => (
                <Card 
                  key={homework.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => viewHomeworkDetails(homework.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{homework.title}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {homework.lesson.title}
                        </CardDescription>
                      </div>
                      {homework.attachment_url && (
                        <Badge variant="secondary" className="text-xs">
                          {homework.attachment_type?.toUpperCase() || 'FILE'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-2">
                      By {homework.lesson.tutor?.first_name || 'Unknown'} {homework.lesson.tutor?.last_name || 'Tutor'}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {homework.due_date ? format(parseISO(homework.due_date), 'MMM d, yyyy') : 'No due date'}
                        </span>
                      </div>
                      
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileText className="h-3 w-3" />
                        {homework.submission_count} {homework.submission_count === 1 ? 'submission' : 'submissions'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="submissions" className="mt-4">
          {filteredSubmissions.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No homework submissions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubmissions.map((submission) => (
                <Card 
                  key={submission.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => viewSubmissionDetails(submission.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{submission.homework.title}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {submission.student.first_name} {submission.student.last_name}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={submission.status === 'graded' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-2">
                      {submission.homework.lesson.title}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(parseISO(submission.submitted_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      {submission.attachment_url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(submission.attachment_url, '_blank');
                          }}
                        >
                          <Download className="h-3 w-3" />
                          File
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
