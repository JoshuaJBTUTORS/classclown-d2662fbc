
import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService, AssessmentQuestion } from '@/services/aiAssessmentService';
import ImageUploadField from './ImageUploadField';

interface CreateQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onSuccess: () => void;
  editingQuestion?: AssessmentQuestion | null;
  onEditClose?: () => void;
}

const formSchema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  question_type: z.enum(['multiple_choice', 'short_answer', 'extended_writing', 'calculation']),
  marks_available: z.coerce.number().int().positive().default(1),
  correct_answer: z.string().min(1, "Correct answer is required"),
  keywords: z.string().optional(),
  image_url: z.string().optional(),
  // MCQ specific fields
  option_a: z.string().optional(),
  option_b: z.string().optional(),
  option_c: z.string().optional(),
  option_d: z.string().optional(),
  correct_option: z.enum(['A', 'B', 'C', 'D']).optional(),
}).refine((data) => {
  // If it's MCQ, all options must be filled and a correct option selected
  if (data.question_type === 'multiple_choice') {
    return data.option_a && 
           data.option_b && 
           data.option_c && 
           data.option_d && 
           data.correct_option &&
           data.option_a.trim() !== '' &&
           data.option_b.trim() !== '' &&
           data.option_c.trim() !== '' &&
           data.option_d.trim() !== '';
  }
  return true;
}, {
  message: "For multiple choice questions, all options must be filled and a correct option must be selected",
  path: ["option_a"]
});

type FormValues = z.infer<typeof formSchema>;

const CreateQuestionDialog: React.FC<CreateQuestionDialogProps> = ({ 
  isOpen, 
  onClose, 
  assessmentId,
  onSuccess,
  editingQuestion,
  onEditClose
}) => {
  const { toast } = useToast();

  // Parse existing MCQ data if editing
  const getInitialMCQData = () => {
    if (!editingQuestion || editingQuestion.question_type !== 'multiple_choice') {
      return { option_a: '', option_b: '', option_c: '', option_d: '', correct_option: undefined };
    }

    const markingScheme = editingQuestion.marking_scheme;
    return {
      option_a: markingScheme?.options?.A || '',
      option_b: markingScheme?.options?.B || '',
      option_c: markingScheme?.options?.C || '',
      option_d: markingScheme?.options?.D || '',
      correct_option: editingQuestion.correct_answer as 'A' | 'B' | 'C' | 'D' | undefined,
    };
  };

  const initialMCQData = getInitialMCQData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: editingQuestion?.question_text || "",
      question_type: editingQuestion?.question_type || 'short_answer',
      marks_available: editingQuestion?.marks_available || 1,
      correct_answer: editingQuestion?.question_type === 'multiple_choice' ? editingQuestion.correct_answer : (editingQuestion?.correct_answer || ""),
      keywords: editingQuestion?.keywords?.join(', ') || "",
      image_url: editingQuestion?.image_url || "",
      ...initialMCQData,
    },
  });

  const watchQuestionType = form.watch('question_type');

  // Handle question type changes
  useEffect(() => {
    if (watchQuestionType === 'multiple_choice') {
      // Initialize MCQ fields if they're empty
      const currentValues = form.getValues();
      if (!currentValues.option_a) {
        form.setValue('option_a', '');
        form.setValue('option_b', '');
        form.setValue('option_c', '');
        form.setValue('option_d', '');
        form.setValue('correct_option', undefined);
      }
      // Clear correct_answer for MCQ since it uses correct_option instead
      form.setValue('correct_answer', '');
    } else {
      // Clear MCQ fields when switching away from multiple choice
      form.setValue('option_a', '');
      form.setValue('option_b', '');
      form.setValue('option_c', '');
      form.setValue('option_d', '');
      form.setValue('correct_option', undefined);
      // Reset correct_answer if it was empty
      if (!form.getValues('correct_answer')) {
        form.setValue('correct_answer', '');
      }
    }
  }, [watchQuestionType, form]);

  const createQuestionMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log('Submitting form values:', values);
      
      let questionData: any = {
        assessment_id: assessmentId,
        question_number: 1, // Will be auto-calculated
        question_text: values.question_text,
        question_type: values.question_type,
        marks_available: values.marks_available,
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()) : [],
        position: 1, // Will be auto-calculated
        image_url: values.image_url || null,
      };

      // Handle MCQ data
      if (values.question_type === 'multiple_choice') {
        questionData.correct_answer = values.correct_option;
        questionData.marking_scheme = {
          options: {
            A: values.option_a,
            B: values.option_b,
            C: values.option_c,
            D: values.option_d,
          },
          correct_answer: values.correct_option,
        };
      } else {
        questionData.correct_answer = values.correct_answer;
        questionData.marking_scheme = {};
      }

      console.log('Final question data:', questionData);

      if (editingQuestion) {
        return await aiAssessmentService.updateQuestion(editingQuestion.id, questionData);
      } else {
        return await aiAssessmentService.createQuestion(questionData);
      }
    },
    onSuccess: () => {
      toast({
        title: editingQuestion ? "Question updated" : "Question created",
        description: editingQuestion ? "Question has been updated successfully" : "Question has been added to the assessment",
      });
      onSuccess();
      form.reset();
      if (editingQuestion && onEditClose) {
        onEditClose();
      }
    },
    onError: (error) => {
      console.error('Error creating/updating question:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log('Form submitted with values:', values);
    console.log('Form errors:', form.formState.errors);
    createQuestionMutation.mutate(values);
  };

  const handleClose = () => {
    if (editingQuestion && onEditClose) {
      onEditClose();
    } else {
      onClose();
    }
    form.reset();
  };

  return (
    <Dialog open={isOpen || !!editingQuestion} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the question text..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadField
                      value={field.value}
                      onChange={field.onChange}
                      disabled={createQuestionMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="question_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="extended_writing">Extended Writing</SelectItem>
                          <SelectItem value="calculation">Calculation</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="marks_available"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks Available</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* MCQ Options - Only show for multiple choice questions */}
            {watchQuestionType === 'multiple_choice' && (
              <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-900">Multiple Choice Options</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="option_a"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option A *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter option A..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="option_b"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option B *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter option B..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="option_c"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option C *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter option C..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="option_d"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option D *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter option D..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="correct_option"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer *</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          value={field.value} 
                          onValueChange={field.onChange}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id="option-a" />
                            <Label htmlFor="option-a">A</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="B" id="option-b" />
                            <Label htmlFor="option-b">B</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="C" id="option-c" />
                            <Label htmlFor="option-c">C</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="D" id="option-d" />
                            <Label htmlFor="option-d">D</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Correct Answer - Only show for non-MCQ questions */}
            {watchQuestionType !== 'multiple_choice' && (
              <FormField
                control={form.control}
                name="correct_answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the correct answer or marking guidance..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords (comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="keyword1, keyword2, keyword3..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createQuestionMutation.isPending}>
                {createQuestionMutation.isPending 
                  ? (editingQuestion ? "Updating..." : "Creating...") 
                  : (editingQuestion ? "Update Question" : "Create Question")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestionDialog;
