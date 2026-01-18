import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { StudentExamResult } from '@/services/examResultsService';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ExamResultsByStudentProps {
  results: StudentExamResult[];
  isLoading: boolean;
  onViewStudent: (userId: string, studentName: string) => void;
  searchQuery: string;
}

export const ExamResultsByStudent: React.FC<ExamResultsByStudentProps> = ({
  results,
  isLoading,
  onViewStudent,
  searchQuery
}) => {
  const [sortField, setSortField] = React.useState<'name' | 'exams' | 'date'>('exams');
  const [sortAsc, setSortAsc] = React.useState(false);

  const filteredResults = React.useMemo(() => {
    let filtered = results;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = results.filter(r => 
        r.studentName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.subjects.some(s => s.toLowerCase().includes(query))
      );
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case 'exams':
          comparison = a.examsCompleted - b.examsCompleted;
          break;
        case 'date':
          comparison = new Date(a.lastCompletedAt).getTime() - new Date(b.lastCompletedAt).getTime();
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [results, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: 'name' | 'exams' | 'date') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'exams' | 'date' }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="h-4 w-4 inline ml-1" /> : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results by Student</CardTitle>
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
        <CardTitle>Results by Student ({filteredResults.length} students)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('name')}
              >
                Student Name <SortIcon field="name" />
              </TableHead>
              <TableHead 
                className="text-center cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('exams')}
              >
                Exams Completed <SortIcon field="exams" />
              </TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead className="text-center">Total Score</TableHead>
              <TableHead 
                className="text-center cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('date')}
              >
                Last Completed <SortIcon field="date" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No students match your search' : 'No student results found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((result) => {
                const percentage = result.totalMarksAvailable > 0 
                  ? (result.totalMarksAchieved / result.totalMarksAvailable) * 100 
                  : 0;
                
                return (
                  <TableRow key={result.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.studentName}</p>
                        {result.email && (
                          <p className="text-xs text-muted-foreground">{result.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{result.examsCompleted}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {result.subjects.slice(0, 3).map((subject) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject.replace('GCSE ', '')}
                          </Badge>
                        ))}
                        {result.subjects.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.subjects.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${
                        percentage >= 70 ? 'text-green-600' :
                        percentage >= 50 ? 'text-yellow-600' : 'text-muted-foreground'
                      }`}>
                        {result.totalMarksAchieved}/{result.totalMarksAvailable}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {result.lastCompletedAt 
                        ? format(new Date(result.lastCompletedAt), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewStudent(result.userId, result.studentName)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
