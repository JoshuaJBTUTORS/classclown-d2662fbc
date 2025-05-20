
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, parseISO, isAfter, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Book, 
  Calendar, 
  Clock, 
  Plus, 
  Filter,
  Download,
  Check,
  AlertCircle,
  Upload,
  Info,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

import AssignHomeworkDialog from './AssignHomeworkDialog';
import ViewHomeworkDialog from './ViewHomeworkDialog';

interface UnifiedHomeworkViewProps {
  userRole: 'tutor' | 'student' | null;
  studentId: number | null;
}

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
    };
  };
  submission_count?: number;
  submission?: {
    id: string;
    status: string;
    submission_text: string | null;
    attachment_url: string | null;
    submitted_at: string;
    grade: string | null;
    feedback: string | null;
  };
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

const UnifiedHomeworkView: React.FC<UnifiedHomeworkViewProps> = ({ userRole, studentId }) => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // UI state
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);
  const [isViewingHomework, setIsViewingHomework] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'assigned' | 'submissions'>('assigned');
  
  // Student submission state
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isViewSubmissionOpen, setIsViewSubmissionOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  
  useEffect(() => {
    if (userRole === 'tutor') {
      fetchTutorData();
    } else if (userRole === 'student' && studentId) {
      fetchStudentData();
    } else {
      setLoadError("Invalid user role or missing student ID");
      setIsLoading(false);
    }
  }, [userRole, studentId]);

  const fetchTutorData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      await Promise.all([fetchAllHomeworks(), fetchAllSubmissions()]);
    } catch (error) {
      console.error('Error loading tutor data:', error);
      setLoadError('Failed to load tutor data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (!studentId) {
        throw new Error("No student ID provided");
      }
      
      console.log("Fetching homework for student ID:", studentId);
      
      // Fetch all lesson IDs the student is part of
      const { data: lessonStudents, error: lessonError } = await supabase
        .from('lesson_students')
        .select('lesson_id')
        .eq('student_id', studentId);

      if (lessonError) {
        console.error("Error fetching lesson students:", lessonError);
        throw lessonError;
      }
      
      console.log("Found lesson students:", lessonStudents);
      
      if (!lessonStudents || lessonStudents.length === 0) {
        console.log("No lessons found for student");
        setHomeworks([]);
        return;
      }

      const lessonIds = lessonStudents.map(ls => ls.lesson_id);
      console.log("Lesson IDs to fetch homework for:", lessonIds);

      // Get all homework for these lessons
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework')
        .select(`
          id,
          title,
          description,
          due_date,
          attachment_url,
          attachment_type,
          lesson_id,
          created_at,
          lesson:lessons(
            title,
            tutor:tutors(first_name, last_name)
          )
        `)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (homeworkError) {
        console.error("Error fetching homework:", homeworkError);
        throw homeworkError;
      }

      console.log("Found homework assignments:", homeworkData);

      // For each homework, check if the student has a submission
      const homeworkWithSubmissions = await Promise.all(
        homeworkData.map(async (hw) => {
          console.log("Checking submissions for homework:", hw.id);
          const { data: submission, error: submissionError } = await supabase
            .from('homework_submissions')
            .select('id, status, submission_text, attachment_url, submitted_at, grade, feedback')
            .eq('homework_id', hw.id)
            .eq('student_id', studentId)
            .maybeSingle();

          if (submissionError) {
            console.error('Error fetching submission:', submissionError);
            return hw; // Return homework without submission info
          }

          console.log("Submission data for homework", hw.id, ":", submission);
          
          return {
            ...hw,
            submission: submission || undefined
          };
        })
      );
      
      console.log("Final homework data with submissions:", homeworkWithSubmissions);
      setHomeworks(homeworkWithSubmissions);
    } catch (error) {
      console.error('Error fetching student homework:', error);
      toast.error('Failed to load homework assignments');
      setLoadError('Failed to load homework assignments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllHomeworks = async () => {
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
      throw error;
    }
  };
  
  const fetchAllSubmissions = async () => {
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
      throw error;
    }
  };

  const handleRefresh = () => {
    console.log("Refreshing homework data...");
    if (userRole === 'tutor') {
      fetchTutorData();
    } else if (userRole === 'student' && studentId) {
      fetchStudentData();
    }
  };

  const handleHomeworkSuccess = () => {
    if (userRole === 'tutor') {
      fetchTutorData();
    } else if (userRole === 'student' && studentId) {
      fetchStudentData();
    }
  };
  
  const viewHomeworkDetails = (homeworkId: string) => {
    if (userRole === 'tutor') {
      setSelectedHomeworkId(homeworkId);
      setIsViewingHomework(true);
    } else {
      const homework = homeworks.find(hw => hw.id === homeworkId);
      if (homework) {
        openHomeworkDialog(homework);
      }
    }
  };
  
  const viewSubmissionDetails = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsViewingHomework(true);
  };

  const openHomeworkDialog = (homework: Homework) => {
    console.log("Opening homework dialog for:", homework);
    setSelectedHomework(homework);
    
    if (homework.submission) {
      console.log("Homework has submission, opening view dialog");
      // Pre-populate submission text for editing
      setSubmissionText(homework.submission.submission_text || '');
      setIsViewSubmissionOpen(true);
    } else {
      console.log("Homework has no submission, opening submit dialog");
      // Reset form for new submission
      setSubmissionText('');
      setSelectedFile(null);
      setIsSubmitDialogOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setFileUploadError("File size exceeds 10MB limit");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitHomework = async () => {
    if (!selectedHomework || !studentId) return;
    
    if (!submissionText && !selectedFile) {
      toast.error("Please add text or attach a file before submitting");
      return;
    }
    
    setIsSubmitting(true);
    setFileUploadError(null);
    
    try {
      console.log("Starting homework submission for:", selectedHomework.id);
      let attachmentUrl = null;
      
      // Upload file if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `submissions/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        console.log("Uploading file:", fileName);
        
        try {
          // Check if storage bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const homeworkBucket = buckets?.find(b => b.name === 'homework');
          
          if (!homeworkBucket) {
            console.error("Homework storage bucket not found");
            toast.error("Storage not configured properly. Please contact support.");
            throw new Error("Homework storage bucket not found");
          }
          
          // Upload the file to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('homework')
            .upload(fileName, selectedFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            setFileUploadError("Failed to upload file. Please try again.");
            throw uploadError;
          }
          
          // Get the public URL of the uploaded file
          const { data: urlData } = supabase.storage
            .from('homework')
            .getPublicUrl(fileName);
          
          attachmentUrl = urlData.publicUrl;
          console.log("File uploaded successfully:", attachmentUrl);
        } catch (uploadError) {
          console.error('Error during file upload:', uploadError);
          setFileUploadError("Failed to upload file. Please try again.");
          throw uploadError;
        }
      }

      // Check if this is a new submission or an update to an existing one
      if (selectedHomework.submission) {
        console.log("Updating existing submission:", selectedHomework.submission.id);
        // Update existing submission
        const { error } = await supabase
          .from('homework_submissions')
          .update({
            submission_text: submissionText || null,
            attachment_url: attachmentUrl || selectedHomework.submission.attachment_url,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', selectedHomework.submission.id);

        if (error) {
          console.error("Error updating submission:", error);
          throw error;
        }
        toast.success('Homework submission updated!');
      } else {
        console.log("Creating new submission for homework:", selectedHomework.id);
        // Create a new submission
        const submissionData = {
          homework_id: selectedHomework.id,
          student_id: studentId,
          submission_text: submissionText || null,
          attachment_url: attachmentUrl,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        };

        console.log("Submission data:", submissionData);
        const { error } = await supabase
          .from('homework_submissions')
          .insert(submissionData);

        if (error) {
          console.error("Error creating submission:", error);
          throw error;
        }
        toast.success('Homework submitted successfully!');
      }
      
      setIsSubmitDialogOpen(false);
      setIsViewSubmissionOpen(false);
      
      if (userRole === 'student' && studentId) {
        fetchStudentData(); // Refresh homework list
      }
      
      // Reset form
      setSubmissionText('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error submitting homework:', error);
      if (!fileUploadError) {
        toast.error('Failed to submit homework. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Apply filters based on user role and filter settings
  const getFilteredHomeworks = () => {
    return homeworks.filter(hw => {
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
          hw.lesson.tutor.first_name.toLowerCase().includes(query) ||
          hw.lesson.tutor.last_name.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
  const getFilteredSubmissions = () => {
    return submissions.filter(sub => {
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
  };

  // Determine available tabs based on user role
  const getTabOptions = () => {
    if (userRole === 'tutor') {
      return [
        { id: 'assigned', label: 'Assigned Homework' },
        { id: 'submissions', label: 'Submissions' }
      ];
    } else {
      return [
        { id: 'assigned', label: 'My Homework' }
      ];
    }
  };

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
          {/* Filter dropdown */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homework</SelectItem>
              <SelectItem value="upcoming">Upcoming Due Dates</SelectItem>
              <SelectItem value="past">Past Due Dates</SelectItem>
              {userRole === 'tutor' && (
                <>
                  <SelectItem value="graded">Graded Submissions</SelectItem>
                  <SelectItem value="ungraded">Ungraded Submissions</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          
          {/* Refresh button */}
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          {/* Assign homework button (tutor only) */}
          {userRole === 'tutor' && (
            <Button onClick={() => setIsAssigningHomework(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Assign Homework</span>
              <span className="sm:hidden">Assign</span>
            </Button>
          )}
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {loadError}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="assigned" value={activeTab} onValueChange={(value) => setActiveTab(value as 'assigned' | 'submissions')}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${getTabOptions().length}, minmax(0, 1fr))` }}>
          {getTabOptions().map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="assigned" className="mt-4">
          {isLoading ? (
            <div className="py-8 text-center">Loading homework assignments...</div>
          ) : getFilteredHomeworks().length === 0 ? (
            <div className="py-8 text-center">
              <Book className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No homework assignments found</p>
              {userRole === 'tutor' && (
                <Button variant="outline" onClick={() => setIsAssigningHomework(true)} className="mt-4">
                  Assign New Homework
                </Button>
              )}
              {userRole === 'student' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Once a teacher assigns homework, it will appear here
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredHomeworks().map((homework) => {
                const hasSubmission = Boolean(homework.submission);
                const isOverdue = homework.due_date && isPast(parseISO(homework.due_date)) && !hasSubmission && userRole === 'student';
                
                return (
                  <Card 
                    key={homework.id} 
                    className={`
                      ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}
                      ${hasSubmission && homework.submission?.status === 'graded' ? 'border-green-200 bg-green-50/50' : ''}
                      hover:shadow-md transition-shadow cursor-pointer
                    `}
                    onClick={() => viewHomeworkDetails(homework.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base line-clamp-1">{homework.title}</CardTitle>
                        {homework.attachment_url && (
                          <Badge variant="secondary" className="text-xs">
                            {homework.attachment_type?.toUpperCase() || 'FILE'}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-1">
                        {homework.lesson.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">
                        Teacher: {homework.lesson.tutor.first_name} {homework.lesson.tutor.last_name}
                      </div>
                      
                      {homework.due_date && (
                        <div className={`flex items-center gap-1 text-sm mb-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          {isOverdue ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                          <span>
                            Due: {format(parseISO(homework.due_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      
                      {/* For student view, show submission status */}
                      {userRole === 'student' && hasSubmission && (
                        <Badge variant={homework.submission?.status === 'graded' ? 'default' : 'outline'} className="mb-2">
                          {homework.submission?.status === 'graded' ? 'Graded' : 'Submitted'}
                        </Badge>
                      )}
                      
                      {/* For tutor view, show submission count */}
                      {userRole === 'tutor' && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <FileText className="h-3 w-3" />
                          {homework.submission_count} {homework.submission_count === 1 ? 'submission' : 'submissions'}
                        </Badge>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      {userRole === 'student' ? (
                        <div className="w-full text-center">
                          <p className="text-sm text-muted-foreground">
                            {hasSubmission ? 'Click to view your submission' : 'Click to submit homework'}
                          </p>
                        </div>
                      ) : (
                        <div className="w-full text-center">
                          <p className="text-sm text-muted-foreground">Click to view details</p>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        {userRole === 'tutor' && (
          <TabsContent value="submissions" className="mt-4">
            {getFilteredSubmissions().length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No homework submissions found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredSubmissions().map((submission) => (
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
        )}
      </Tabs>

      {/* Dialogs for tutor role */}
      {userRole === 'tutor' && (
        <>
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
        </>
      )}

      {/* Submit Homework Dialog (student role) */}
      {userRole === 'student' && (
        <>
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Submit Homework</DialogTitle>
                <DialogDescription>
                  Complete your homework assignment and submit it for review.
                </DialogDescription>
              </DialogHeader>
              
              {selectedHomework && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{selectedHomework.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedHomework.lesson.title} - {selectedHomework.lesson.tutor.first_name} {selectedHomework.lesson.tutor.last_name}
                    </p>
                  </div>
                  
                  {selectedHomework.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Instructions</h4>
                      <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                        {selectedHomework.description}
                      </div>
                    </div>
                  )}
                  
                  {selectedHomework.attachment_url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Reference Material</h4>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(selectedHomework.attachment_url!, '_blank');
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        View Assignment Material
                      </Button>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="submission_text" className="block text-sm font-medium mb-1">Your Answer</label>
                      <Textarea 
                        id="submission_text" 
                        placeholder="Type your homework answer here..."
                        className="min-h-[150px]"
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="submission_file" className="block text-sm font-medium mb-1">
                        Attach File (Optional)
                      </label>
                      <div className="grid w-full items-center gap-1.5">
                        <Input
                          id="submission_file"
                          type="file"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload your completed homework (PDF, Word document, etc.)
                        </p>
                        {selectedFile && (
                          <p className="text-xs text-green-600">
                            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                          </p>
                        )}
                        {fileUploadError && (
                          <p className="text-xs text-red-500">{fileUploadError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitHomework}
                  disabled={isSubmitting || (!submissionText && !selectedFile)}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">●</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Homework
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* View Submission Dialog */}
          <Dialog open={isViewSubmissionOpen} onOpenChange={setIsViewSubmissionOpen}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Your Submission</DialogTitle>
                <DialogDescription>
                  Review your homework submission and teacher feedback.
                </DialogDescription>
              </DialogHeader>
              
              {selectedHomework?.submission && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{selectedHomework.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedHomework.submission.status === 'graded' ? 'default' : 'outline'}>
                        {selectedHomework.submission.status === 'graded' ? 'Graded' : 'Submitted'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Submitted on {format(parseISO(selectedHomework.submission.submitted_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  {selectedHomework.submission.submission_text && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Your Answer</h4>
                      <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                        {selectedHomework.submission.submission_text}
                      </div>
                    </div>
                  )}
                  
                  {selectedHomework.submission.attachment_url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Your Attachment</h4>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(selectedHomework.submission.attachment_url!, '_blank');
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        View Your Submission
                      </Button>
                    </div>
                  )}
                  
                  {selectedHomework.submission.status === 'graded' && (
                    <>
                      <Separator />
                      
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-1 mb-1">
                          <Check className="h-4 w-4 text-green-500" />
                          Grade
                        </h4>
                        <p className="text-lg font-medium">{selectedHomework.submission.grade}</p>
                      </div>
                      
                      {selectedHomework.submission.feedback && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Teacher Feedback</h4>
                          <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                            {selectedHomework.submission.feedback}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsViewSubmissionOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setIsViewSubmissionOpen(false);
                    if (selectedHomework && selectedHomework.submission) {
                      setSubmissionText(selectedHomework.submission.submission_text || '');
                      setSelectedFile(null);
                    }
                    setIsSubmitDialogOpen(true);
                  }}
                >
                  Update Submission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default UnifiedHomeworkView;
