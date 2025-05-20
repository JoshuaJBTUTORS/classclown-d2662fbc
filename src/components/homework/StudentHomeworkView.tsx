
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, parseISO, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Calendar, 
  Upload, 
  Download, 
  Check,
  AlertCircle,
  Clock
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface StudentHomeworkProps {
  studentId: number;
}

interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  lesson: {
    title: string;
    tutor: {
      first_name: string;
      last_name: string;
    }
  };
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

const StudentHomeworkView: React.FC<StudentHomeworkProps> = ({ studentId }) => {
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isViewSubmissionOpen, setIsViewSubmissionOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchHomework();
    }
  }, [studentId]);

  const fetchHomework = async () => {
    setIsLoading(true);
    try {
      // Fetch all homework assigned in lessons the student is part of
      const { data: lessonStudents, error: lessonError } = await supabase
        .from('lesson_students')
        .select('lesson_id')
        .eq('student_id', studentId);

      if (lessonError) throw lessonError;
      
      if (!lessonStudents || lessonStudents.length === 0) {
        setHomeworks([]);
        return;
      }

      const lessonIds = lessonStudents.map(ls => ls.lesson_id);

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
          lesson:lessons(
            title,
            tutor:tutors(first_name, last_name)
          )
        `)
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (homeworkError) throw homeworkError;

      // For each homework, check if the student has a submission
      const homeworkWithSubmissions = await Promise.all(
        homeworkData.map(async (hw) => {
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

          return {
            ...hw,
            submission: submission || undefined
          };
        })
      );
      
      setHomeworks(homeworkWithSubmissions);
    } catch (error) {
      console.error('Error fetching homework:', error);
      toast.error('Failed to load homework assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitHomework = async () => {
    if (!selectedHomework) return;
    
    setIsSubmitting(true);
    
    try {
      let attachmentUrl = null;
      
      // Upload file if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `submissions/${fileName}`;
        
        // Check if the homework bucket exists
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          console.error('Error checking buckets:', bucketError);
          const { data, error } = await supabase.storage.createBucket('homework', {
            public: true
          });
          if (error) throw error;
        }
        
        // Upload the file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('homework')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        
        // Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
          .from('homework')
          .getPublicUrl(filePath);
        
        attachmentUrl = urlData.publicUrl;
      }

      // Create the submission
      const submissionData = {
        homework_id: selectedHomework.id,
        student_id: studentId,
        submission_text: submissionText || null,
        attachment_url: attachmentUrl,
        status: 'submitted'
      };

      const { error } = await supabase
        .from('homework_submissions')
        .insert(submissionData);

      if (error) throw error;
      
      toast.success('Homework submitted successfully!');
      setIsSubmitDialogOpen(false);
      fetchHomework(); // Refresh homework list
      
      // Reset form
      setSubmissionText('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error submitting homework:', error);
      toast.error('Failed to submit homework. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Your Homework</h2>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">Loading homework assignments...</div>
      ) : homeworks.length === 0 ? (
        <div className="py-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No homework assignments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeworks.map((homework) => {
            const hasSubmission = Boolean(homework.submission);
            const isOverdue = homework.due_date && isPast(parseISO(homework.due_date)) && !hasSubmission;
            
            return (
              <Card key={homework.id} className={`
                ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}
                ${hasSubmission && homework.submission?.status === 'graded' ? 'border-green-200 bg-green-50/50' : ''}
              `}>
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
                  
                  {hasSubmission && (
                    <Badge variant={homework.submission?.status === 'graded' ? 'default' : 'outline'} className="mb-2">
                      {homework.submission?.status === 'graded' ? 'Graded' : 'Submitted'}
                    </Badge>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  {hasSubmission ? (
                    <div className="flex w-full gap-2">
                      <Button
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setSelectedHomework(homework);
                          setIsViewSubmissionOpen(true);
                        }}
                      >
                        View Submission
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedHomework(homework);
                          // Pre-fill with existing submission data
                          if (homework.submission) {
                            setSubmissionText(homework.submission.submission_text || '');
                            setSelectedFile(null);
                          }
                          setIsSubmitDialogOpen(true);
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant={isOverdue ? "destructive" : "default"}
                      className="w-full"
                      onClick={() => {
                        setSelectedHomework(homework);
                        setIsSubmitDialogOpen(true);
                      }}
                    >
                      {isOverdue ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Submit Late
                        </>
                      ) : (
                        "Submit Homework"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Homework Dialog */}
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
                    onClick={() => window.open(selectedHomework.attachment_url!, '_blank')}
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
                    onClick={() => window.open(selectedHomework.submission.attachment_url!, '_blank')}
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
    </div>
  );
};

export default StudentHomeworkView;
