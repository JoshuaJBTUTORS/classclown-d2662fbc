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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
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
  preSelectedLessonId?: string;
  preloadedLessonData?: any;
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

const AssignHomeworkDialog: React.FC<AssignHomeworkDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingHomework,
  preSelectedLessonId,
  preloadedLessonData
}) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  const [existingAttachmentType, setExistingAttachmentType] = useState<string | null>(null);
  const [preSelectedLesson, setPreSelectedLesson] = useState<Lesson | null>(null);
  
  const isEditing = Boolean(editingHomework);
  const isMobile = useIsMobile();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingHomework?.title || "",
      description: editingHomework?.description || "",
      lesson_id: preSelectedLessonId || editingHomework?.lesson_id || "",
      due_date: editingHomework?.due_date ? new Date(editingHomework.due_date) : undefined,
      attachment: undefined,
    },
  });

  const sendHomeworkNotification = async (homeworkId: string) => {
    try {
      console.log('Sending homework notification for:', homeworkId);
      
      const { data, error } = await supabase.functions.invoke('send-homework-notification', {
        body: { homeworkId }
      });

      if (error) {
        console.error('Error sending homework notification:', error);
        toast.error('Homework assigned but failed to send notifications');
      } else {
        console.log('Homework notification sent successfully:', data);
        toast.success('Homework assigned and notifications sent!');
      }
    } catch (error) {
      console.error('Error invoking homework notification function:', error);
      toast.error('Homework assigned but failed to send notifications');
    }
  };

  // Effect to set preSelectedLessonId when it changes
  useEffect(() => {
    if (preSelectedLessonId) {
      form.setValue('lesson_id', preSelectedLessonId);
      
      // If we have preloaded data, use it instead of fetching again
      if (preloadedLessonData && preloadedLessonData.id === preSelectedLessonId) {
        const data = preloadedLessonData;
        setPreSelectedLesson({
          id: data.id,
          title: data.title,
          tutor_first_name: data.tutor.first_name,
          tutor_last_name: data.tutor.last_name
        });
      } else {
        fetchPreSelectedLesson(preSelectedLessonId);
      }
    }
  }, [preSelectedLessonId, form, preloadedLessonData]);

  // Fetch pre-selected lesson details
  const fetchPreSelectedLesson = async (lessonId: string) => {
    // Skip fetch if we already have the preloaded data
    if (preloadedLessonData && preloadedLessonData.id === lessonId) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          tutor:tutors(first_name, last_name)
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      if (data) {
        setPreSelectedLesson({
          id: data.id,
          title: data.title,
          tutor_first_name: data.tutor.first_name,
          tutor_last_name: data.tutor.last_name
        });
      }
    } catch (error) {
      console.error('Error fetching pre-selected lesson:', error);
    }
  };

  // Fetch lessons on component mount
  useEffect(() => {
    if (isOpen) {
      // If we have a preSelectedLessonId and preloadedLessonData, we don't need to fetch all lessons immediately
      // This improves initial load time
      if (!(preSelectedLessonId && preloadedLessonData)) {
        fetchLessons();
      }

      if (editingHomework?.attachment_url) {
        setExistingAttachmentUrl(editingHomework.attachment_url);
        setExistingAttachmentType(editingHomework.attachment_type || null);
      }
    }
  }, [isOpen, editingHomework, preSelectedLessonId, preloadedLessonData]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          tutor:tutors(first_name, last_name)
        `)
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
    console.log("Submitting homework data:", data);
    setLoading(true);
    
    try {
      let attachmentUrl = existingAttachmentUrl;
      let attachmentType = existingAttachmentType;
      
      // Upload file if provided
      if (data.attachment) {
        const fileExt = data.attachment.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        try {
          // Upload the file to Supabase Storage
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('homework')
            .upload(filePath, data.attachment, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error("File upload error:", uploadError);
            throw uploadError;
          }
          
          // Get the public URL of the uploaded file
          const { data: urlData } = supabase.storage
            .from('homework')
            .getPublicUrl(filePath);
          
          attachmentUrl = urlData.publicUrl;
          attachmentType = fileExt;
          console.log("File uploaded successfully:", attachmentUrl);
        } catch (uploadError) {
          console.error("Error during file upload:", uploadError);
          toast.error("Failed to upload file. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Prepare the homework data
      const homeworkData = {
        title: data.title,
        description: data.description || null,
        lesson_id: data.lesson_id,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      };

      console.log("Saving homework with data:", homeworkData);

      // Use upsert to avoid RLS issues - this performs either an insert or update
      const { error, data: insertData } = await supabase
        .from('homework')
        .upsert(
          isEditing && editingHomework 
            ? { ...homeworkData, id: editingHomework.id } 
            : homeworkData
        )
        .select();

      if (error) {
        console.error(isEditing ? "Error updating homework:" : "Error inserting homework:", error);
        throw error;
      }
      
      console.log(isEditing ? "Homework updated successfully:" : "Homework created successfully:", insertData);
      
      // Send notification emails only for new homework (not when editing)
      if (!isEditing && insertData && insertData[0]) {
        await sendHomeworkNotification(insertData[0].id);
      } else {
        toast.success(isEditing ? 'Homework updated successfully!' : 'Homework assigned successfully!');
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
      <DialogContent className={`sm:max-w-[550px] ${isMobile ? 'max-h-[90vh] h-[90vh]' : ''} flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditing ? 'Edit Homework' : 'Assign New Homework'}</DialogTitle>
          <DialogDescription>
            Create an assignment for students to complete after their lesson
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className={`flex-1 ${isMobile ? 'pr-4' : ''}`}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!preSelectedLessonId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            preSelectedLesson 
                              ? `${preSelectedLesson.title} (${preSelectedLesson.tutor_first_name} ${preSelectedLesson.tutor_last_name})`
                              : "Select a lesson"
                          } />
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
                      {preSelectedLessonId ? "Lesson is pre-selected based on your current session" : "Choose the lesson this homework is related to"}
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
                        className={`${isMobile ? 'min-h-[100px]' : 'min-h-[120px]'}`}
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
                          className="p-3 pointer-events-auto"
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

              {/* Add some bottom padding for mobile to ensure last field is scrollable */}
              <div className={`${isMobile ? 'h-6' : ''}`} />
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="homework-form" disabled={loading} onClick={form.handleSubmit(onSubmit)}>
            {loading ? (isEditing ? "Updating..." : "Assigning...") : (isEditing ? "Update Homework" : "Assign Homework")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignHomeworkDialog;
