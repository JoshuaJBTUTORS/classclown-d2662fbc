import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useHeyCleoProgress } from '@/hooks/useHeyCleoProgress';

interface Props {
  selectedStudents?: string[];
}

const fmt = (d?: string | null) => {
  if (!d) return '—';
  try {
    return format(parseISO(d), 'd MMM yyyy');
  } catch {
    return '—';
  }
};

const HeyCleoHomeworkProgress: React.FC<Props> = ({ selectedStudents = [] }) => {
  const { data, isLoading } = useHeyCleoProgress(selectedStudents);

  if (isLoading) {
    return (
      <Card className="border border-gray-200/50 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-24 rounded bg-gray-100" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const withData = data.students.filter((s) => s.homework.length > 0);

  return (
    <Card className="border border-gray-200/50 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-gray-900">Cleo Homework</CardTitle>
        <CardDescription className="text-gray-600">
          Homework set and completed in the Cleo learning hub
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {withData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
            <BookOpen className="mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-400">No Cleo homework yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Homework will appear here once it has been set in the learning hub.
            </p>
          </div>
        ) : (
          withData.map((student) => (
            <div key={student.crmStudentId} className="rounded-2xl border border-gray-100 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {student.completedCount}/{student.total} completed
                  </Badge>
                  {student.averageScore !== null && (
                    <Badge variant="secondary">Average {student.averageScore}%</Badge>
                  )}
                  {student.overdueCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {student.overdueCount} overdue
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {student.homework.slice(0, 8).map((hw) => {
                  const overdue =
                    !hw.completed && hw.due_date && new Date(hw.due_date).getTime() < Date.now();
                  return (
                    <div
                      key={hw.assignment_id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {hw.title || 'Homework'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {hw.subject || 'General'} · due {fmt(hw.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hw.percentage != null && (
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(Number(hw.percentage))}%
                          </span>
                        )}
                        {hw.completed ? (
                          <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                          </Badge>
                        ) : overdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : hw.started ? (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3.5 w-3.5" /> Started
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not started</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default HeyCleoHomeworkProgress;
