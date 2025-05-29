
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { aiAssessmentService, AIAssessment } from '@/services/aiAssessmentService';

interface EditAssessmentDetailsProps {
  assessment: AIAssessment;
  onUpdate: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  exam_board: z.string().optional(),
  year: z.coerce.number().int().positive().optional(),
  paper_type: z.string().optional(),
  time_limit_minutes: z.coerce.number().int().positive().optional(),
  total_marks: z.coerce.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

const EditAssessmentDetails: React.FC<EditAssessmentDetailsProps> = ({ 
  assessment, 
  onUpdate 
}) => {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: assessment.title,
      description: assessment.description || "",
      subject: assessment.subject || "",
      exam_board: assessment.exam_board || "",
      year: assessment.year || undefined,
      paper_type: assessment.paper_type || "",
      time_limit_minutes: assessment.time_limit_minutes || undefined,
      total_marks: assessment.total_marks,
    },
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await aiAssessmentService.updateAssessment(assessment.id, values);
    },
    onSuccess: () => {
      toast({
        title: "Assessment updated",
        description: "Assessment details have been saved successfully",
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error updating assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    updateAssessmentMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GCSE Maths">GCSE Maths</SelectItem>
                          <SelectItem value="GCSE English">GCSE English</SelectItem>
                          <SelectItem value="GCSE Biology">GCSE Biology</SelectItem>
                          <SelectItem value="GCSE Chemistry">GCSE Chemistry</SelectItem>
                          <SelectItem value="GCSE Physics">GCSE Physics</SelectItem>
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
                  <FormItem>
                    <FormLabel>Exam Board</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam board" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paper_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time_limit_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (minutes)</FormLabel>
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
            </div>

            <Button 
              type="submit" 
              disabled={updateAssessmentMutation.isPending}
            >
              {updateAssessmentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditAssessmentDetails;
