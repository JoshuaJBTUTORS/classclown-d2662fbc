
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateAIAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  questionsText: z.string().min(50, "Questions content must be at least 50 characters"),
  answersText: z.string().min(50, "Answers content must be at least 50 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface ProcessingStatus {
  processing: 'idle' | 'processing' | 'completed' | 'error';
}

const CreateAIAssessmentDialog: React.FC<CreateAIAssessmentDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    processing: 'idle',
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      questionsText: "",
      answersText: "",
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Create assessment record with text content
      const { data: user } = await supabase.auth.getUser();
      const { data: assessment, error } = await supabase
        .from('ai_assessments')
        .insert({
          title: values.title,
          questions_text: values.questionsText,
          answers_text: values.answersText,
          processing_status: 'pending',
          is_ai_generated: true,
          created_by: user.user?.id,
          status: 'draft',
          total_marks: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Start AI processing
      setProcessingStatus({ processing: 'processing' });
      
      const { error: processError } = await supabase.functions.invoke('ai-process-assessment', {
        body: { assessmentId: assessment.id }
      });

      if (processError) {
        console.error('AI processing error:', processError);
        // Don't throw here - let the background process handle it
      }

      setProcessingStatus({ processing: 'completed' });
      return assessment;
    },
    onSuccess: () => {
      toast({
        title: "Assessment created",
        description: "Your assessment is being processed by AI. You'll be notified when it's ready.",
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create AI-Powered Assessment</DialogTitle>
          <p className="text-sm text-gray-600">
            Paste your exam questions and answer scheme below - AI will automatically extract and structure everything for you.
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => createAssessmentMutation.mutate(values))} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., GCSE Biology Paper 1 - June 2023" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Questions Text Input */}
              <FormField
                control={form.control}
                name="questionsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Questions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Paste your exam questions here, for example:

BIOLOGY EXAM PAPER
Time: 90 minutes
Total Marks: 60

Question 1 (10 marks)
Describe the structure and function of the cell membrane.

Question 2 (15 marks)
Explain the process of photosynthesis and its importance in ecosystems.

Question 3 (20 marks)
Compare and contrast mitosis and meiosis...`}
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Answers Text Input */}
              <FormField
                control={form.control}
                name="answersText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marking Scheme / Answer Key</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Paste your marking scheme here, for example:

BIOLOGY EXAM PAPER - MARKING SCHEME

Question 1 (10 marks)
Expected Answer: Cell membrane structure and function
- Phospholipid bilayer structure (3 marks)
- Selective permeability (3 marks)
- Transport mechanisms (4 marks)

Question 2 (15 marks)
Expected Answer: Photosynthesis process
- Light reactions (5 marks)
- Calvin cycle (5 marks)
- Ecosystem importance (5 marks)...`}
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Processing Status */}
            {processingStatus.processing !== 'idle' && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(processingStatus.processing)}
                    <div>
                      <p className="font-medium">AI Processing</p>
                      <p className="text-sm text-gray-600">
                        {processingStatus.processing === 'processing' 
                          ? 'AI is extracting questions and analyzing your content...'
                          : processingStatus.processing === 'completed'
                          ? 'Processing completed successfully!'
                          : 'Processing encountered an error.'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" type="button" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Assessment'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAIAssessmentDialog;
