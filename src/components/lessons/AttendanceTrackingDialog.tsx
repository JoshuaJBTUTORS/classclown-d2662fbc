
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCheck, Clock, UserX } from 'lucide-react';

interface AttendanceTrackingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string | null;
  lessonData: any;
  onSuccess: () => void;
}

interface StudentAttendance {
  studentId: number;
  status: 'attended' | 'absent' | 'late';
  notes: string;
}

const AttendanceTrackingDialog: React.FC<AttendanceTrackingDialogProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonData,
  onSuccess
}) => {
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && lessonData?.lesson_students) {
      // Initialize attendance data for all students
      const initialAttendance = lessonData.lesson_students.map((ls: any) => ({
        studentId: ls.student.id,
        status: 'attended' as const,
        notes: ''
      }));
      setAttendanceData(initialAttendance);
    }
  }, [isOpen, lessonData]);

  const updateStudentAttendance = (studentId: number, field: keyof StudentAttendance, value: string) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.studentId === studentId 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!lessonId) return;

    setIsSubmitting(true);
    try {
      // Insert attendance records
      const attendanceRecords = attendanceData.map(attendance => ({
        lesson_id: lessonId,
        student_id: attendance.studentId,
        attendance_status: attendance.status,
        notes: attendance.notes || null
      }));

      const { error: attendanceError } = await supabase
        .from('lesson_attendance')
        .insert(attendanceRecords);

      if (attendanceError) throw attendanceError;

      // Mark lesson as attendance completed
      const { error: lessonError } = await supabase
        .from('lessons')
        .update({ attendance_completed: true })
        .eq('id', lessonId);

      if (lessonError) throw lessonError;

      toast.success('Attendance recorded successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attended':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <UserX className="h-4 w-4 text-red-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-sm text-muted-foreground">
            Mark attendance for all students in this lesson
          </div>

          {lessonData?.lesson_students?.map((ls: any) => {
            const attendance = attendanceData.find(a => a.studentId === ls.student.id);
            if (!attendance) return null;

            return (
              <div key={ls.student.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {ls.student.first_name} {ls.student.last_name}
                  </h4>
                  {getStatusIcon(attendance.status)}
                </div>

                <div>
                  <Label className="text-sm font-medium">Attendance Status</Label>
                  <RadioGroup
                    value={attendance.status}
                    onValueChange={(value) => 
                      updateStudentAttendance(ls.student.id, 'status', value)
                    }
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="attended" id={`attended-${ls.student.id}`} />
                      <Label htmlFor={`attended-${ls.student.id}`} className="text-sm">
                        Present
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="late" id={`late-${ls.student.id}`} />
                      <Label htmlFor={`late-${ls.student.id}`} className="text-sm">
                        Late
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="absent" id={`absent-${ls.student.id}`} />
                      <Label htmlFor={`absent-${ls.student.id}`} className="text-sm">
                        Absent
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor={`notes-${ls.student.id}`} className="text-sm font-medium">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id={`notes-${ls.student.id}`}
                    value={attendance.notes}
                    onChange={(e) => 
                      updateStudentAttendance(ls.student.id, 'notes', e.target.value)
                    }
                    placeholder="Add any notes about this student's attendance..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Save Attendance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceTrackingDialog;
