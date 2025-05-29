
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  questionsFile: z.instanceof(File).optional(),
  answersFile: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadStatus {
  questionsFile: 'idle' | 'uploading' | 'completed' | 'error';
  answersFile: 'idle' | 'uploading' | 'completed' | 'error';
  processing: 'idle' | 'processing' | 'completed' | 'error';
}

const CreateAIAssessmentDialog: React.FC<CreateAIAssessmentDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    questionsFile: 'idle',
    answersFile: 'idle',
    processing: 'idle',
  });
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [answersFile, setAnswersFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');
    
    const filePath = `${user.user.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('assessment-files')
      .upload(filePath, file);
    
    if (error) throw error;
    
    return filePath;
  };

  const createAssessmentMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!questionsFile || !answersFile) {
        throw new Error('Both questions and answers files are required');
      }

      // Upload questions file
      setUploadStatus(prev => ({ ...prev, questionsFile: 'uploading' }));
      const questionsPdfUrl = await uploadFile(questionsFile, 'questions');
      setUploadStatus(prev => ({ ...prev, questionsFile: 'completed' }));

      // Upload answers file
      setUploadStatus(prev => ({ ...prev, answersFile: 'uploading' }));
      const answersPdfUrl = await uploadFile(answersFile, 'answers');
      setUploadStatus(prev => ({ ...prev, answersFile: 'completed' }));

      // Create assessment record
      const { data: user } = await supabase.auth.getUser();
      const { data: assessment, error } = await supabase
        .from('ai_assessments')
        .insert({
          title: values.title,
          questions_pdf_url: questionsPdfUrl,
          answers_pdf_url: answersPdfUrl,
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
      setUploadStatus(prev => ({ ...prev, processing: 'processing' }));
      
      const { error: processError } = await supabase.functions.invoke('ai-process-assessment', {
        body: { assessmentId: assessment.id }
      });

      if (processError) {
        console.error('AI processing error:', processError);
        // Don't throw here - let the background process handle it
      }

      setUploadStatus(prev => ({ ...prev, processing: 'completed' }));
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
      setUploadStatus({
        questionsFile: 'error',
        answersFile: 'error',
        processing: 'error',
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setQuestionsFile(null);
    setAnswersFile(null);
    setUploadStatus({
      questionsFile: 'idle',
      answersFile: 'idle',
      processing: 'idle',
    });
    onClose();
  };

  const handleFileSelect = (file: File, type: 'questions' | 'answers') => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (type === 'questions') {
      setQuestionsFile(file);
    } else {
      setAnswersFile(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
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

  const isProcessing = uploadStatus.questionsFile === 'uploading' || 
                     uploadStatus.answersFile === 'uploading' || 
                     uploadStatus.processing === 'processing';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create AI-Powered Assessment</DialogTitle>
          <p className="text-sm text-gray-600">
            Upload your questions PDF and answer sheet - AI will automatically extract and structure everything for you.
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
                      placeholder="e.g., GCSE Maths Paper 1 - June 2023" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Questions File Upload */}
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    {getStatusIcon(uploadStatus.questionsFile)}
                    <h3 className="font-medium">Questions PDF</h3>
                    <p className="text-sm text-gray-500">Upload the exam paper with questions</p>
                    
                    {questionsFile ? (
                      <div className="text-sm">
                        <p className="font-medium">{questionsFile.name}</p>
                        <p className="text-gray-500">{(questionsFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file, 'questions');
                          }}
                          disabled={isProcessing}
                        />
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                          <Upload className="h-4 w-4" />
                          Select PDF
                        </div>
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Answers File Upload */}
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    {getStatusIcon(uploadStatus.answersFile)}
                    <h3 className="font-medium">Answer Sheet PDF</h3>
                    <p className="text-sm text-gray-500">Upload the marking scheme or answers</p>
                    
                    {answersFile ? (
                      <div className="text-sm">
                        <p className="font-medium">{answersFile.name}</p>
                        <p className="text-gray-500">{(answersFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file, 'answers');
                          }}
                          disabled={isProcessing}
                        />
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors">
                          <Upload className="h-4 w-4" />
                          Select PDF
                        </div>
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Processing Status */}
            {uploadStatus.processing !== 'idle' && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(uploadStatus.processing)}
                    <div>
                      <p className="font-medium">AI Processing</p>
                      <p className="text-sm text-gray-600">
                        {uploadStatus.processing === 'processing' 
                          ? 'AI is extracting questions and analyzing your files...'
                          : uploadStatus.processing === 'completed'
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
                disabled={!questionsFile || !answersFile || isProcessing}
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
