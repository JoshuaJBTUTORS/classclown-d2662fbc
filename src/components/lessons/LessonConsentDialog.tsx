
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
      <DialogContent className="sm:max-w-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-600" />
            Join Lesson - Camera & Microphone Agreement
          </DialogTitle>
          <DialogDescription>
            Please review and accept the requirements before joining your lesson
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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

          {/* Updated Camera Rules */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <h4 className="font-medium text-red-800">
                  Important: Camera & Microphone Requirements
                </h4>
                <div className="text-sm text-red-700 space-y-3">
                  <div className="flex items-start gap-2">
                    <Camera className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Please ensure your camera is working and remains on for the entire duration of the lesson</strong>, unless previously agreed upon with your instructor.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mic className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Your microphone should be ready to use when called upon by your teacher.</span>
                  </div>
                  <div className="bg-red-100 p-3 rounded border border-red-300">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ <strong>Important Notice:</strong> Failure to comply with the camera policy may result in removal from the lesson.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Student Welcome */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Welcome, {studentName}!</strong>
              <br />
              By clicking "I Accept & Join Lesson" below, you confirm that you understand and agree to follow the camera and microphone requirements.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-3 justify-end pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  );
};

export default LessonConsentDialog;
