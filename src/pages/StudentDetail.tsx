import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentWeeklyTopics } from '@/hooks/useStudentWeeklyTopics';

const formatRange = (start: Date, end: Date) => {
  const s = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const eDate = new Date(end);
  eDate.setDate(eDate.getDate() - 1);
  const e = eDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
};

const formatLessonDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studentName, setStudentName] = useState<string>('Student');

  const { groups, missedCount, cancelledCount, isLoading, weekStart, weekEnd, goPrev, goNext, goThisWeek } =
    useStudentWeeklyTopics(studentId);

  useEffect(() => {
    if (!studentId) return;
    supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', Number(studentId))
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStudentName(`${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || 'Student');
      });
  }, [studentId]);

  const totalLessons = groups.reduce((n, g) => n + g.lessons.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/students-list')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to students
            </Button>

            <PageTitle
              title={studentName}
              subtitle="Weekly topics covered, grouped by subject"
            />

            {/* Week navigator */}
            <Card className="mt-6">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goPrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium min-w-[220px] text-center">
                    {formatRange(weekStart, weekEnd)}
                  </div>
                  <Button variant="outline" size="sm" onClick={goNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {totalLessons} lesson{totalLessons === 1 ? '' : 's'} this week
                  </span>
                  {missedCount > 0 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                      {missedCount} missed
                    </Badge>
                  )}
                  {cancelledCount > 0 && (
                    <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
                      {cancelledCount} cancelled
                    </Badge>
                  )}
                  <Button variant="secondary" size="sm" onClick={goThisWeek}>
                    This week
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <div className="mt-6 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : groups.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No lessons this week.
                  </CardContent>
                </Card>
              ) : (
                groups.map((g) => (
                  <Card key={g.subject}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5" />
                        {g.subject}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({g.lessons.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {g.lessons.map((l) => (
                        <div
                          key={l.lessonId}
                          className="border-l-2 border-primary/30 pl-4 py-1"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatLessonDate(l.startTime)}
                            </span>
                            <span className="font-medium">{l.title}</span>
                            {l.confidenceScore !== null && (() => {
                              const raw = l.confidenceScore as number;
                              const pct = Math.round(raw * 10);
                              const colour =
                                pct >= 70
                                  ? 'border-green-500 text-green-700 dark:text-green-400'
                                  : pct >= 40
                                  ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                                  : 'border-red-500 text-red-700 dark:text-red-400';
                              return (
                                <Badge variant="outline" className={colour}>
                                  Understanding: {pct}% ({raw}/10)
                                  {l.engagementLevel ? ` · ${l.engagementLevel} engagement` : ''}
                                </Badge>
                              );
                            })()}
                            {l.confidenceScore === null && l.engagementLevel && (
                              <Badge variant="outline">{l.engagementLevel} engagement</Badge>
                            )}
                          </div>
                          {l.topics.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {l.topics.map((t, i) => (
                                <Badge key={`${l.lessonId}-${i}`} variant="secondary">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              {l.hasSummary
                                ? 'No topics recorded for this lesson.'
                                : 'Topics pending — transcript still processing.'}
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
