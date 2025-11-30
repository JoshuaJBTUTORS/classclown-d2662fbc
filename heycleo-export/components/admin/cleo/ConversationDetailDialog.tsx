import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationDetail } from '@/types/adminCleoTracker';
import { format } from 'date-fns';
import { Clock, MessageSquare, CheckCircle } from 'lucide-react';

interface ConversationDetailDialogProps {
  conversation: ConversationDetail | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConversationDetailDialog = ({
  conversation,
  open,
  onOpenChange,
}: ConversationDetailDialogProps) => {
  if (!conversation) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{conversation.topic}</span>
            <Badge variant={conversation.status === 'completed' ? 'default' : 'secondary'}>
              {conversation.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{conversation.durationMinutes.toFixed(1)} min</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{conversation.messageCount}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{conversation.completionPercentage || 0}%</div>
              <div className="text-xs text-muted-foreground">Completion</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Timeline</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Started: {format(new Date(conversation.createdAt), 'PPpp')}</div>
              {conversation.completedAt && (
                <div>Completed: {format(new Date(conversation.completedAt), 'PPpp')}</div>
              )}
              <div>Pauses: {conversation.pauseCount} | Resumes: {conversation.resumeCount}</div>
            </div>
          </div>

          {conversation.questionAnswers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Questions Answered ({conversation.questionAnswers.length})</h3>
              <ScrollArea className="h-32 rounded border p-2">
                <div className="space-y-2">
                  {conversation.questionAnswers.map((qa) => (
                    <div key={qa.id} className="text-xs p-2 bg-muted rounded">
                      <div className="font-medium flex items-center gap-2">
                        <Badge variant={qa.isCorrect ? 'default' : 'destructive'} className="text-xs">
                          {qa.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                        {qa.timeTakenSeconds && `${qa.timeTakenSeconds}s`}
                      </div>
                      <div className="mt-1">Q: {qa.questionText}</div>
                      <div className="text-muted-foreground">A: {qa.answerText}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-2">Message History ({conversation.messages.length})</h3>
            <ScrollArea className="h-64 rounded border p-4">
              <div className="space-y-3">
                {conversation.messages.map((msg, idx) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.role}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {msg.mode}
                        </Badge>
                        <span className="text-xs opacity-70">
                          {format(new Date(msg.createdAt), 'HH:mm:ss')}
                        </span>
                      </div>
                      <div className="text-sm">{msg.content}</div>
                      {msg.durationSeconds && (
                        <div className="text-xs opacity-70 mt-1">
                          Duration: {formatDuration(msg.durationSeconds)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
