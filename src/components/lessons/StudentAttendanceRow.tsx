
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
  student: Student | null;
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

  // Handle null student data gracefully
  if (!student || !student.id) {
    console.warn('StudentAttendanceRow: Missing student data', { student, lessonId });
    return (
      <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-gray-500">Student data unavailable</p>
            <Badge variant="outline" className="mt-1">
              Data Missing
            </Badge>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Unable to load student information
        </div>
      </div>
    );
  }

  const studentName = `${student.first_name} ${student.last_name}`;

  useEffect(() => {
    if (student.id) {
      loadAttendanceData();
    }
  }, [lessonId, student.id]);

  const loadAttendanceData = async () => {
    try {
      const attendanceData = await getAttendanceData(lessonId);
      const studentAttendance = attendanceData.find(a => a.student_id === student.id);
      
      if (studentAttendance) {
        setAttendanceStatus(studentAttendance.attendance_status);
        setLastMarked(studentAttendance.marked_at);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const handleMarkAttendance = async (status: 'attended' | 'absent' | 'excused') => {
    if (!student.id) {
      console.error('Cannot mark attendance: student ID is missing');
      return;
    }
    
    const success = await markAttendance(lessonId, student.id, status);
    if (success) {
      setAttendanceStatus(status);
      setLastMarked(new Date().toISOString());
    }
  };

  const handleSendLateNotification = async () => {
    if (!student.id) {
      console.error('Cannot send late notification: student ID is missing');
      return;
    }
    
    const success = await sendLateNotification(lessonId, student.id, lessonData, studentName);
    if (success) {
      setAttendanceStatus('late');
      setLastMarked(new Date().toISOString());
    }
  };

  const getStatusBadge = () => {
    switch (attendanceStatus) {
      case 'attended':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Attended</Badge>;
      case 'late':
        return <Badge variant="blue"><Clock className="h-3 w-3 mr-1" />Late</Badge>;
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
            disabled={isSendingNotification || isUpdating || !student.id}
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
                disabled={isUpdating || !student.id}
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
