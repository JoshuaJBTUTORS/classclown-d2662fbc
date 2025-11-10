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
import { Upload } from 'lucide-react';

const EXAM_BOARDS = ['AQA', 'Edexcel', 'OCR', 'WJEC', 'Cambridge', 'CCEA', 'Eduqas'];

const uploadSchema = z.object({
  subject_id: z.string().min(1, 'Please select a subject'),
  exam_board: z.string().min(1, 'Please select an exam board'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  specification_year: z.number().optional(),
  version: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadExamBoardSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

const UploadExamBoardSpecDialog: React.FC<UploadExamBoardSpecDialogProps> = ({
  open,
  onOpenChange,
  onUploadComplete,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const subjectId = watch('subject_id');
  const examBoard = watch('exam_board');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('pdf') && !file.type.includes('document')) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exam-board-specifications')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('exam-board-specifications')
        .getPublicUrl(fileName);

      // Insert specification record
      const { data: specData, error: insertError } = await supabase
        .from('exam_board_specifications')
        .insert({
          subject_id: data.subject_id,
          exam_board: data.exam_board,
          title: data.title,
          description: data.description || null,
          specification_year: data.specification_year || null,
          version: data.version || null,
          document_url: publicUrl,
          file_name: fileName, // Store the timestamped filename that was actually uploaded
          file_size_bytes: selectedFile.size,
          mime_type: selectedFile.type,
          status: 'draft',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to extract and summarize
      toast.info('Processing document... This may take a minute.');
      
      const { error: processError } = await supabase.functions.invoke('extract-specification-text', {
        body: { specificationId: specData.id },
      });

      if (processError) {
        console.error('Processing error:', processError);
        toast.warning('Document uploaded but processing failed. You can retry later.');
      } else {
        toast.success('Specification uploaded and processed successfully!');
      }

      reset();
      setSelectedFile(null);
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload specification');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Exam Board Specification</DialogTitle>
          <DialogDescription>
            Upload a specification document that Cleo will use for teaching
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject_id">Subject *</Label>
            <Select onValueChange={(value) => setValue('subject_id', value)}>
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
            <Select onValueChange={(value) => setValue('exam_board', value)}>
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
            <Label htmlFor="file">Specification Document (PDF/DOCX) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="flex-1"
              />
              {selectedFile && (
                <span className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                'Uploading...'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadExamBoardSpecDialog;
