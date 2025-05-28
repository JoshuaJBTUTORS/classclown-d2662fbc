
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Users, Clock, Camera, Mic, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface LessonConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  lesson: {
    title: string;
    description?: string;
    start_time: string;
    tutor?: {
      first_name: string;
      last_name: string;
    };
    is_group?: boolean;
    lesson_students?: any[];
  };
  studentName: string;
}

const LessonConsentDialog: React.FC<LessonConsentDialogProps> = ({
  isOpen,
  onClose,
  onAccept,
  lesson,
  studentName
}) => {
  const [hasAccepted, setHasAccepted] = useState(false);

  const handleAcceptClick = () => {
    setHasAccepted(true);
    setTimeout(() => {
      onAccept();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-600" />
            Join Lesson - Camera & Microphone Agreement
          </DialogTitle>
          <DialogDescription>
            Please review and accept the requirements before joining your lesson
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lesson Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-medium text-lg">{lesson.title}</h3>
                {lesson.description && (
                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{format(parseISO(lesson.start_time), 'MMM d, yyyy h:mm a')}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  Teacher: {lesson.tutor?.first_name} {lesson.tutor?.last_name}
                </span>
              </div>

              {lesson.is_group && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Group lesson • {lesson.lesson_students?.length || 0} students</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consent Information */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <h4 className="font-medium text-amber-800">
                  Camera & Microphone Requirements
                </h4>
                <div className="text-sm text-amber-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span>Your camera must remain on throughout the lesson</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span>Your microphone must remain on unless instructed otherwise by your teacher</span>
                  </div>
                </div>
                <p className="text-sm text-amber-700">
                  <strong>By joining this lesson, you acknowledge and agree to these requirements.</strong>
                  <br />
                  Your teacher may provide specific instructions during the lesson about when to mute/unmute.
                </p>
              </div>
            </div>
          </div>

          {/* Student Welcome */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Welcome, {studentName}!</strong>
              <br />
              Click "I Accept & Join Lesson" below to proceed to your lesson space.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={hasAccepted}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptClick}
              disabled={hasAccepted}
              className="min-w-[180px]"
            >
              {hasAccepted ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Joining...
                </span>
              ) : (
                'I Accept & Join Lesson'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonConsentDialog;
