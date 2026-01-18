import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { examResultsService } from '@/services/examResultsService';
import { ExamResultsSummaryCards } from '@/components/examResults/ExamResultsSummaryCards';
import { ExamResultsBySubject } from '@/components/examResults/ExamResultsBySubject';
import { ExamResultsByStudent } from '@/components/examResults/ExamResultsByStudent';
import { StudentResponsesDialog } from '@/components/examResults/StudentResponsesDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const ExamWeekResults: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{ userId: string; name: string } | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date('2025-12-15'),
    to: new Date('2026-01-17')
  });

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '2025-12-15';
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '2026-01-17';

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['examSummary', startDate, endDate],
    queryFn: () => examResultsService.getExamWeekSummary(startDate, endDate)
  });

  const { data: subjectResults, isLoading: subjectLoading } = useQuery({
    queryKey: ['examResultsBySubject', startDate, endDate],
    queryFn: () => examResultsService.getResultsBySubject(startDate, endDate)
  });

  const { data: studentResults, isLoading: studentLoading } = useQuery({
    queryKey: ['examResultsByStudent', startDate, endDate],
    queryFn: () => examResultsService.getResultsByStudent(startDate, endDate)
  });

  const handleExport = async () => {
    try {
      const csv = await examResultsService.exportResultsCSV(startDate, endDate);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-results-${startDate}-to-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Results exported successfully');
    } catch (error) {
      toast.error('Failed to export results');
    }
  };

  const handleViewSubjectDetails = (assessmentId: string, assessmentTitle: string) => {
    toast.info(`Viewing details for: ${assessmentTitle}`);
    // Could navigate to a detailed view or open a dialog
  };

  const handleViewStudent = (userId: string, studentName: string) => {
    setSelectedStudent({ userId, name: studentName });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exam Week Results</h1>
          <p className="text-muted-foreground">
            Winter Term Exam results overview
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarDays className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Select date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <ExamResultsSummaryCards summary={summary} isLoading={summaryLoading} />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="students">By Student</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <ExamResultsBySubject
            results={subjectResults || []}
            isLoading={subjectLoading}
            onViewDetails={handleViewSubjectDetails}
          />
        </TabsContent>

        <TabsContent value="students">
          <ExamResultsByStudent
            results={studentResults || []}
            isLoading={studentLoading}
            onViewStudent={handleViewStudent}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>

      <StudentResponsesDialog
        open={!!selectedStudent}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
        userId={selectedStudent?.userId || ''}
        studentName={selectedStudent?.name || ''}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

export default ExamWeekResults;
