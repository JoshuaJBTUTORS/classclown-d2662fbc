
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Edit, Download, Trash2, X, Check, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AssignHomeworkDialog from './AssignHomeworkDialog';

interface ViewHomeworkDialogProps {
  homeworkId: string | null;
  submissionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
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
      id: string;
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  submissions: {
    id: string;
    student: {
      id: number;
      first_name: string;
      last_name: string;
    } | null;
    status: string;
    submitted_at: string;
    percentage_score: number | null;
  }[];
}

interface Submission {
  id: string;
  homework_id: string;
  student_id: number;
  submission_text: string | null;
  attachment_url: string | null;
  status: string;
  grade: string | null;
  percentage_score: number | null;
  feedback: string | null;
  submitted_at: string;
  student: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  homework: {
    id: string;
    title: string;
    description: string | null;
    lesson: {
      title: string;
      tutor: {
        id: string;
        first_name: string;
        last_name: string;
      } | null;
    } | null;
  } | null;
}

const ViewHomeworkDialog: React.FC<ViewHomeworkDialogProps> = ({
  homeworkId,
  submissionId,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [percentageScore, setPercentageScore] = useState<number | ''>('');
  const [isGrading, setIsGrading] = useState(false);

  const isViewingSubmission = Boolean(submissionId);

  useEffect(() => {
    if (isOpen) {
      if (homeworkId) {
        fetchHomeworkDetails();
      } else if (submissionId) {
        fetchSubmissionDetails();
      }
    }
  }, [isOpen, homeworkId, submissionId]);

  const fetchHomeworkDetails = async () => {
    if (!homeworkId) return;

    setLoading(true);
    try {
      console.log('Fetching homework details for:', homeworkId);

      // Fetch homework data
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework')
        .select('*')
        .eq('id', homeworkId)
        .single();

      if (homeworkError) throw homeworkError;

      // Fetch lesson data separately
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title, tutor_id')
        .eq('id', homeworkData.lesson_id)
        .single();

      if (lessonError) throw lessonError;

      // Fetch tutor data separately
      let tutorData = null;
      if (lessonData?.tutor_id) {
        const { data: tutorResult, error: tutorError } = await supabase
          .from('tutors')
          .select('id, first_name, last_name')
          .eq('id', lessonData.tutor_id)
          .single();

        if (tutorError) {
          console.error('Error fetching tutor:', tutorError);
        } else {
          tutorData = tutorResult;
        }
      }

      // Fetch submissions for this homework
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('homework_submissions')
        .select('id, student_id, status, submitted_at, percentage_score')
        .eq('homework_id', homeworkId);

      if (submissionsError) throw submissionsError;

      // Fetch student data for submissions
      const studentIds = submissionsData?.map(sub => sub.student_id) || [];
      let studentsData = [];
      if (studentIds.length > 0) {
        const { data: studentsResult, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .in('id', studentIds);

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
        } else {
          studentsData = studentsResult || [];
        }
      }

      // Build student map
      const studentMap = new Map();
      studentsData.forEach(student => {
        studentMap.set(student.id, student);
      });

      // Combine homework data with related information
      const processedHomework: Homework = {
        ...homeworkData,
        lesson: {
          title: lessonData?.title || 'Unknown Lesson',
          tutor: tutorData
        },
        submissions: submissionsData?.map(sub => ({
          ...sub,
          student: studentMap.get(sub.student_id) || null
        })) || []
      };

      console.log('Processed homework data:', processedHomework);
      setHomework(processedHomework);
    } catch (error) {
      console.error('Error fetching homework details:', error);
      toast.error('Failed to load homework details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionDetails = async () => {
    if (!submissionId) return;

    setLoading(true);
    try {
      console.log('Fetching submission details for:', submissionId);

      // Fetch submission data
      const { data: submissionData, error: submissionError } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      // Fetch student data separately
      let studentData = null;
      if (submissionData.student_id) {
        const { data: studentResult, error: studentError } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('id', submissionData.student_id)
          .single();

        if (studentError) {
          console.error('Error fetching student:', studentError);
        } else {
          studentData = studentResult;
        }
      }

      // Fetch homework data separately
      let homeworkData = null;
      if (submissionData.homework_id) {
        const { data: hwResult, error: hwError } = await supabase
          .from('homework')
          .select('id, title, description, lesson_id')
          .eq('id', submissionData.homework_id)
          .single();

        if (hwError) {
          console.error('Error fetching homework:', hwError);
        } else {
          homeworkData = hwResult;
        }
      }

      // Fetch lesson and tutor data if homework exists
      let lessonData = null;
      let tutorData = null;
      if (homeworkData?.lesson_id) {
        const { data: lessonResult, error: lessonError } = await supabase
          .from('lessons')
          .select('title, tutor_id')
          .eq('id', homeworkData.lesson_id)
          .single();

        if (lessonError) {
          console.error('Error fetching lesson:', lessonError);
        } else {
          lessonData = lessonResult;

          if (lessonResult?.tutor_id) {
            const { data: tutorResult, error: tutorError } = await supabase
              .from('tutors')
              .select('id, first_name, last_name')
              .eq('id', lessonResult.tutor_id)
              .single();

            if (tutorError) {
              console.error('Error fetching tutor:', tutorError);
            } else {
              tutorData = tutorResult;
            }
          }
        }
      }

      // Combine submission data with related information
      const processedSubmission: Submission = {
        ...submissionData,
        student: studentData,
        homework: homeworkData ? {
          ...homeworkData,
          lesson: lessonData ? {
            title: lessonData.title,
            tutor: tutorData
          } : null
        } : null
      };

      console.log('Processed submission data:', processedSubmission);
      setSubmission(processedSubmission);
      setFeedback(processedSubmission.feedback || '');
      setGrade(processedSubmission.grade || '');
      setPercentageScore(processedSubmission.percentage_score || '');
    } catch (error) {
      console.error('Error fetching submission details:', error);
      toast.error('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;

    if (homework) {
      try {
        // First delete related submissions
        const { error: submissionError } = await supabase
          .from('homework_submissions')
          .delete()
          .eq('homework_id', homework.id);

        if (submissionError) throw submissionError;

        // Then delete the homework
        const { error } = await supabase
          .from('homework')
          .delete()
          .eq('id', homework.id);

        if (error) throw error;

        toast.success('Homework deleted successfully');
        onClose();
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting homework:', error);
        toast.error('Failed to delete homework');
      }
    } else if (submission) {
      try {
        const { error } = await supabase
          .from('homework_submissions')
          .delete()
          .eq('id', submission.id);

        if (error) throw error;

        toast.success('Submission deleted successfully');
        onClose();
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting submission:', error);
        toast.error('Failed to delete submission');
      }
    }

    setIsDeleting(false);
  };

  const submitGrade = async () => {
    if (!submission) return;

    // Validate percentage score
    const score = Number(percentageScore);
    if (percentageScore !== '' && (isNaN(score) || score < 0 || score > 100)) {
      toast.error('Percentage score must be between 0 and 100');
      return;
    }

    try {
      const { error } = await supabase
        .from('homework_submissions')
        .update({
          feedback,
          grade: grade || null,
          percentage_score: percentageScore !== '' ? score : null,
          status: 'graded'
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success('Submission graded successfully');
      setIsGrading(false);
      
      // Update local state
      setSubmission({
        ...submission,
        feedback,
        grade,
        percentage_score: percentageScore !== '' ? score : null,
        status: 'graded'
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission');
    }
  };

  const handleSubmissionClick = (submissionId: string) => {
    onClose();
    // Small delay to allow the current dialog to close before opening the new one
    setTimeout(() => {
      // This would need to be handled by the parent component
      // For now, we'll just close and let the parent handle navigation
      if (onUpdate) onUpdate();
    }, 300);
  };

  // Helper functions for safe name display
  const getTutorName = (tutor: { first_name: string; last_name: string } | null) => {
    if (!tutor) return 'Unknown Tutor';
    const firstName = tutor.first_name || '';
    const lastName = tutor.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Tutor';
  };

  const getStudentName = (student: { first_name: string; last_name: string } | null) => {
    if (!student) return 'Unknown Student';
    const firstName = student.first_name || '';
    const lastName = student.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Student';
  };

  if (isEditing && homework) {
    return (
      <AssignHomeworkDialog
        isOpen={true}
        onClose={() => setIsEditing(false)}
        onSuccess={() => {
          fetchHomeworkDetails();
          setIsEditing(false);
          if (onUpdate) onUpdate();
        }}
        editingHomework={{
          id: homework.id,
          title: homework.title,
          description: homework.description || undefined,
          lesson_id: homework.lesson_id,
          due_date: homework.due_date ? parseISO(homework.due_date) : undefined,
          attachment_url: homework.attachment_url || undefined,
          attachment_type: homework.attachment_type || undefined
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[550px]">
        {loading ? (
          <div className="py-10 text-center">Loading details...</div>
        ) : isViewingSubmission && submission ? (
          // Submission View
          <>
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">Submission Details</DialogTitle>
                <div className="flex space-x-1">
                  {isDeleting ? (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDelete}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsDeleting(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsDeleting(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-medium">{submission.homework?.title || 'Unknown Homework'}</h3>
                  <Badge variant={submission.status === 'graded' ? 'default' : 'outline'}>
                    {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{submission.homework?.lesson?.title || 'Unknown Lesson'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Student</h4>
                  <p className="text-sm">
                    {getStudentName(submission.student)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Submitted On</h4>
                  <p className="text-sm">
                    {format(parseISO(submission.submitted_at), 'PPP p')}
                  </p>
                </div>
              </div>

              {submission.submission_text && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Submission Text</h4>
                  <div className="bg-muted/50 p-3 rounded-md text-sm">
                    {submission.submission_text}
                  </div>
                </div>
              )}

              {submission.attachment_url && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Attachment</h4>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(submission.attachment_url!, '_blank')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    View Attachment
                  </Button>
                </div>
              )}

              <Separator />

              {submission.status === 'graded' ? (
                // Show grading info
                <div className="space-y-3">
                  {submission.percentage_score !== null && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Score</h4>
                      <p className="text-lg font-semibold text-blue-600">{submission.percentage_score}%</p>
                    </div>
                  )}
                  
                  {submission.grade && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Grade</h4>
                      <p className="text-sm font-medium">{submission.grade}</p>
                    </div>
                  )}
                  
                  {submission.feedback && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Feedback</h4>
                      <div className="bg-muted/50 p-3 rounded-md text-sm">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsGrading(true);
                      setGrade(submission.grade || '');
                      setFeedback(submission.feedback || '');
                      setPercentageScore(submission.percentage_score || '');
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Update Grading
                  </Button>
                </div>
              ) : isGrading ? (
                // Grading form
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="percentage">Score (0-100%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={percentageScore}
                      onChange={(e) => setPercentageScore(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Enter score percentage"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grade">Grade (Optional)</Label>
                    <Input
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="A+, B, 90%, etc."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback on the submission..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsGrading(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={submitGrade}
                    >
                      Submit Grade
                    </Button>
                  </div>
                </div>
              ) : (
                // Button to start grading
                <Button onClick={() => setIsGrading(true)}>
                  Grade Submission
                </Button>
              )}
            </div>
          </>
        ) : homework ? (
          // Homework View
          <>
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">{homework.title}</DialogTitle>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {isDeleting ? (
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={handleDelete}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setIsDeleting(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsDeleting(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>
              
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Related Lesson</h4>
                <p className="text-sm">{homework.lesson?.title || 'Unknown Lesson'}</p>
                <p className="text-sm text-muted-foreground">
                  {getTutorName(homework.lesson?.tutor || null)}
                </p>
              </div>

              {homework.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Instructions</h4>
                  <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                    {homework.description}
                  </div>
                </div>
              )}

              {homework.due_date && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Due Date</h4>
                  <p className="text-sm">{format(parseISO(homework.due_date), 'PPP p')}</p>
                </div>
              )}

              {homework.attachment_url && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Attachment</h4>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(homework.attachment_url!, '_blank')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Material
                  </Button>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Submissions ({homework.submissions.length})</h4>
                {homework.submissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No submissions yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {homework.submissions.map((submission) => (
                      <div 
                        key={submission.id}
                        className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleSubmissionClick(submission.id)}
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {getStudentName(submission.student)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(submission.submitted_at), 'MMM d, yyyy')}
                            {submission.percentage_score !== null && (
                              <span className="ml-2 text-blue-600 font-medium">
                                {submission.percentage_score}%
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={submission.status === 'graded' ? 'default' : 'outline'} className="text-xs">
                          {submission.status === 'graded' ? 'Graded' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">Item not found</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewHomeworkDialog;
