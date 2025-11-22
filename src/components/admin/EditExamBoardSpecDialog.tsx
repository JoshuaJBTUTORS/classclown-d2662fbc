import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';

const EXAM_BOARDS = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'Cambridge', 'CCEA', 'Eduqas'];

const editSchema = z.object({
  subject_id: z.string().min(1, 'Please select a subject'),
  exam_board: z.string().min(1, 'Please select an exam board'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  specification_year: z.number().optional(),
  version: z.string().optional(),
  extracted_text: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditExamBoardSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditComplete: () => void;
  specificationId: string | null;
}

const EditExamBoardSpecDialog: React.FC<EditExamBoardSpecDialogProps> = ({
  open,
  onOpenChange,
  onEditComplete,
  specificationId,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
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

  useEffect(() => {
    if (open && specificationId) {
      loadSpecification();
    }
  }, [open, specificationId]);

  const loadSpecification = async () => {
    if (!specificationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_board_specifications')
        .select('*')
        .eq('id', specificationId)
        .single();

      if (error) throw error;

      if (data) {
        setValue('subject_id', data.subject_id || '');
        setValue('exam_board', data.exam_board);
        setValue('title', data.title);
        setValue('description', data.description || '');
        setValue('specification_year', data.specification_year || undefined);
        setValue('version', data.version || '');
        setValue('extracted_text', data.extracted_text || '');
      }
    } catch (error: any) {
      console.error('Load error:', error);
      toast.error('Failed to load specification');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EditFormData) => {
    if (!specificationId) return;

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('exam_board_specifications')
        .update({
          subject_id: data.subject_id,
          exam_board: data.exam_board,
          title: data.title,
          description: data.description || null,
          specification_year: data.specification_year || null,
          version: data.version || null,
          extracted_text: data.extracted_text || null,
        })
        .eq('id', specificationId);

      if (updateError) throw updateError;

      toast.success('Specification updated successfully!');
      onEditComplete();
      reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update specification');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Exam Board Specification</DialogTitle>
          <DialogDescription>
            Update the specification document details
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject_id">Subject *</Label>
              <Select onValueChange={(value) => setValue('subject_id', value)} defaultValue={undefined}>
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
              <Select onValueChange={(value) => setValue('exam_board', value)} defaultValue={undefined}>
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
                {...register('title')}
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
                placeholder="Specification content..."
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Edit the specification text content
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditExamBoardSpecDialog;
