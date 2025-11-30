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
          status: 'published',
          lesson_id: lesson.id,
          ai_extraction_data: {
            numberOfQuestions: values.numberOfQuestions,
            topic: values.topic,
            prompt: values.prompt,
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
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-md shadow-2xl rounded-xl border-0">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold text-[hsl(var(--deep-purple-blue))] flex items-center gap-3 font-playfair">
            <BookOpen className="h-6 w-6 text-[hsl(var(--medium-blue))]" />
            Create Assessment from Lesson
          </DialogTitle>
          <div className="space-y-3 mt-4">
            <p className="text-[hsl(var(--medium-blue))]/80 leading-relaxed">
              Let's create a personalized assessment based on <strong className="text-[hsl(var(--deep-purple-blue))]">{lesson.title}</strong>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-gradient-to-r from-[hsl(var(--medium-blue))]/10 to-[hsl(var(--light-green))]/10 text-[hsl(var(--deep-purple-blue))] border-0">{lesson.subject}</Badge>
              <Badge variant="outline" className="border-[hsl(var(--medium-blue))]/20 text-[hsl(var(--medium-blue))]">{lesson.lesson_students.length} students</Badge>
              <Badge variant="outline" className="border-[hsl(var(--medium-blue))]/20 text-[hsl(var(--medium-blue))]">{new Date(lesson.start_time).toLocaleDateString()}</Badge>
            </div>
          </div>
        </DialogHeader>

        {isLoadingLessonData ? (
          <div className="flex items-center justify-center py-12 bg-gradient-to-r from-[hsl(var(--light-green))]/5 to-[hsl(var(--medium-green))]/5 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin mr-3 text-[hsl(var(--medium-blue))]" />
            <span className="text-[hsl(var(--medium-blue))]">Loading lesson insights...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => createAssessmentMutation.mutate(values))} className="space-y-8">
              
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-[hsl(var(--deep-purple-blue))]/5 to-[hsl(var(--medium-blue))]/5 p-6 rounded-xl border border-[hsl(var(--medium-blue))]/10">
                <h3 className="text-lg font-semibold text-[hsl(var(--deep-purple-blue))] mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assessment Details
                </h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(var(--deep-purple-blue))] font-medium">What should we call this assessment?</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl border-[hsl(var(--medium-blue))]/20 focus:border-[hsl(var(--medium-blue))] transition-colors" />
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
                        <FormLabel className="text-[hsl(var(--deep-purple-blue))] font-medium">Brief description (optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="rounded-xl border-[hsl(var(--medium-blue))]/20 focus:border-[hsl(var(--medium-blue))] transition-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Assessment Configuration Section */}
              <div className="bg-gradient-to-r from-[hsl(var(--light-green))]/5 to-[hsl(var(--medium-green))]/5 p-6 rounded-xl border border-[hsl(var(--light-green))]/20">
                <h3 className="text-lg font-semibold text-[hsl(var(--deep-purple-blue))] mb-4">Assessment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(var(--deep-purple-blue))] font-medium">Subject</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="rounded-xl border-[hsl(var(--medium-blue))]/20">
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
                        <FormLabel className="text-[hsl(var(--deep-purple-blue))] font-medium">How many questions?</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="50" {...field} className="rounded-xl border-[hsl(var(--medium-blue))]/20 focus:border-[hsl(var(--medium-blue))] transition-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <FormField
                    control={form.control}
                    name="time_limit_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(var(--deep-purple-blue))] font-medium">Time Limit (min)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="rounded-xl border-[hsl(var(--medium-blue))]/20 focus:border-[hsl(var(--medium-blue))] transition-colors" />
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
                        <FormLabel className="text-[hsl(var(--deep-purple-blue))] font-medium">Total Marks</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="rounded-xl border-[hsl(var(--medium-blue))]/20 focus:border-[hsl(var(--medium-blue))] transition-colors" />
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
                        <FormLabel className="text-[hsl(var(--deep-purple-blue))] font-medium">Exam Board</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="rounded-xl border-[hsl(var(--medium-blue))]/20">
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
              </div>

              {/* Topic Focus Section */}
              <div className="bg-gradient-to-r from-[hsl(var(--medium-blue))]/5 to-[hsl(var(--deep-purple-blue))]/5 p-6 rounded-xl border border-[hsl(var(--deep-purple-blue))]/10">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-[hsl(var(--deep-purple-blue))] flex items-center gap-2">
                        What topics should we focus on?
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="mt-2 rounded-xl border-[hsl(var(--medium-blue))]/20 focus:border-[hsl(var(--medium-blue))] transition-colors" />
                      </FormControl>
                      <FormDescription className="text-[hsl(var(--medium-blue))]/70 mt-2">
                        We'll focus the assessment on these key areas from your lesson
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Lesson Context Section */}
              <div className="bg-gradient-to-r from-[hsl(var(--light-green))]/8 to-[hsl(var(--medium-green))]/8 p-6 rounded-xl border border-[hsl(var(--light-green))]/20">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-[hsl(var(--deep-purple-blue))] flex items-center gap-2">
                        Tell us more about the lesson
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[180px] mt-4 rounded-xl border-[hsl(var(--medium-blue))]/20 focus:border-[hsl(var(--medium-blue))] transition-colors bg-white/50 backdrop-blur-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-[hsl(var(--medium-blue))]/70 mt-3 leading-relaxed">
                        We've gathered insights from your lesson including student engagement, topics covered, and areas for improvement. Feel free to add any additional context that will help create better questions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Processing Status */}
              {processingStatus.processing !== 'idle' && (
                <Card className="bg-gradient-to-r from-[hsl(var(--medium-blue))]/10 to-[hsl(var(--light-green))]/10 border-[hsl(var(--medium-blue))]/20 rounded-xl shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(processingStatus.processing)}
                      <div className="flex-1">
                        <p className="font-semibold text-[hsl(var(--deep-purple-blue))]">Creating Your Assessment</p>
                        <p className="text-[hsl(var(--medium-blue))]/80 mt-1">
                          {processingStatus.processing === 'processing' 
                            ? 'Our AI is crafting personalized questions based on your lesson insights...'
                            : processingStatus.processing === 'completed'
                            ? 'Perfect! Your assessment has been generated successfully.'
                            : 'Something went wrong during processing. Please try again.'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="pt-6 border-t border-[hsl(var(--medium-blue))]/10">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={handleClose} 
                  disabled={isProcessing}
                  className="rounded-xl border-[hsl(var(--medium-blue))]/20 text-[hsl(var(--medium-blue))] hover:bg-[hsl(var(--medium-blue))]/5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  className="rounded-xl bg-gradient-to-r from-[hsl(var(--medium-blue))] to-[hsl(var(--deep-purple-blue))] hover:from-[hsl(var(--deep-purple-blue))] hover:to-[hsl(var(--medium-blue))] text-white border-0 shadow-lg transition-all duration-300"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Assessment...
                    </>
                  ) : (
                    'Create Assessment'
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