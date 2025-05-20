
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarIcon, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignHomeworkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingHomework?: {
    id: string;
    title: string;
    description?: string;
    lesson_id: string;
    due_date?: Date;
    attachment_url?: string;
    attachment_type?: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  tutor_first_name: string;
  tutor_last_name: string;
}

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  lesson_id: z.string({ required_error: "Please select a lesson." }),
  due_date: z.date().optional(),
  attachment: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

const AssignHomeworkDialog: React.FC<AssignHomeworkDialogProps> = ({ isOpen, onClose, onSuccess, editingHomework }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  const [existingAttachmentType, setExistingAttachmentType] = useState<string | null>(null);
  
  const isEditing = Boolean(editingHomework);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingHomework?.title || "",
      description: editingHomework?.description || "",
      lesson_id: editingHomework?.lesson_id || "",
      due_date: editingHomework?.due_date,
      attachment: undefined,
    },
  });

  // Fetch lessons on component mount
  useEffect(() => {
    if (isOpen) {
      fetchLessons();

      if (editingHomework?.attachment_url) {
        setExistingAttachmentUrl(editingHomework.attachment_url);
        setExistingAttachmentType(editingHomework.attachment_type || null);
      }
    }
  }, [isOpen, editingHomework]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          tutor:tutors(first_name, last_name)
        `)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Transform data to include tutor names
      const formattedLessons = data.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        tutor_first_name: lesson.tutor.first_name,
        tutor_last_name: lesson.tutor.last_name,
      }));

      setLessons(formattedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to fetch lessons. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('attachment', file);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      let attachmentUrl = existingAttachmentUrl;
      let attachmentType = existingAttachmentType;
      
      // Upload file if provided
      if (data.attachment) {
        const fileExt = data.attachment.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `homework/${fileName}`;
        
        // Upload the file to Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('homework')
          .upload(filePath, data.attachment, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        
        // Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
          .from('homework')
          .getPublicUrl(filePath);
        
        attachmentUrl = urlData.publicUrl;
        attachmentType = fileExt;
      }

      const homeworkData = {
        title: data.title,
        description: data.description || null,
        lesson_id: data.lesson_id,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      };

      if (isEditing && editingHomework) {
        // Update the existing homework
        const { error } = await supabase
          .from('homework')
          .update(homeworkData)
          .eq('id', editingHomework.id);

        if (error) throw error;
        
        toast.success('Homework updated successfully!');
      } else {
        // Create a new homework
        const { error } = await supabase
          .from('homework')
          .insert(homeworkData);

        if (error) throw error;
        
        toast.success('Homework assigned successfully!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving homework:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'assign'} homework. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Homework' : 'Assign New Homework'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Algebra Equations Homework" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lesson_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Lesson</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lesson" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title} ({lesson.tutor_first_name} {lesson.tutor_last_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the lesson this homework is related to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter detailed instructions for the homework..."
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a due date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When should the homework be submitted by
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachment"
              render={() => (
                <FormItem>
                  <FormLabel>Attachment (Optional)</FormLabel>
                  <FormControl>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Input
                        id="attachment"
                        type="file"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a PDF, document, or worksheet
                  </FormDescription>
                  {existingAttachmentUrl && !selectedFile && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        type="button"
                        onClick={() => window.open(existingAttachmentUrl!, '_blank')}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        View current file
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditing ? "Updating..." : "Assigning...") : (isEditing ? "Update Homework" : "Assign Homework")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignHomeworkDialog;
