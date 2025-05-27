import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarIcon, Upload, X } from 'lucide-react';

interface AssignHomeworkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onHomeworkSuccess?: (lessonId: string, lessonData: any) => void;
  preSelectedLessonId?: string | null;
  preloadedLessonData?: any;
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

const AssignHomeworkDialog: React.FC<AssignHomeworkDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onHomeworkSuccess,
  preSelectedLessonId,
  preloadedLessonData,
  editingHomework
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isDateOpen, setIsDateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingHomework) {
        setTitle(editingHomework.title);
        setDescription(editingHomework.description || '');
        setSelectedLessonId(editingHomework.lesson_id);
        setDueDate(editingHomework.due_date);
      } else {
        setTitle('');
        setDescription('');
        setDueDate(undefined);
        setAttachment(null);
        
        if (preSelectedLessonId) {
          setSelectedLessonId(preSelectedLessonId);
        } else {
          setSelectedLessonId('');
          fetchLessons();
        }
      }
    }
  }, [isOpen, editingHomework, preSelectedLessonId]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          start_time,
          tutor:tutors(first_name, last_name)
        `)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    }
  };

  const uploadAttachment = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `homework/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedLessonId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let attachmentUrl = null;
      let attachmentType = null;

      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment);
        attachmentType = attachment.type;
      }

      const homeworkData = {
        title: title.trim(),
        description: description.trim() || null,
        lesson_id: selectedLessonId,
        due_date: dueDate?.toISOString() || null,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      };

      if (editingHomework) {
        const { error } = await supabase
          .from('homework')
          .update(homeworkData)
          .eq('id', editingHomework.id);

        if (error) throw error;
        toast.success('Homework updated successfully!');
      } else {
        const { error } = await supabase
          .from('homework')
          .insert([homeworkData]);

        if (error) throw error;
        toast.success('Homework assigned successfully!');
      }

      // If onHomeworkSuccess is provided (two-step workflow), call it
      if (onHomeworkSuccess && !editingHomework) {
        onHomeworkSuccess(selectedLessonId, preloadedLessonData);
      } else {
        onSuccess?.();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving homework:', error);
      toast.error('Failed to save homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingHomework ? 'Edit Homework' : 'Assign Homework'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter homework title"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Instructions</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed instructions for the homework"
              className="mt-1 min-h-[100px]"
            />
          </div>

          {!preSelectedLessonId && !editingHomework && (
            <div>
              <Label htmlFor="lesson">Lesson *</Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title} - {format(new Date(lesson.start_time), 'MMM d, yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Due Date</Label>
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal mt-1"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setIsDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="attachment">Attachment</Label>
            <div className="mt-1">
              {attachment ? (
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="text-sm truncate">{attachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload file</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (editingHomework ? 'Update' : 'Assign Homework')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignHomeworkDialog;
