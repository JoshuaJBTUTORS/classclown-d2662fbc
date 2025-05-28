
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getCompletedLessons } from '@/services/lessonCompletionService';

interface AbsenceLessonData {
  lesson_id: string;
  lesson_title: string;
  lesson_date: string;
  duration_hours: number;
  tutor_name: string;
  subject: string;
  absent_students: string[];
}

interface StudentAbsenceReportProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedTutors: string[];
    selectedSubjects: string[];
  };
}

const StudentAbsenceReport: React.FC<StudentAbsenceReportProps> = ({ filters }) => {
  const [data, setData] = useState<AbsenceLessonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbsenceData();
  }, [filters]);

  const fetchAbsenceData = async () => {
    setLoading(true);
    try {
      // Get completed lessons using the proper completion logic
      const completedLessons = await getCompletedLessons(filters);

      const absenceLessons: AbsenceLessonData[] = [];

      // For each completed lesson, check if all students were absent
      for (const lesson of completedLessons) {
        // Get students enrolled in this lesson
        const { data: lessonStudents } = await supabase
          .from('lesson_students')
          .select(`
            student_id,
            students!inner(
              first_name,
              last_name
            )
          `)
          .eq('lesson_id', lesson.id);

        if (lessonStudents && lessonStudents.length > 0) {
          // Get attendance for this lesson
          const { data: attendanceData } = await supabase
            .from('lesson_attendance')
            .select('student_id, attendance_status')
            .eq('lesson_id', lesson.id);

          if (attendanceData && attendanceData.length > 0) {
            // Check if all students were absent
            const allAbsent = lessonStudents.every(ls => 
              attendanceData.some(att => 
                att.student_id === ls.student_id && att.attendance_status === 'absent'
              )
            );

            if (allAbsent) {
              const start = new Date(lesson.start_time);
              const end = new Date(lesson.end_time);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

              const absentStudents = lessonStudents.map(ls => 
                `${ls.students.first_name} ${ls.students.last_name}`
              );

              absenceLessons.push({
                lesson_id: lesson.id,
                lesson_title: lesson.title,
                lesson_date: lesson.start_time,
                duration_hours: Math.round(duration * 10) / 10,
                tutor_name: `${lesson.tutors.first_name} ${lesson.tutors.last_name}`,
                subject: lesson.subject || 'General',
                absent_students: absentStudents
              });
            }
          }
        }
      }

      // Sort by date descending
      absenceLessons.sort((a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime());

      setData(absenceLessons);
    } catch (error) {
      console.error('Error fetching absence data:', error);
      toast.error('Failed to load absence data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Lesson Title', 'Date', 'Duration (hrs)', 'Tutor', 'Subject', 'Absent Students'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.lesson_title,
        format(new Date(row.lesson_date), 'yyyy-MM-dd HH:mm'),
        row.duration_hours,
        row.tutor_name,
        row.subject,
        `"${row.absent_students.join(', ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-absence-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalLostHours = data.reduce((sum, lesson) => sum + lesson.duration_hours, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Absence Report</CardTitle>
          <CardDescription>Loading absence data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e94b7f]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Student Absence Report</CardTitle>
          <CardDescription>
            Lessons where all enrolled students were absent
            {data.length > 0 && (
              <span className="block mt-1 text-orange-600 font-medium">
                Total lost hours: {Math.round(totalLostHours * 10) / 10}h across {data.length} lessons
              </span>
            )}
          </CardDescription>
        </div>
        {data.length > 0 && (
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Absent Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((lesson) => (
                <TableRow key={lesson.lesson_id}>
                  <TableCell className="font-medium">{lesson.lesson_title}</TableCell>
                  <TableCell>
                    {format(new Date(lesson.lesson_date), 'MMM d, yyyy')}
                    <br />
                    <span className="text-sm text-gray-500">
                      {format(new Date(lesson.lesson_date), 'h:mm a')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {lesson.duration_hours}h
                    </Badge>
                  </TableCell>
                  <TableCell>{lesson.tutor_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lesson.subject}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lesson.absent_students.map((student, index) => (
                        <Badge key={index} variant="destructive" className="text-xs mr-1">
                          {student}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-400">No absence data available</p>
            <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentAbsenceReport;
