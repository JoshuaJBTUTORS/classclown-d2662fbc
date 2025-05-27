
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Clock, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAttendanceManager } from '@/hooks/useAttendanceManager';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

interface StudentAttendanceRowProps {
  student: Student;
  lessonId: string;
  lessonData: {
    title: string;
    start_time: string;
    tutor?: { first_name: string; last_name: string };
  };
  isStudent?: boolean;
}

const StudentAttendanceRow: React.FC<StudentAttendanceRowProps> = ({
  student,
  lessonId,
  lessonData,
  isStudent = false
}) => {
  const { markAttendance, sendLateNotification, getAttendanceData, isUpdating, isSendingNotification } = useAttendanceManager();
  const [attendanceStatus, setAttendanceStatus] = useState<string>('pending');
  const [lastMarked, setLastMarked] = useState<string | null>(null);

  const studentName = `${student.first_name} ${student.last_name}`;

  useEffect(() => {
    loadAttendanceData();
  }, [lessonId, student.id]);

  const loadAttendanceData = async () => {
    const attendanceData = await getAttendanceData(lessonId);
    const studentAttendance = attendanceData.find(a => a.student_id === student.id);
    
    if (studentAttendance) {
      setAttendanceStatus(studentAttendance.attendance_status);
      setLastMarked(studentAttendance.marked_at);
    }
  };

  const handleMarkAttendance = async (status: 'attended' | 'absent' | 'excused') => {
    const success = await markAttendance(lessonId, student.id, status);
    if (success) {
      setAttendanceStatus(status);
      setLastMarked(new Date().toISOString());
    }
  };

  const handleSendLateNotification = async () => {
    const success = await sendLateNotification(lessonId, student.id, lessonData, studentName);
    if (success) {
      setAttendanceStatus('late');
      setLastMarked(new Date().toISOString());
    }
  };

  const getStatusBadge = () => {
    switch (attendanceStatus) {
      case 'attended':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Attended</Badge>;
      case 'late':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />Late</Badge>;
      case 'absent':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Absent</Badge>;
      case 'excused':
        return <Badge variant="secondary">Excused</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
      <div className="flex items-center gap-3">
        <div>
          <p className="font-medium">{studentName}</p>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge()}
            {lastMarked && (
              <span className="text-xs text-muted-foreground">
                {new Date(lastMarked).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Only show attendance controls for non-students */}
      {!isStudent && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendLateNotification}
            disabled={isSendingNotification || isUpdating}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            {isSendingNotification ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-1"></div>
                Sending...
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Late
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Mark Attendance
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleMarkAttendance('attended')}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Mark as Attended
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarkAttendance('absent')}>
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                Mark as Absent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarkAttendance('excused')}>
                <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
                Excused Absence
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceRow;
