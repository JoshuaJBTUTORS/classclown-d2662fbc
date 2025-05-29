
import React from 'react';
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: editingQuestion?.question_text || "",
      question_type: editingQuestion?.question_type || 'short_answer',
      marks_available: editingQuestion?.marks_available || 1,
      correct_answer: editingQuestion?.correct_answer || "",
      keywords: editingQuestion?.keywords?.join(', ') || "",
      image_url: editingQuestion?.image_url || "",
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const questionData = {
        assessment_id: assessmentId,
        question_number: 1, // Will be auto-calculated
        question_text: values.question_text,
        question_type: values.question_type,
        marks_available: values.marks_available,
        correct_answer: values.correct_answer,
        marking_scheme: {},
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()) : [],
        position: 1, // Will be auto-calculated
        image_url: values.image_url || null,
      };

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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
