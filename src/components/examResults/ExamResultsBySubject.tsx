import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { SubjectExamResult } from '@/services/examResultsService';
import { Skeleton } from '@/components/ui/skeleton';

interface ExamResultsBySubjectProps {
  results: SubjectExamResult[];
  isLoading: boolean;
  onViewDetails: (assessmentId: string, assessmentTitle: string) => void;
}

export const ExamResultsBySubject: React.FC<ExamResultsBySubjectProps> = ({
  results,
  isLoading,
  onViewDetails
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results by Subject ({results.length} exams)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Exam Title</TableHead>
              <TableHead className="text-center">Students Completed</TableHead>
              <TableHead className="text-center">Total Marks</TableHead>
              <TableHead className="text-center">Avg. Score</TableHead>
              <TableHead className="text-center">Avg. %</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No exam results found for this period
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow key={result.assessmentId}>
                  <TableCell className="font-medium">{result.subject}</TableCell>
                  <TableCell className="max-w-[250px] truncate" title={result.assessmentTitle}>
                    {result.assessmentTitle}
                  </TableCell>
                  <TableCell className="text-center">{result.studentsCompleted}</TableCell>
                  <TableCell className="text-center">{result.totalMarks}</TableCell>
                  <TableCell className="text-center">{result.averageScore}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${
                      result.averagePercentage >= 70 ? 'text-green-600' :
                      result.averagePercentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.averagePercentage}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(result.assessmentId, result.assessmentTitle)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
