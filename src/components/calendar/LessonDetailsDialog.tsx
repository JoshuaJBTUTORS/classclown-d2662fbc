
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  Users, 
  User, 
  BookOpen, 
  MapPin,
  Repeat,
  Trash2,
  Edit,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { Lesson } from '@/types/lesson';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import RecurringLessonDialog from '@/components/lessons/RecurringLessonDialog';
import LessonPlanSelector from '@/components/lessons/LessonPlanSelector';
import DeleteLessonButton from '@/components/lessons/DeleteLessonButton';

interface LessonDetailsDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLessonUpdated?: () => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  lesson,
  open,
  onOpenChange,
  onLessonUpdated
}) => {
  const { userRole, isAdmin, isOwner, isTutor } = useAuth();
  const [lessonPlanAssignment, setLessonPlanAssignment] = useState<any>(null);
  
  useEffect(() => {
    if (lesson?.id) {
      fetchLessonPlanAssignment();
    }
  }, [lesson?.id]);

  const fetchLessonPlanAssignment = async () => {
    if (!lesson?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('lesson_plan_assignments')
        .select(`
          *,
          lesson_plan:lesson_plans (*)
        `)
        .eq('lesson_id', lesson.id)
        .single();

      if (!error && data) {
        setLessonPlanAssignment(data);
      }
    } catch (error) {
      console.error('Error fetching lesson plan assignment:', error);
    }
  };

  if (!lesson) return null;

  const canModifyLesson = isAdmin || isOwner || (isTutor && lesson.tutor?.id);
  const canDeleteLesson = isAdmin || isOwner;

  const handleLessonDeleted = () => {
    onOpenChange(false);
    onLessonUpdated?.();
  };

  const handleLessonPlanAssigned = () => {
    fetchLessonPlanAssignment();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-5 w-5" />
            {lesson.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {format(new Date(lesson.start_time), 'PPP')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {format(new Date(lesson.start_time), 'HH:mm')} - {format(new Date(lesson.end_time), 'HH:mm')}
                </span>
              </div>
            </div>

            {/* Status and Type Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={lesson.status === 'completed' ? 'default' : 'secondary'}>
                {lesson.status}
              </Badge>
              {lesson.lesson_type && lesson.lesson_type !== 'regular' && (
                <Badge variant="outline">{lesson.lesson_type}</Badge>
              )}
              {lesson.is_group && (
                <Badge variant="outline">Group Lesson</Badge>
              )}
              {lesson.subject && (
                <Badge variant="outline">{lesson.subject}</Badge>
              )}
            </div>

            {/* Description */}
            {lesson.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">{lesson.description}</p>
              </div>
            )}

            {/* Lesson Plan Assignment */}
            {lessonPlanAssignment && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Assigned Lesson Plan</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Week {lessonPlanAssignment.lesson_plan.week_number}: {lessonPlanAssignment.lesson_plan.topic_title}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {lessonPlanAssignment.lesson_plan.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tutor Info */}
            {lesson.tutor && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tutor
                </h4>
                <p className="text-sm">
                  {lesson.tutor.first_name} {lesson.tutor.last_name}
                </p>
              </div>
            )}

            {/* Students */}
            {lesson.students && lesson.students.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({lesson.students.length})
                </h4>
                <div className="space-y-2">
                  {lesson.students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {student.first_name} {student.last_name}
                      </span>
                      {student.attendance_status && (
                        <Badge variant={student.attendance_status === 'present' ? 'default' : 'secondary'}>
                          {student.attendance_status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Room Information */}
            {(lesson.lesson_space_room_url || lesson.flexible_classroom_room_id) && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Virtual Room
                </h4>
                <p className="text-sm text-gray-600">
                  {lesson.lesson_space_room_url ? 'LessonSpace Room' : 'Flexible Classroom'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {canModifyLesson && lesson.status !== 'completed' && (
              <CompleteSessionDialog lesson={lesson} onSessionCompleted={onLessonUpdated}>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Complete Session
                </Button>
              </CompleteSessionDialog>
            )}

            {canModifyLesson && !lesson.is_recurring && (
              <RecurringLessonDialog
                lessonId={lesson.id}
                lessonTitle={lesson.title}
              >
                <Button size="sm" variant="outline">
                  <Repeat className="h-4 w-4 mr-1" />
                  Make Recurring
                </Button>
              </RecurringLessonDialog>
            )}

            {canModifyLesson && lesson.subject && !lessonPlanAssignment && (
              <LessonPlanSelector
                lessonId={lesson.id}
                subject={lesson.subject}
                lessonDate={lesson.start_time}
                onPlanAssigned={handleLessonPlanAssigned}
              >
                <Button size="sm" variant="outline">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Assign Plan
                </Button>
              </LessonPlanSelector>
            )}
          </div>

          <div className="flex gap-2">
            {canDeleteLesson && (
              <DeleteLessonButton
                lessonId={lesson.id}
                lessonTitle={lesson.title}
                onDeleted={handleLessonDeleted}
                size="sm"
              />
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
