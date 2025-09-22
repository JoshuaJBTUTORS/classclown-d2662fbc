import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatInUKTime } from '@/utils/timezone';
import { getAlternativeTutorsForLesson } from '@/services/timeOffConflictService';
import { supabase } from '@/integrations/supabase/client';

interface LessonReassignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  currentTutorId: string;
  onComplete: (lessonId: string, newTutorId: string, reason: string) => void;
}

export const LessonReassignmentDialog: React.FC<LessonReassignmentDialogProps> = ({
  isOpen,
  onClose,
  lessonId,
  currentTutorId,
  onComplete
}) => {
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [reason, setReason] = useState('Time off conflict resolution');

  // Fetch lesson details
  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          start_time,
          end_time,
          subject,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!lessonId
  });

  // Fetch alternative tutors
  const { data: alternativeTutors, isLoading: tutorsLoading } = useQuery({
    queryKey: ['alternativeTutors', lessonId, lesson?.tutor?.id],
    queryFn: async () => {
      if (!lesson?.tutor?.id || !lesson.start_time || !lesson.end_time) {
        return [];
      }
      return await getAlternativeTutorsForLesson(lessonId, lesson.tutor.id);
    },
    enabled: !!lesson?.tutor?.id
  });

  const handleComplete = () => {
    if (selectedTutorId && reason.trim()) {
      onComplete(lessonId, selectedTutorId, reason.trim());
    }
  };

  const selectedTutor = alternativeTutors?.find(t => t.id === selectedTutorId);

  const isLoading = lessonLoading || tutorsLoading;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Loading lesson details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!lesson) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load lesson details. Please try again.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reassign Lesson to Alternative Tutor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Lesson Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lesson Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Title:</strong> {lesson.title}
                </div>
                <div>
                  <strong>Subject:</strong> {lesson.subject || 'Not specified'}
                </div>
                <div>
                  <strong>Current Tutor:</strong> {lesson.tutor.first_name} {lesson.tutor.last_name}
                </div>
                <div>
                  <strong>Time:</strong> {formatInUKTime(lesson.start_time, 'PPP p')} - {formatInUKTime(lesson.end_time, 'p')}
                </div>
              </div>
              {lesson.lesson_students.length > 0 && (
                <div>
                  <strong>Students:</strong> {' '}
                  {lesson.lesson_students.map((ls: any) => 
                    `${ls.student.first_name} ${ls.student.last_name}`
                  ).join(', ')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alternative Tutors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Alternative Tutors</h3>
            
            {alternativeTutors && alternativeTutors.length > 0 ? (
              <div className="grid gap-3">
                {alternativeTutors.map((tutor) => (
                  <Card 
                    key={tutor.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTutorId === tutor.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTutorId(tutor.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {tutor.first_name} {tutor.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Available for this time slot
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {tutor.hasConflict ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Has Minor Conflicts
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Fully Available
                            </Badge>
                          )}
                          {selectedTutorId === tutor.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No alternative tutors are available for this time slot. You may need to consider 
                  rescheduling the lesson or cancelling it.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reassignment</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this reassignment..."
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!selectedTutorId || !reason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm Reassignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};