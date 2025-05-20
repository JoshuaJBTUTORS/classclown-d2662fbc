
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  attendance_status: string;
}

interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  tutor_id: string;
  start_time: string;
  end_time: string;
  is_group: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  tutor?: Tutor;
  students?: Student[];
}

interface LessonDetailsDialogProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  lessonId,
  isOpen,
  onClose,
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonId && isOpen) {
      fetchLessonDetails(lessonId);
    }
  }, [lessonId, isOpen]);

  const fetchLessonDetails = async (id: string) => {
    setLoading(true);
    try {
      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;

      // Fetch tutor details
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('id, first_name, last_name, email')
        .eq('id', lessonData.tutor_id)
        .single();

      if (tutorError) throw tutorError;

      // Fetch student details
      const { data: lessonStudents, error: studentsError } = await supabase
        .from('lesson_students')
        .select('student_id, attendance_status')
        .eq('lesson_id', id);

      if (studentsError) throw studentsError;

      // If there are students, fetch their details
      let students: Student[] = [];
      if (lessonStudents && lessonStudents.length > 0) {
        const studentIds = lessonStudents.map(ls => ls.student_id);
        
        const { data: studentsData, error: studentsFetchError } = await supabase
          .from('students')
          .select('id, first_name, last_name, email')
          .in('id', studentIds);

        if (studentsFetchError) throw studentsFetchError;

        // Combine student data with attendance status
        students = studentsData.map(student => {
          const lessonStudent = lessonStudents.find(ls => ls.student_id === student.id);
          return {
            ...student,
            attendance_status: lessonStudent?.attendance_status || 'pending'
          };
        });
      }

      // Combine everything, ensuring the proper typing for status
      const status = lessonData.status as 'scheduled' | 'completed' | 'cancelled';
      
      setLesson({
        ...lessonData,
        status,
        tutor: tutorData,
        students: students
      });

    } catch (error) {
      console.error('Error fetching lesson details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!lesson) {
    return null;
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'present':
        return <Badge variant="default">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge variant="secondary">Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            {lesson.title}
            {getStatusBadge(lesson.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {lesson.description && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="text-base">{lesson.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <CalendarIcon className="w-4 h-4" /> Date
              </div>
              <p className="text-base">{formatDate(lesson.start_time)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Clock className="w-4 h-4" /> Time
              </div>
              <p className="text-base">
                {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Tutor</h3>
            <p className="text-base">
              {lesson.tutor?.first_name} {lesson.tutor?.last_name}
            </p>
          </div>

          {lesson.students && lesson.students.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                {lesson.is_group ? 'Students' : 'Student'}
                {lesson.is_group && (
                  <Badge variant="outline" className="ml-2">Group Lesson</Badge>
                )}
              </h3>
              <div className="space-y-2">
                {lesson.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                    <span>
                      {student.first_name} {student.last_name}
                    </span>
                    {getStatusBadge(student.attendance_status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
