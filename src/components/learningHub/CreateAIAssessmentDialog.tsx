
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, AlertCircle, Loader2, FileText, Upload, Download } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LESSON_SUBJECTS } from '@/constants/subjects';
import { parseCsv, downloadCsvTemplate, type CsvRow } from '@/utils/csvParser';

interface CreateAIAssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
  extract_type: z.string().optional(),
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
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, failed: 0 });
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    processing: 'idle',
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
      extract_type: "",
    },
  });

  const watchedSubject = form.watch('subject');
  // Only GCSE/Year 11 English uses extract-based assessments (not KS2, KS3, or Literature)
  const subjectLower = watchedSubject?.toLowerCase() || '';
  const isEnglishLanguage = subjectLower.includes('english') && 
    !subjectLower.includes('literature') &&
    !subjectLower.includes('ks2') &&
    !subjectLower.includes('ks3') &&
    (subjectLower.includes('gcse') || subjectLower.includes('year 11'));

  const createAssessmentMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Create assessment record with AI generation parameters
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
          questions_text: values.prompt, // Store the AI prompt in questions_text field
          processing_status: 'pending',
          is_ai_generated: true,
          created_by: user.user?.id,
          status: 'draft',
          extract_type: values.extract_type || null,
          ai_extraction_data: {
            numberOfQuestions: values.numberOfQuestions,
            topic: values.topic,
            prompt: values.prompt
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Start chunked AI processing (runs in background on server)
      setProcessingStatus({ processing: 'processing' });
      
      const { error: processError } = await supabase.functions.invoke('generate-assessment-chunked', {
        body: { 
          assessmentId: assessment.id,
          numberOfQuestions: values.numberOfQuestions,
          topic: values.topic,
          prompt: values.prompt
        }
      });

      if (processError) {
        console.error('AI processing error:', processError);
        // Don't throw - the background process will handle status updates
      }

      setProcessingStatus({ processing: 'completed' });
      return assessment;
    },
    onSuccess: () => {
      toast({
        title: "AI Assessment created",
        description: "Your assessment is being generated by AI. You can edit questions once processing is complete.",
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
    setCsvRows([]);
    setBulkProgress({ current: 0, total: 0, failed: 0 });
    setMode('single');
    onClose();
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      setCsvRows(rows);
      toast({
        title: "CSV loaded",
        description: `${rows.length} topics found`,
      });
    } catch (error) {
      toast({
        title: "CSV parsing error",
        description: error instanceof Error ? error.message : "Invalid CSV format",
        variant: "destructive",
      });
    }
  };

  const handleBulkSubmit = async () => {
    if (csvRows.length === 0) {
      toast({
        title: "No data",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    const values = form.getValues();
    setProcessingStatus({ processing: 'processing' });

    const { data: user } = await supabase.auth.getUser();

    try {
      // Call the new edge function with all CSV data
      const { data, error } = await supabase.functions.invoke('bulk-process-assessments', {
        body: {
          csvRows,
          commonFields: {
            subject: values.subject,
            exam_board: values.exam_board,
            year: values.year,
            paper_type: values.paper_type,
            time_limit_minutes: values.time_limit_minutes,
            total_marks: values.total_marks,
            numberOfQuestions: values.numberOfQuestions,
          },
          userId: user.user?.id,
        }
      });

      if (error) throw error;

      setProcessingStatus({ processing: 'completed' });
      toast({
        title: "Bulk job started!",
        description: `${data.created} assessments are being created in the background. You can continue using the app.`,
      });
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to start bulk job:', error);
      setProcessingStatus({ processing: 'error' });
      toast({
        title: "Error starting bulk job",
        description: error.message,
        variant: "destructive",
      });
    }
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

  const isBulkProcessing = mode === 'bulk' && processingStatus.processing === 'processing';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create AI-Generated Assessment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create single assessments or bulk upload via CSV
          </p>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'bulk')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Assessment</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((values) => createAssessmentMutation.mutate(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="GCSE Maths Paper 1" 
                      {...field} 
                    />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A brief description of the assessment" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
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
                name="exam_board"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Exam Board</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam board" />
                          </SelectTrigger>
                        </FormControl>
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

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2023" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paper_type"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Paper Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Foundation" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="time_limit_minutes"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Time Limit (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="60" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="total_marks"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This can be updated later
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* AI-specific fields */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">AI Generation Settings</h3>
              
              {/* English Language Extract Type Selection */}
              {isEnglishLanguage && (
                <FormField
                  control={form.control}
                  name="extract_type"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Extract Type</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select extract type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fiction">Fiction (Narrative/Story)</SelectItem>
                            <SelectItem value="non-fiction">Non-Fiction (Article/Essay)</SelectItem>
                            <SelectItem value="19th-century">19th Century Text</SelectItem>
                            <SelectItem value="21st-century">21st Century Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        The AI will generate an extract of this type, then create questions based on it
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEnglishLanguage ? 'Extract Theme/Topic' : 'Topic'}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={isEnglishLanguage 
                          ? "e.g., Isolation, conflict, a stormy night, childhood memories..." 
                          : "e.g., Algebraic equations, Cell biology, etc."
                        }
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {isEnglishLanguage 
                        ? 'The theme or topic for the generated extract'
                        : 'The main topic for question generation'
                      }
                    </FormDescription>
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
                      <Input 
                        type="number" 
                        min="1"
                        max="50"
                        placeholder="10" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      How many questions to generate (1-50)
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
                      <Textarea
                        placeholder={isEnglishLanguage 
                          ? "Create a compelling extract about a character facing a difficult decision. Include descriptive language, dialogue, and sensory details suitable for GCSE English Language analysis."
                          : "Create exam questions about algebraic equations suitable for GCSE level students. Include a mix of problem-solving and calculation questions with varying difficulty levels."
                        }
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEnglishLanguage 
                        ? 'Describe the extract content - the AI will generate a source text and then create questions based on it'
                        : 'Detailed instructions for the AI to generate questions'
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEnglishLanguage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>English Language Mode:</strong> The AI will first generate a source extract based on your theme/topic, 
                    then create comprehension, language analysis, structure, and evaluation questions based on that extract.
                  </p>
                </div>
              )}
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

                <DialogFooter className="pt-4">
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
                        Generating...
                      </>
                    ) : (
                      'Generate Assessment'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Form {...form}>
              <div className="space-y-4">
                {/* Common fields for all assessments */}
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Subject (applied to all)</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
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
                    name="exam_board"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Exam Board</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exam board" />
                              </SelectTrigger>
                            </FormControl>
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

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2024" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paper_type"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Paper Type</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Foundation" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfQuestions"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Questions per Topic</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            max="50"
                            placeholder="20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* CSV Upload */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Upload CSV File</h3>
                          <p className="text-sm text-muted-foreground">
                            Each row will create a separate assessment
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={downloadCsvTemplate}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvUpload}
                          className="flex-1"
                        />
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {csvRows.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Topic</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Prompt</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {csvRows.map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{row.topic}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {row.description || '-'}
                                  </TableCell>
                                  <TableCell className="text-sm max-w-[300px] truncate">
                                    {row.prompt}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Progress */}
                {isBulkProcessing && (
                  <Card className="bg-primary/5">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-medium">
                              Creating assessments... {bulkProgress.current} of {bulkProgress.total}
                            </span>
                          </div>
                          {bulkProgress.failed > 0 && (
                            <span className="text-sm text-destructive">
                              {bulkProgress.failed} failed
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <DialogFooter className="pt-4">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={handleClose} 
                    disabled={isBulkProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleBulkSubmit}
                    disabled={isBulkProcessing || csvRows.length === 0}
                  >
                    {isBulkProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating {bulkProgress.current}/{bulkProgress.total}
                      </>
                    ) : (
                      `Generate ${csvRows.length} Assessment${csvRows.length !== 1 ? 's' : ''}`
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAIAssessmentDialog;
