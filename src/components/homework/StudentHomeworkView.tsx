
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
  Clock,
  Info
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';

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
  const { userRole } = useAuth();
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isViewSubmissionOpen, setIsViewSubmissionOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchHomework();
    } else {
      console.error("No student ID provided");
      setLoadError("No student ID provided. Cannot load homework assignments.");
      setIsLoading(false);
    }
  }, [studentId]);

  const fetchHomework = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Fetch all lesson IDs the student is part of
      const { data: lessonStudents, error: lessonError } = await supabase
        .from('lesson_students')
        .select('lesson_id')
        .eq('student_id', studentId);

      if (lessonError) {
        console.error("Error fetching lesson students:", lessonError);
        throw lessonError;
      }
      
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

      if (homeworkError) {
        console.error("Error fetching homework:", homeworkError);
        throw homeworkError;
      }

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
      setLoadError('Failed to load homework assignments. Please try again later.');
    } finally {
      setIsLoading(false);
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
      console.log("File selected:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB");
    }
  };

  const openHomeworkDialog = (homework: HomeworkItem) => {
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

  const handleSubmitHomework = async () => {
    if (!selectedHomework) return;
    
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
        
        console.log("Uploading file to homework-submissions bucket:", fileName);
        
        try {
          // Upload the file to the homework-submissions bucket
          const { error: uploadError } = await supabase.storage
            .from('homework-submissions')
            .upload(fileName, selectedFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            setFileUploadError("Failed to upload file. Please try again.");
            throw uploadError;
          }
          
          // Get the public URL of the uploaded file (now that bucket is public)
          const { data: urlData } = supabase.storage
            .from('homework-submissions')
            .getPublicUrl(fileName);
          
          attachmentUrl = urlData.publicUrl;
          console.log("File uploaded successfully. Public URL:", attachmentUrl);
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
      fetchHomework(); // Refresh homework list
      
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">
          {userRole === 'parent' ? "Your Child's Homework" : "Your Homework"}
        </h2>
        <Button
          variant="outline"
          className="rounded-full border-2 border-foreground/80 bg-transparent hover:bg-foreground/5 h-11 px-5"
          onClick={() => {
            console.log("Refreshing homework assignments");
            fetchHomework();
          }}
        >
          Refresh Assignments
        </Button>
      </div>

      {loadError && (
        <div className="rounded-[1.5rem] border-2 border-foreground/80 bg-pastel-blush p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 text-pastel-blush-foreground" />
            <div>
              <p className="font-semibold text-pastel-blush-foreground">Error</p>
              <p className="text-sm text-pastel-blush-foreground/80 mt-0.5">{loadError}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">Loading homework assignments...</div>
      ) : homeworks.length === 0 ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-foreground/30 bg-pastel-sand/40 py-12 text-center">
          <DoodleBook className="h-10 w-10 mx-auto text-foreground/70 mb-3" />
          <p className="font-semibold">No homework assignments found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Student ID: {studentId || 'Unknown'}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-[1.5rem] border-2 border-foreground/80 bg-pastel-lilac p-4 flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-pastel-lilac-foreground" />
            <p className="text-sm text-pastel-lilac-foreground">
              Click on any homework card to submit work or view existing submissions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {homeworks.map((homework) => {
              const hasSubmission = Boolean(homework.submission);
              const isGraded = hasSubmission && homework.submission?.status === 'graded';
              const isOverdue = homework.due_date && isPast(parseISO(homework.due_date)) && !hasSubmission;
              const tone = isOverdue
                ? 'bg-pastel-blush'
                : isGraded
                  ? 'bg-pastel-mint'
                  : hasSubmission
                    ? 'bg-pastel-butter'
                    : 'bg-pastel-sky';

              return (
                <div
                  key={homework.id}
                  onClick={() => openHomeworkDialog(homework)}
                  className={`group relative cursor-pointer rounded-[1.5rem] border-2 border-foreground/80 p-5 pb-14 transition-transform hover:-translate-y-0.5 ${tone}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-semibold text-base leading-snug line-clamp-2">{homework.title}</h3>
                    {homework.attachment_url && (
                      <Badge className="rounded-full border-2 border-foreground/80 bg-background text-foreground text-[10px] hover:bg-background shrink-0">
                        {homework.attachment_type?.toUpperCase() || 'FILE'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm opacity-70 line-clamp-1 mt-0.5">{homework.lesson.title}</p>

                  <div className="text-sm opacity-80 mt-3">
                    Teacher: {homework.lesson.tutor.first_name} {homework.lesson.tutor.last_name}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {homework.due_date && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/70 px-3 py-1 text-xs font-medium ${isOverdue ? 'bg-foreground text-background' : 'bg-background/70'}`}>
                        {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <DoodleCalendar className="h-3.5 w-3.5" />}
                        Due {format(parseISO(homework.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    {hasSubmission && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/70 px-3 py-1 text-xs font-medium ${isGraded ? 'bg-foreground text-background' : 'bg-background/70'}`}>
                        <DoodleCheck className="h-3.5 w-3.5" />
                        {isGraded ? 'Graded' : 'Submitted'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs opacity-70 mt-4">
                    {hasSubmission ? 'Click to view submission' : 'Click to submit homework'}
                  </p>

                  <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              );
            })}
          </div>
        </>

      )}

      {/* Submit Homework Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Submit Homework</DialogTitle>
            <DialogDescription>
              Complete the homework assignment and submit it for review.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 max-h-[calc(90vh-140px)] pr-4">
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
                        console.log("Opening homework attachment:", selectedHomework.attachment_url);
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
          </ScrollArea>
          
          <DialogFooter className="flex-shrink-0">
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
            <DialogTitle>Assignment & Submission</DialogTitle>
            <DialogDescription>
              View the homework assignment and submission details.
            </DialogDescription>
          </DialogHeader>
          
          {selectedHomework && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{selectedHomework.title}</h3>
                <div className="flex items-center gap-2">
                  {selectedHomework.submission && (
                    <Badge variant={selectedHomework.submission.status === 'graded' ? 'default' : 'outline'}>
                      {selectedHomework.submission.status === 'graded' ? 'Graded' : 'Submitted'}
                    </Badge>
                  )}
                  {selectedHomework.submission ? (
                    <span className="text-sm text-muted-foreground">
                      Submitted on {format(parseISO(selectedHomework.submission.submitted_at), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not submitted yet</span>
                  )}
                </div>
              </div>

              {/* Show assignment description */}
              {selectedHomework.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Assignment Instructions</h4>
                  <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                    {selectedHomework.description}
                  </div>
                </div>
              )}

              {/* Show assignment attachment */}
              {selectedHomework.attachment_url && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Assignment Material</h4>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Opening homework attachment:", selectedHomework.attachment_url);
                      window.open(selectedHomework.attachment_url!, '_blank');
                    }}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    View Assignment Material
                  </Button>
                </div>
              )}

              {selectedHomework.submission && (
                <>
                  <Separator />
                  
                  {/* Show submission text */}
                  {selectedHomework.submission.submission_text && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Answer</h4>
                      <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                        {selectedHomework.submission.submission_text}
                      </div>
                    </div>
                  )}
                  
                  {/* Show submission attachment */}
                  {selectedHomework.submission.attachment_url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Submission Attachment</h4>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Opening submission attachment:", selectedHomework.submission!.attachment_url);
                          window.open(selectedHomework.submission!.attachment_url!, '_blank');
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        View Submission
                      </Button>
                    </div>
                  )}
                  
                  {/* Show grading information */}
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
            {/* Show update submission button for existing submissions */}
            {selectedHomework?.submission && (
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
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentHomeworkView;
