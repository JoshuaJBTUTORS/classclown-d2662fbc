import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, AlertCircle, Loader2, FileText, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LESSON_SUBJECTS } from '@/constants/subjects';

interface GenerateAssessmentFromLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lesson: {
    id: string;
    title: string;
    subject: string;
    start_time: string;
    lesson_students: Array<{
      student: {
        id: number;
        first_name: string;
        last_name: string;
      };
    }>;
  };
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  exam_board: z.string().optional(),
  year: z.coerce.number().int().positive().optional(),
  paper_type: z.string().optional(),
  time_limit_minutes: z.coerce.number().int().positive().optional(),
  total_marks: z.coerce.number().int().positive().default(0),
  prompt: z.string().min(10, "AI prompt must be at least 10 characters"),
  numberOfQuestions: z.coerce.number().int().min(1, "Must generate at least 1 question").max(50, "Maximum 50 questions"),
  topic: z.string().min(1, "Topic is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ProcessingStatus {
  processing: 'idle' | 'processing' | 'completed' | 'error';
}

const GenerateAssessmentFromLessonDialog: React.FC<GenerateAssessmentFromLessonDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  lesson
}) => {
  const { toast } = useToast();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    processing: 'idle',
  });

  // Fetch lesson summaries and transcription
  const { data: lessonData, isLoading: isLoadingLessonData } = useQuery({
    queryKey: ['lesson-assessment-data', lesson.id],
    queryFn: async () => {
      // Fetch lesson summaries
      const { data: summaries } = await supabase
        .from('lesson_student_summaries')
        .select('*')
        .eq('lesson_id', lesson.id);

      // Fetch lesson transcription
      const { data: transcription } = await supabase
        .from('lesson_transcriptions')
        .select('transcription_text, transcription_url')
        .eq('lesson_id', lesson.id)
        .single();

      return {
        summaries: summaries || [],
        transcription: transcription || null
      };
    },
    enabled: isOpen,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      exam_board: "",
      year: undefined,
      paper_type: "",
      time_limit_minutes: undefined,
      total_marks: 0,
      prompt: "",
      numberOfQuestions: 10,
      topic: "",
    },
  });

  // Auto-populate form when lesson data is available
  useEffect(() => {
    if (lesson && lessonData) {
      const { summaries, transcription } = lessonData;
      
      // Calculate average engagement
      const engagementLevels = summaries.map(s => s.engagement_level).filter(Boolean);
      const avgEngagement = engagementLevels.length > 0 
        ? engagementLevels.reduce((acc, level) => {
            const score = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
            return acc + score;
          }, 0) / engagementLevels.length
        : 2;
      
      const engagementDescription = avgEngagement >= 2.5 ? 'high' : avgEngagement >= 1.5 ? 'medium' : 'low';

      // Extract topics from summaries
      const topics = summaries.flatMap(s => s.topics_covered || []);
      const uniqueTopics = [...new Set(topics)];

      // Extract areas for improvement
      const areasForImprovement = summaries
        .map(s => s.areas_for_improvement)
        .filter(Boolean)
        .join('; ');

      // Get transcription content
      const transcriptContent = transcription?.transcription_text || 'No transcript available';

      // Build AI prompt
      const aiPrompt = `Subject: ${lesson.subject}
Student Group Size: ${lesson.lesson_students.length} students
Average Student Engagement: ${engagementDescription}
Topics Covered: ${uniqueTopics.join(', ') || 'General lesson content'}
Areas for Improvement: ${areasForImprovement || 'General practice needed'}

Lesson Transcript Summary: ${transcriptContent.substring(0, 500)}...

Create an assessment suitable for this lesson's content and student performance level. Focus on the topics covered and areas where students need more practice. Include questions that match the engagement level and understanding demonstrated in the lesson.`;

      form.reset({
        title: `${lesson.title} - Assessment`,
        description: `Assessment based on lesson from ${new Date(lesson.start_time).toLocaleDateString()}`,
        subject: lesson.subject,
        topic: uniqueTopics.slice(0, 3).join(', ') || lesson.title,
        prompt: aiPrompt,
        numberOfQuestions: 10,
        time_limit_minutes: 60,
        total_marks: 50,
      });
    }
  }, [lesson, lessonData, form]);

  const createAssessmentMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: assessment, error } = await supabase
        .from('ai_assessments')
        .insert({
          title: values.title,
          description: values.description,
          subject: values.subject,
          exam_board: values.exam_board,
          year: values.year,
          paper_type: values.paper_type,
          time_limit_minutes: values.time_limit_minutes,
          total_marks: values.total_marks,
          questions_text: values.prompt,
          processing_status: 'pending',
          is_ai_generated: true,
          created_by: user.user?.id,
          status: 'draft',
          ai_extraction_data: {
            numberOfQuestions: values.numberOfQuestions,
            topic: values.topic,
            prompt: values.prompt,
            lesson_id: lesson.id,
            based_on_lesson: true
          },
        })
        .select()
        .single();

      if (error) throw error;

      setProcessingStatus({ processing: 'processing' });
      
      const { error: processError } = await supabase.functions.invoke('ai-process-assessment', {
        body: { 
          assessmentId: assessment.id,
          numberOfQuestions: values.numberOfQuestions,
          topic: values.topic,
          prompt: values.prompt
        }
      });

      if (processError) {
        console.error('AI processing error:', processError);
      }

      setProcessingStatus({ processing: 'completed' });
      return assessment;
    },
    onSuccess: () => {
      toast({
        title: "Assessment generated",
        description: "Your lesson-based assessment is being generated by AI. You can edit questions once processing is complete.",
      });
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating assessment",
        description: error.message,
        variant: "destructive",
      });
      setProcessingStatus({ processing: 'error' });
    },
  });

  const handleClose = () => {
    form.reset();
    setProcessingStatus({ processing: 'idle' });
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const isProcessing = processingStatus.processing === 'processing';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Generate Assessment from Lesson
          </DialogTitle>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Creating an assessment based on: <strong>{lesson.title}</strong>
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{lesson.subject}</Badge>
              <Badge variant="outline">{lesson.lesson_students.length} students</Badge>
              <Badge variant="outline">{new Date(lesson.start_time).toLocaleDateString()}</Badge>
            </div>
          </div>
        </DialogHeader>

        {isLoadingLessonData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading lesson data...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => createAssessmentMutation.mutate(values))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {LESSON_SUBJECTS.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="numberOfQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Questions</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="time_limit_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="total_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exam_board"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Board</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AQA">AQA</SelectItem>
                            <SelectItem value="Edexcel">Edexcel</SelectItem>
                            <SelectItem value="OCR">OCR</SelectItem>
                            <SelectItem value="WJEC">WJEC</SelectItem>
                            <SelectItem value="Cambridge">Cambridge</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic Focus</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Main topics to focus on in the assessment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Generation Prompt</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[200px] font-mono text-sm" {...field} />
                    </FormControl>
                    <FormDescription>
                      This prompt includes lesson data, student engagement, and topics covered
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {processingStatus.processing !== 'idle' && (
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(processingStatus.processing)}
                      <div>
                        <p className="font-medium">AI Processing</p>
                        <p className="text-sm text-gray-600">
                          {processingStatus.processing === 'processing' 
                            ? 'AI is generating questions based on your lesson...'
                            : processingStatus.processing === 'completed'
                            ? 'Assessment generated successfully!'
                            : 'Processing encountered an error.'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={handleClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Assessment'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerateAssessmentFromLessonDialog;