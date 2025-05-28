
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, UserX, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getCompletedLessons } from '@/services/lessonCompletionService';

interface TutorAbsenceData {
  tutor_id: string;
  tutor_name: string;
  total_absence_hours: number;
  absence_lesson_count: number;
  absence_lessons: AbsenceLessonData[];
}

interface AbsenceLessonData {
  lesson_id: string;
  lesson_title: string;
  lesson_date: string;
  duration_hours: number;
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
  const [data, setData] = useState<TutorAbsenceData[]>([]);
  const [expandedTutors, setExpandedTutors] = useState<Set<string>>(new Set());
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
                subject: lesson.subject || 'General',
                absent_students: absentStudents
              });
            }
          }
        }
      }

      // Group absence lessons by tutor
      const tutorAbsenceMap = new Map<string, TutorAbsenceData>();

      for (const absenceLesson of absenceLessons) {
        // Find the corresponding completed lesson to get tutor info
        const completedLesson = completedLessons.find(cl => cl.id === absenceLesson.lesson_id);
        if (completedLesson) {
          const tutorKey = completedLesson.tutor_id;
          const tutorName = `${completedLesson.tutors.first_name} ${completedLesson.tutors.last_name}`;

          if (!tutorAbsenceMap.has(tutorKey)) {
            tutorAbsenceMap.set(tutorKey, {
              tutor_id: tutorKey,
              tutor_name: tutorName,
              total_absence_hours: 0,
              absence_lesson_count: 0,
              absence_lessons: []
            });
          }

          const tutorData = tutorAbsenceMap.get(tutorKey)!;
          tutorData.total_absence_hours += absenceLesson.duration_hours;
          tutorData.absence_lesson_count += 1;
          tutorData.absence_lessons.push(absenceLesson);
        }
      }

      // Convert to array and sort by total absence hours descending
      const tutorAbsenceData = Array.from(tutorAbsenceMap.values());
      tutorAbsenceData.sort((a, b) => b.total_absence_hours - a.total_absence_hours);

      // Sort lessons within each tutor by date descending
      tutorAbsenceData.forEach(tutor => {
        tutor.absence_lessons.sort((a, b) => new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime());
      });

      setData(tutorAbsenceData);
    } catch (error) {
      console.error('Error fetching absence data:', error);
      toast.error('Failed to load absence data');
    } finally {
      setLoading(false);
    }
  };

  const toggleTutorExpansion = (tutorId: string) => {
    const newExpanded = new Set(expandedTutors);
    if (newExpanded.has(tutorId)) {
      newExpanded.delete(tutorId);
    } else {
      newExpanded.add(tutorId);
    }
    setExpandedTutors(newExpanded);
  };

  const exportToCSV = () => {
    const headers = ['Tutor', 'Total Absence Hours', 'Absence Lessons Count', 'Lesson Title', 'Date', 'Duration (hrs)', 'Subject', 'Absent Students'];
    const csvRows = [];
    
    // Add header
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(tutor => {
      // Add tutor summary row
      csvRows.push([
        tutor.tutor_name,
        tutor.total_absence_hours,
        tutor.absence_lesson_count,
        '-- SUMMARY --',
        '',
        '',
        '',
        ''
      ].join(','));
      
      // Add detailed lesson rows
      tutor.absence_lessons.forEach(lesson => {
        csvRows.push([
          tutor.tutor_name,
          '',
          '',
          lesson.lesson_title,
          format(new Date(lesson.lesson_date), 'yyyy-MM-dd HH:mm'),
          lesson.duration_hours,
          lesson.subject,
          `"${lesson.absent_students.join(', ')}"`
        ].join(','));
      });
      
      // Add empty row between tutors
      csvRows.push('');
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tutor-absence-payroll-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAbsenceHours = data.reduce((sum, tutor) => sum + tutor.total_absence_hours, 0);
  const totalAbsenceLessons = data.reduce((sum, tutor) => sum + tutor.absence_lesson_count, 0);

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
          <CardTitle>Student Absence Report (Reduced Pay Hours)</CardTitle>
          <CardDescription>
            Lessons with all students absent - grouped by tutor for payroll processing
            {data.length > 0 && (
              <span className="block mt-1 text-orange-600 font-medium">
                Total reduced pay hours: {Math.round(totalAbsenceHours * 10) / 10}h across {totalAbsenceLessons} lessons ({data.length} tutors affected)
              </span>
            )}
          </CardDescription>
        </div>
        {data.length > 0 && (
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Payroll CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {/* Tutor Summary Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tutor Summary</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Reduced Pay Hours</TableHead>
                    <TableHead>Absence Lessons</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((tutor) => (
                    <React.Fragment key={tutor.tutor_id}>
                      <TableRow>
                        <TableCell className="font-medium">{tutor.tutor_name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-sm">
                            {Math.round(tutor.total_absence_hours * 10) / 10}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            {tutor.absence_lesson_count} lessons
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTutorExpansion(tutor.tutor_id)}
                            className="h-8 w-8 p-0"
                          >
                            {expandedTutors.has(tutor.tutor_id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details */}
                      {expandedTutors.has(tutor.tutor_id) && (
                        <TableRow>
                          <TableCell colSpan={4} className="p-0">
                            <div className="bg-gray-50 p-4 border-l-4 border-orange-200">
                              <h4 className="font-medium mb-2 text-orange-800">Detailed Absence Lessons for {tutor.tutor_name}</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Lesson</TableHead>
                                    <TableHead className="text-xs">Date & Time</TableHead>
                                    <TableHead className="text-xs">Duration</TableHead>
                                    <TableHead className="text-xs">Subject</TableHead>
                                    <TableHead className="text-xs">Absent Students</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {tutor.absence_lessons.map((lesson) => (
                                    <TableRow key={lesson.lesson_id}>
                                      <TableCell className="text-sm">{lesson.lesson_title}</TableCell>
                                      <TableCell className="text-sm">
                                        {format(new Date(lesson.lesson_date), 'MMM d')}
                                        <br />
                                        <span className="text-xs text-gray-500">
                                          {format(new Date(lesson.lesson_date), 'h:mm a')}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                                          {lesson.duration_hours}h
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        <Badge variant="secondary" className="text-xs">{lesson.subject}</Badge>
                                      </TableCell>
                                      <TableCell className="text-sm">
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
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
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
