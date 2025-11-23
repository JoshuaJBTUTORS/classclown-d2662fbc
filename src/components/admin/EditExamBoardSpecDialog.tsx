import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditExamBoardSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specification: any;
}

interface FormData {
  title: string;
  description: string;
  specification_year: number;
}

const EditExamBoardSpecDialog = ({
  open,
  onOpenChange,
  specification,
}: EditExamBoardSpecDialogProps) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: specification?.title || '',
      description: specification?.description || '',
      specification_year: specification?.specification_year || new Date().getFullYear(),
    },
  });

  React.useEffect(() => {
    if (specification) {
      reset({
        title: specification.title,
        description: specification.description || '',
        specification_year: specification.specification_year || new Date().getFullYear(),
      });
    }
  }, [specification, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('exam_board_specifications')
        .update({
          title: data.title,
          description: data.description,
          specification_year: data.specification_year,
        })
        .eq('id', specification.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Specification updated');
      queryClient.invalidateQueries({ queryKey: ['exam-board-specifications'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating specification:', error);
      toast.error('Failed to update specification');
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Exam Board Specification</DialogTitle>
          <DialogDescription>
            Update the details of this exam board specification
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Edexcel GCSE Maths (9-1)"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this specification..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specification_year">Specification Year</Label>
            <Input
              id="specification_year"
              type="number"
              {...register('specification_year', { 
                required: 'Year is required',
                min: { value: 2000, message: 'Year must be 2000 or later' },
                max: { value: 2100, message: 'Year must be before 2100' }
              })}
              placeholder="2024"
            />
            {errors.specification_year && (
              <p className="text-sm text-destructive">{errors.specification_year.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExamBoardSpecDialog;
