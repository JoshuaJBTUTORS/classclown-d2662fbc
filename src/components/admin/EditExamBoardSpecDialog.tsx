import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const EXAM_BOARDS = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'Cambridge', 'CCEA', 'Eduqas'];

interface EditExamBoardSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specification: any;
}

interface FormData {
  subject_id: string;
  exam_board: string;
  title: string;
  description: string;
  specification_year: number;
  version: string;
  extracted_text: string;
}

const EditExamBoardSpecDialog = ({
  open,
  onOpenChange,
  specification,
}: EditExamBoardSpecDialogProps) => {
  const queryClient = useQueryClient();
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      subject_id: specification?.subject_id || '',
      exam_board: specification?.exam_board || '',
      title: specification?.title || '',
      description: specification?.description || '',
      specification_year: specification?.specification_year || new Date().getFullYear(),
      version: specification?.version || '',
      extracted_text: specification?.extracted_text || '',
    },
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('category', 'gcse')
        .order('name');
      
      if (data) setSubjects(data);
    };
    fetchSubjects();
  }, []);

  React.useEffect(() => {
    if (specification) {
      reset({
        subject_id: specification.subject_id || '',
        exam_board: specification.exam_board || '',
        title: specification.title,
        description: specification.description || '',
        specification_year: specification.specification_year || new Date().getFullYear(),
        version: specification.version || '',
        extracted_text: specification.extracted_text || '',
      });
    }
  }, [specification, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('exam_board_specifications')
        .update({
          subject_id: data.subject_id,
          exam_board: data.exam_board,
          title: data.title,
          description: data.description,
          specification_year: data.specification_year,
          version: data.version,
          extracted_text: data.extracted_text,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Exam Board Specification</DialogTitle>
          <DialogDescription>
            Update the details of this exam board specification
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject_id">Subject *</Label>
            <Select 
              value={specification?.subject_id || ''} 
              onValueChange={(value) => setValue('subject_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject_id && (
              <p className="text-sm text-destructive">{errors.subject_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam_board">Exam Board *</Label>
            <Select 
              value={specification?.exam_board || ''} 
              onValueChange={(value) => setValue('exam_board', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select exam board" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_BOARDS.map((board) => (
                  <SelectItem key={board} value={board}>
                    {board}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.exam_board && (
              <p className="text-sm text-destructive">{errors.exam_board.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., AQA GCSE Biology Specification 2024"
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
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specification_year">Year</Label>
              <Input
                id="specification_year"
                type="number"
                {...register('specification_year', { valueAsNumber: true })}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                {...register('version')}
                placeholder="v2.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extracted_text">Specification Content</Label>
            <Textarea
              id="extracted_text"
              {...register('extracted_text')}
              placeholder="=== Assessment Objectives (AOs) ===
[Paste your specification content here...]

=== Paper Structure ===
...

=== Marking Criteria ===
...

=== What Appears on Which Paper ===
...

=== Question Templates/Common Patterns ===
..."
              rows={15}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The specification content that Cleo will use for teaching
            </p>
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
