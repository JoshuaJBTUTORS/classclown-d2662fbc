import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import { formatInUKTime } from '@/utils/timezone';
import { TimeOffConflict } from '@/services/timeOffConflictService';

interface ConflictDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: TimeOffConflict[];
  isLoading: boolean;
  hasNoConflicts?: boolean;
  onNoConflictsContinue?: () => void;
  onGoToCalendar: () => void;
  tutorName: string;
  timeOffPeriod: string;
}

export const ConflictDetectionDialog: React.FC<ConflictDetectionDialogProps> = ({
  isOpen,
  onClose,
  conflicts,
  isLoading,
  hasNoConflicts = false,
  onNoConflictsContinue,
  onGoToCalendar,
  tutorName,
  timeOffPeriod
}) => {

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Checking for Conflicts</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Checking for scheduling conflicts...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No conflicts found - show success message
  if (hasNoConflicts && conflicts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Conflicts Found</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No scheduling conflicts detected</p>
              <p className="text-sm text-muted-foreground">
                The time off request for <strong>{tutorName}</strong> during{' '}
                <strong>{timeOffPeriod}</strong> does not conflict with any existing lessons.
              </p>
              <p className="text-sm text-muted-foreground">
                The request can be approved safely.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={onNoConflictsContinue}
                className="bg-green-600 hover:bg-green-700"
              >
                Continue with Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show conflicts that need resolution in calendar
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Scheduling Conflicts Detected</DialogTitle>
        </DialogHeader>
        
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found <strong>{conflicts.length}</strong> lesson{conflicts.length !== 1 ? 's' : ''} that conflict with the time off request for <strong>{tutorName}</strong> during {timeOffPeriod}.
          </AlertDescription>
        </Alert>

        <div className="my-4">
          <p className="text-sm text-muted-foreground">
            Please resolve these conflicts in the calendar before approving this time off request. 
            You can reassign tutors or reschedule lessons as needed.
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
          {conflicts.map((conflict) => (
            <Card key={conflict.id} className="border-l-4 border-l-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{conflict.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatInUKTime(conflict.start_time, 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatInUKTime(conflict.start_time, 'p')} - {formatInUKTime(conflict.end_time, 'p')}
                    </span>
                  </div>
                </div>
                
                {conflict.students && conflict.students.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {conflict.students.map((student, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {student.first_name} {student.last_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {conflict.subject && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Subject: </span>
                    <Badge variant="secondary" className="text-xs">{conflict.subject}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onGoToCalendar}>
            Go to Calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};