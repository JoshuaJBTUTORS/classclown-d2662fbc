import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { Clock, Users, Video, FileText, User } from 'lucide-react';
import StudentLessonSummary from '@/components/calendar/StudentLessonSummary';

interface LessonSummaryCardProps {
  lesson: {
    id: string;
    title: string;
    subject: string;
    start_time: string;
    end_time: string;
    lesson_space_session_id?: string;
    lesson_space_recording_url?: string;
    tutor: {
      first_name: string;
      last_name: string;
    };
    lesson_students: Array<{
      student: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
      };
    }>;
  };
}

const LessonSummaryCard: React.FC<LessonSummaryCardProps> = ({ lesson }) => {
  const [showRecording, setShowRecording] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const lessonDate = parseISO(lesson.start_time);

  const hasRecording = lesson.lesson_space_recording_url || lesson.lesson_space_session_id;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg leading-tight">{lesson.title}</CardTitle>
            <Badge variant="outline" className="ml-2 shrink-0">
              {lesson.subject}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{format(lessonDate, 'MMM d, yyyy • h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{lesson.tutor.first_name} {lesson.tutor.last_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{lesson.lesson_students.length} student{lesson.lesson_students.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-end">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowRecording(true)}
              disabled={!hasRecording}
            >
              <Video className="h-4 w-4 mr-2" />
              View Recording
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowSummary(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recording Modal */}
      <Dialog open={showRecording} onOpenChange={setShowRecording}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{lesson.title} - Recording</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {lesson.lesson_space_recording_url ? (
              <iframe
                src={lesson.lesson_space_recording_url}
                className="w-full h-full rounded-lg border"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                title={`Recording: ${lesson.title} - ${format(lessonDate, 'MMM d, yyyy')}`}
              />
            ) : hasRecording ? (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading recording...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recording available</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lesson.title} - Student Summaries</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StudentLessonSummary
              lessonId={lesson.id}
              students={lesson.lesson_students}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LessonSummaryCard;