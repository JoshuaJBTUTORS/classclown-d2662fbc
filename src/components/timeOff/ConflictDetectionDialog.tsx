import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Calendar, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatInUKTime } from '@/utils/timezone';
import { TimeOffConflict, ConflictResolution } from '@/services/timeOffConflictService';
import { LessonReassignmentDialog } from './LessonReassignmentDialog';

interface ConflictDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: TimeOffConflict[];
  isLoading: boolean;
  onResolveConflicts: (resolutions: ConflictResolution[]) => void;
  onProceedWithApproval: () => void;
  tutorName: string;
  timeOffPeriod: string;
}

export const ConflictDetectionDialog: React.FC<ConflictDetectionDialogProps> = ({
  isOpen,
  onClose,
  conflicts,
  isLoading,
  onResolveConflicts,
  onProceedWithApproval,
  tutorName,
  timeOffPeriod
}) => {
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showReassignmentDialog, setShowReassignmentDialog] = useState(false);

  // Initialize resolutions when conflicts change
  useEffect(() => {
    if (conflicts.length > 0) {
      setResolutions(conflicts.map(conflict => ({
        lessonId: conflict.id,
        action: 'reassign' as const
      })));
    }
  }, [conflicts]);

  const handleActionChange = (lessonId: string, action: 'reassign' | 'cancel') => {
    setResolutions(prev => 
      prev.map(res => 
        res.lessonId === lessonId 
          ? { ...res, action, newTutorId: undefined, reason: undefined }
          : res
      )
    );
  };

  const handleReassignmentComplete = (lessonId: string, newTutorId: string, reason: string) => {
    setResolutions(prev => 
      prev.map(res => 
        res.lessonId === lessonId 
          ? { ...res, newTutorId, reason }
          : res
      )
    );
    setShowReassignmentDialog(false);
    setSelectedLessonId(null);
  };

  const openReassignmentDialog = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setShowReassignmentDialog(true);
  };

  const allConflictsResolved = resolutions.every(res => {
    if (res.action === 'reassign') {
      return res.newTutorId;
    }
    return true; // Cancel action doesn't need additional data
  });

  const handleResolveAll = () => {
    if (allConflictsResolved) {
      onResolveConflicts(resolutions);
    }
  };

  const getActionBadge = (lessonId: string) => {
    const resolution = resolutions.find(res => res.lessonId === lessonId);
    if (!resolution) return null;

    switch (resolution.action) {
      case 'reassign':
        return resolution.newTutorId 
          ? <Badge className="bg-blue-100 text-blue-800">Reassigned</Badge>
          : <Badge className="bg-yellow-100 text-yellow-800">Needs Reassignment</Badge>;
      case 'cancel':
        return <Badge className="bg-red-100 text-red-800">To Be Cancelled</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Checking for scheduling conflicts...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Scheduling Conflicts Detected
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {conflicts.length} scheduling conflict{conflicts.length !== 1 ? 's' : ''} found for {tutorName}'s 
                time off request ({timeOffPeriod}). Please resolve these conflicts before approving.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <Card key={conflict.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{conflict.title}</CardTitle>
                      {getActionBadge(conflict.id)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {formatInUKTime(conflict.start_time, 'PPP p')} - {formatInUKTime(conflict.end_time, 'p')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {conflict.students.map(s => `${s.first_name} ${s.last_name}`).join(', ')}
                        </span>
                      </div>
                      {conflict.subject && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{conflict.subject}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant={resolutions.find(res => res.lessonId === conflict.id)?.action === 'reassign' ? 'default' : 'outline'}
                        onClick={() => handleActionChange(conflict.id, 'reassign')}
                      >
                        Reassign Tutor
                      </Button>
                      <Button
                        size="sm"
                        variant={resolutions.find(res => res.lessonId === conflict.id)?.action === 'cancel' ? 'destructive' : 'outline'}
                        onClick={() => handleActionChange(conflict.id, 'cancel')}
                      >
                        Cancel Lesson
                      </Button>
                      {resolutions.find(res => res.lessonId === conflict.id)?.action === 'reassign' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openReassignmentDialog(conflict.id)}
                        >
                          {resolutions.find(res => res.lessonId === conflict.id)?.newTutorId 
                            ? 'Change Assignment' 
                            : 'Select Tutor'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel Approval
              </Button>
              <Button
                onClick={handleResolveAll}
                disabled={!allConflictsResolved}
                className="bg-green-600 hover:bg-green-700"
              >
                Resolve Conflicts & Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showReassignmentDialog && selectedLessonId && (
        <LessonReassignmentDialog
          isOpen={showReassignmentDialog}
          onClose={() => {
            setShowReassignmentDialog(false);
            setSelectedLessonId(null);
          }}
          lessonId={selectedLessonId}
          currentTutorId="" // Will be fetched in the dialog
          onComplete={handleReassignmentComplete}
        />
      )}
    </>
  );
};