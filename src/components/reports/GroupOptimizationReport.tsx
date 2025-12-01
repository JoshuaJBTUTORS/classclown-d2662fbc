import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Users, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { analyzeAllUnderfilled, BulkOptimizationResult } from '@/services/groupOptimizationService';
import { toast } from 'sonner';

const GroupOptimizationReport: React.FC = () => {
  const [results, setResults] = useState<BulkOptimizationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | '1-student' | '2-student'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  useEffect(() => {
    loadOptimizationData();
  }, []);

  const loadOptimizationData = async () => {
    setIsLoading(true);
    try {
      const data = await analyzeAllUnderfilled();
      setResults(data);
      if (data.length === 0) {
        toast.info('No underfilled group lessons found');
      }
    } catch (error) {
      console.error('Error loading optimization data:', error);
      toast.error('Failed to load optimization data');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique subjects for filter
  const subjects = [...new Set(results.map(r => r.subject).filter(Boolean))];

  // Apply filters
  const filteredResults = results.filter(r => {
    if (filter === '1-student' && r.studentCount !== 1) return false;
    if (filter === '2-student' && r.studentCount !== 2) return false;
    if (subjectFilter !== 'all' && r.subject !== subjectFilter) return false;
    return true;
  });

  // Summary stats
  const totalUnderfilled = results.length;
  const oneStudentCount = results.filter(r => r.studentCount === 1).length;
  const twoStudentCount = results.filter(r => r.studentCount === 2).length;
  const mergeableCount = results.filter(r => r.mergeOpportunities.some(m => m.canMerge)).length;

  const handleExportCSV = () => {
    const headers = ['Lesson', 'Date/Time', 'Subject', 'Tutor', 'Students', 'Student Count', 'Recommendation', 'Merge Opportunities'];
    const rows = filteredResults.map(r => [
      r.lessonTitle,
      format(new Date(r.dateTime), 'dd/MM/yyyy HH:mm'),
      r.subject,
      r.tutor,
      r.currentStudents.join('; '),
      r.studentCount.toString(),
      r.recommendation.replace(/[✅🕐⚠️]/g, ''),
      r.mergeOpportunities.filter(m => m.canMerge).map(m => `${m.targetLesson} (${m.currentSize} students)`).join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-optimization-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Analyzing all underfilled groups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Underfilled</p>
                <p className="text-2xl font-bold">{totalUnderfilled}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">1-Student Groups</p>
                <p className="text-2xl font-bold text-red-600">{oneStudentCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">2-Student Groups</p>
                <p className="text-2xl font-bold text-amber-600">{twoStudentCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Can Merge</p>
                <p className="text-2xl font-bold text-green-600">{mergeableCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Group Optimization Report
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={loadOptimizationData} disabled={isLoading}>
                <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleExportCSV} disabled={filteredResults.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="1-student">1-Student Only</SelectItem>
                <SelectItem value="2-student">2-Student Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground self-center">
              Showing {filteredResults.length} of {results.length} lessons
            </span>
          </div>

          {/* Results Table */}
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No underfilled group lessons found matching your filters
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="min-w-[300px]">Merge Opportunities</TableHead>
                    <TableHead className="min-w-[250px]">Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map(result => {
                    const date = new Date(result.dateTime);
                    const viableMerges = result.mergeOpportunities.filter(m => m.canMerge);
                    
                    return (
                      <TableRow key={result.lessonId}>
                        <TableCell className="font-medium">{result.lessonTitle}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(date, 'EEE, d MMM')}</div>
                            <div className="text-muted-foreground">{format(date, 'HH:mm')}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{result.subject || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{result.tutor}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={result.studentCount === 1 ? 'destructive' : 'secondary'}>
                              {result.studentCount} student{result.studentCount !== 1 ? 's' : ''}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {result.currentStudents.join(', ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {viableMerges.length > 0 ? (
                            <div className="space-y-1">
                              {viableMerges.map((merge, idx) => {
                                const mergeDate = new Date(merge.targetDateTime);
                                return (
                                  <div key={idx} className="text-sm p-2 bg-green-50 rounded border border-green-200">
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                      <span className="font-medium">{merge.targetLesson}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(mergeDate, 'EEE d MMM HH:mm')} • {merge.targetTutor} • {merge.currentSize} students
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : result.mergeOpportunities.length > 0 ? (
                            <div className="text-sm text-amber-600">
                              {result.mergeOpportunities.length} potential (conflicts)
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">None found</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm whitespace-pre-wrap">
                            {result.recommendation}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupOptimizationReport;
