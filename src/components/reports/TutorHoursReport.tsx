
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileBarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TutorHoursData {
  tutor_id: string;
  tutor_name: string;
  lessons_completed: number;
  total_hours: number;
  average_duration: number;
}

interface TutorHoursReportProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedTutors: string[];
    selectedSubjects: string[];
  };
}

const TutorHoursReport: React.FC<TutorHoursReportProps> = ({ filters }) => {
  const [data, setData] = useState<TutorHoursData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorHoursData();
  }, [filters]);

  const fetchTutorHoursData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('lessons')
        .select(`
          id,
          tutor_id,
          start_time,
          end_time,
          subject,
          tutors!inner(
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'completed');

      // Apply filters
      if (filters.dateRange.from) {
        query = query.gte('start_time', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        query = query.lte('end_time', filters.dateRange.to.toISOString());
      }
      if (filters.selectedTutors.length > 0) {
        query = query.in('tutor_id', filters.selectedTutors);
      }
      if (filters.selectedSubjects.length > 0) {
        query = query.in('subject', filters.selectedSubjects);
      }

      const { data: lessons, error } = await query;

      if (error) throw error;

      // Group by tutor and calculate hours
      const tutorDataMap = new Map<string, TutorHoursData>();

      lessons?.forEach(lesson => {
        const tutorId = lesson.tutor_id;
        const tutorName = `${lesson.tutors.first_name} ${lesson.tutors.last_name}`;
        const start = new Date(lesson.start_time);
        const end = new Date(lesson.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        if (!tutorDataMap.has(tutorId)) {
          tutorDataMap.set(tutorId, {
            tutor_id: tutorId,
            tutor_name: tutorName,
            lessons_completed: 0,
            total_hours: 0,
            average_duration: 0
          });
        }

        const tutorData = tutorDataMap.get(tutorId)!;
        tutorData.lessons_completed++;
        tutorData.total_hours += hours;
      });

      // Calculate averages and convert to array
      const tutorDataArray = Array.from(tutorDataMap.values()).map(tutor => ({
        ...tutor,
        total_hours: Math.round(tutor.total_hours * 10) / 10,
        average_duration: Math.round((tutor.total_hours / tutor.lessons_completed) * 10) / 10
      }));

      // Sort by total hours descending
      tutorDataArray.sort((a, b) => b.total_hours - a.total_hours);

      setData(tutorDataArray);
    } catch (error) {
      console.error('Error fetching tutor hours data:', error);
      toast.error('Failed to load tutor hours data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Tutor Name', 'Lessons Completed', 'Total Hours', 'Average Duration (hrs)'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.tutor_name,
        row.lessons_completed,
        row.total_hours,
        row.average_duration
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tutor-hours-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tutor Hours Report</CardTitle>
          <CardDescription>Loading tutor hours data...</CardDescription>
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
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tutor Hours Chart</CardTitle>
            <CardDescription>Visual representation of hours completed by each tutor</CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="tutor_name" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-gray-900 mb-2">{label}</p>
                            <p className="text-[#e94b7f] font-medium">Total Hours: {data.total_hours}h</p>
                            <p className="text-blue-600 font-medium">Lessons: {data.lessons_completed}</p>
                            <p className="text-green-600 font-medium">Avg Duration: {data.average_duration}h</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="total_hours" 
                    fill="#e94b7f"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <div className="text-center">
                <FileBarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-400">No data available</p>
                <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Tutor Hours</CardTitle>
          <CardDescription>Complete breakdown of hours and lessons by tutor</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor Name</TableHead>
                  <TableHead className="text-right">Lessons Completed</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Average Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((tutor) => (
                  <TableRow key={tutor.tutor_id}>
                    <TableCell className="font-medium">{tutor.tutor_name}</TableCell>
                    <TableCell className="text-right">{tutor.lessons_completed}</TableCell>
                    <TableCell className="text-right">{tutor.total_hours}h</TableCell>
                    <TableCell className="text-right">{tutor.average_duration}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileBarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No tutor data available for the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorHoursReport;
