import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { examResultsService, StudentExamSession } from '@/services/examResultsService';
import { format } from 'date-fns';
import { Clock, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface StudentResponsesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  studentName: string;
  startDate?: string;
  endDate?: string;
}

export const StudentResponsesDialog: React.FC<StudentResponsesDialogProps> = ({
  open,
  onOpenChange,
  userId,
  studentName,
  startDate,
  endDate
}) => {
  const [expandedSession, setExpandedSession] = React.useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['studentExamSessions', userId, startDate, endDate],
    queryFn: () => examResultsService.getStudentSessions(userId, startDate, endDate),
    enabled: open && !!userId
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ['sessionResponses', expandedSession],
    queryFn: () => examResultsService.getSessionResponses(expandedSession!),
    enabled: !!expandedSession
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exam Results: {studentName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          {sessionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : sessions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exam sessions found for this student
            </div>
          ) : (
            <div className="space-y-3">
              {sessions?.map((session) => (
                <SessionCard
                  key={session.sessionId}
                  session={session}
                  isExpanded={expandedSession === session.sessionId}
                  onToggle={() => setExpandedSession(
                    expandedSession === session.sessionId ? null : session.sessionId
                  )}
                  responses={expandedSession === session.sessionId ? responses : undefined}
                  isLoadingResponses={expandedSession === session.sessionId && responsesLoading}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

interface SessionCardProps {
  session: StudentExamSession;
  isExpanded: boolean;
  onToggle: () => void;
  responses?: Awaited<ReturnType<typeof examResultsService.getSessionResponses>>;
  isLoadingResponses: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isExpanded,
  onToggle,
  responses,
  isLoadingResponses
}) => {
  const percentage = session.marksAvailable > 0 
    ? (session.marksAchieved / session.marksAvailable) * 100 
    : 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-3 text-left">
                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                <div>
                  <CardTitle className="text-base">{session.assessmentTitle}</CardTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline">{session.subject}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.timeTakenMinutes} min
                    </span>
                    <span>
                      {format(new Date(session.completedAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  percentage >= 70 ? 'text-green-600' :
                  percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {session.marksAchieved}/{session.marksAvailable}
                </div>
                <div className="text-xs text-muted-foreground">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 border-t">
            {isLoadingResponses ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : responses?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No responses recorded
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {responses?.map((response) => (
                  <div key={response.questionId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">
                        Question {response.questionNumber}
                      </span>
                      <Badge variant={response.marksAwarded > 0 ? 'default' : 'secondary'}>
                        {response.marksAwarded}/{response.marksAvailable} marks
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {response.questionText}
                    </p>
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">Student Answer:</p>
                      <p className="text-sm whitespace-pre-wrap">
                        {response.studentAnswer || <em className="text-muted-foreground">No answer provided</em>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
