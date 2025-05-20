
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Check, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import { Separator } from '@/components/ui/separator';

interface LessonDetailsDialogProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLessonUpdated?: () => void;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  tutor_id: string;
  start_time: string;
  end_time: string;
  is_group: boolean;
  is_recurring: boolean;
  recurrence_interval: string | null;
  recurrence_day: string | null;
  recurrence_end_date: string | null;
  status: string;
  tutor: {
    id: string;
    first_name: string;
    last_name: string;
  };
  students: {
    id: number;
    first_name: string;
    last_name: string;
  }[];
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({ 
  lessonId, 
  isOpen, 
  onClose,
  onLessonUpdated 
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && lessonId) {
      fetchLessonDetails();
    }
  }, [isOpen, lessonId]);

  const fetchLessonDetails = async () => {
    if (!lessonId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      // Process the data
      const students = data.lesson_students.map((ls: any) => ls.student);
      setLesson({
        ...data,
        students,
        lesson_students: undefined
      });
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lesson) return;
    
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ status: newStatus })
        .eq('id', lesson.id);

      if (error) throw error;
      
      setLesson({...lesson, status: newStatus});
      toast.success(`Lesson marked as ${newStatus}`);
      if (onLessonUpdated) onLessonUpdated();
    } catch (error) {
      console.error('Error updating lesson status:', error);
      toast.error('Failed to update lesson status');
    }
  };

  const handleDelete = async () => {
    if (!lesson || !isDeleting) return;
    
    try {
      // First delete related lesson_students records
      const { error: studentError } = await supabase
        .from('lesson_students')
        .delete()
        .eq('lesson_id', lesson.id);

      if (studentError) throw studentError;
      
      // Then delete the lesson
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lesson.id);

      if (error) throw error;
      
      toast.success('Lesson deleted successfully');
      onClose();
      if (onLessonUpdated) onLessonUpdated();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'PPP p');
  };

  const renderRecurrenceInfo = () => {
    if (!lesson?.is_recurring) return null;
    
    return (
      <div className="mt-4 p-3 bg-muted/50 rounded-md">
        <h4 className="font-medium mb-1">Recurring Session</h4>
        <div className="text-sm">
          <p>
            <span className="font-medium">Frequency:</span> {' '}
            {lesson.recurrence_interval?.charAt(0).toUpperCase() + lesson.recurrence_interval?.slice(1) || 'N/A'}
          </p>
          {lesson.recurrence_day && (
            <p>
              <span className="font-medium">Day:</span> {' '}
              {lesson.recurrence_day.charAt(0).toUpperCase() + lesson.recurrence_day.slice(1)}
            </p>
          )}
          {lesson.recurrence_end_date && (
            <p>
              <span className="font-medium">Until:</span> {' '}
              {format(parseISO(lesson.recurrence_end_date), 'PPP')}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (isEditing && lesson) {
    return (
      <AddLessonForm 
        isOpen={true}
        onClose={() => setIsEditing(false)} 
        onSuccess={() => {
          fetchLessonDetails();
          setIsEditing(false);
          if (onLessonUpdated) onLessonUpdated();
        }}
        editingLesson={{
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || undefined,
          tutor_id: lesson.tutor_id,
          students: lesson.students,
          date: parseISO(lesson.start_time),
          start_time: format(parseISO(lesson.start_time), 'HH:mm'),
          end_time: format(parseISO(lesson.end_time), 'HH:mm'),
          is_group: lesson.is_group,
          is_recurring: lesson.is_recurring,
          recurrence_interval: lesson.recurrence_interval || undefined,
          recurrence_day: lesson.recurrence_day || undefined,
          recurrence_end_date: lesson.recurrence_end_date ? parseISO(lesson.recurrence_end_date) : undefined,
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        {loading ? (
          <div className="py-10 text-center">Loading lesson details...</div>
        ) : lesson ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>{lesson.title}</DialogTitle>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {isDeleting ? (
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={handleDelete}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setIsDeleting(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsDeleting(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>
              
            <div className="space-y-4">
              {lesson.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm">{lesson.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Tutor</h4>
                  <p className="text-sm">{lesson.tutor.first_name} {lesson.tutor.last_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Type</h4>
                  <Badge variant="secondary">{lesson.is_group ? 'Group' : 'Individual'}</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Students</h4>
                <div className="flex flex-wrap gap-1">
                  {lesson.students.map((student) => (
                    <Badge key={student.id} variant="outline">
                      {student.first_name} {student.last_name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Start</h4>
                  <p className="text-sm">{formatDateTime(lesson.start_time)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">End</h4>
                  <p className="text-sm">{formatDateTime(lesson.end_time)}</p>
                </div>
              </div>

              {renderRecurrenceInfo()}

              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="flex gap-2">
                  <Button
                    variant={lesson.status === 'scheduled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('scheduled')}
                  >
                    Scheduled
                  </Button>
                  <Button
                    variant={lesson.status === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('completed')}
                  >
                    Completed
                  </Button>
                  <Button
                    variant={lesson.status === 'cancelled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('cancelled')}
                  >
                    Cancelled
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-10 text-center">Lesson not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
