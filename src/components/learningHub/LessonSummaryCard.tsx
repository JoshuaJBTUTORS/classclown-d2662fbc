import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { Clock, Users, Video, FileText, User, Play, BookOpen, Calendar, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import StudentLessonSummary from '@/components/calendar/StudentLessonSummary';
import GenerateAssessmentFromLessonDialog from './GenerateAssessmentFromLessonDialog';

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
  const { isAdmin, isOwner, isTutor } = useAuth();
  const [showRecording, setShowRecording] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showGenerateAssessment, setShowGenerateAssessment] = useState(false);
  const lessonDate = parseISO(lesson.start_time);

  const hasRecording = lesson.lesson_space_recording_url || lesson.lesson_space_session_id;
  const canGenerateAssessment = isAdmin || isOwner || isTutor;

  // Generate a subtle pastel gradient based on subject
  const getSubjectGradient = (subject: string) => {
    const gradients = [
      'from-purple-50 via-blue-50 to-indigo-50',
      'from-blue-50 via-cyan-50 to-teal-50',
      'from-green-50 via-emerald-50 to-lime-50',
      'from-pink-50 via-rose-50 to-red-50',
      'from-orange-50 via-amber-50 to-yellow-50',
      'from-violet-50 via-purple-50 to-fuchsia-50',
    ];
    const index = subject.length % gradients.length;
    return gradients[index];
  };

  const getSubjectColor = (subject: string) => {
    const colors = [
      'text-purple-700 bg-purple-100',
      'text-blue-700 bg-blue-100',
      'text-green-700 bg-green-100',
      'text-pink-700 bg-pink-100',
      'text-orange-700 bg-orange-100',
      'text-violet-700 bg-violet-100',
    ];
    const index = subject.length % colors.length;
    return colors[index];
  };

  return (
    <>
      <Card className={cn(
        "group relative h-full flex flex-col overflow-hidden",
        "bg-gradient-to-br", getSubjectGradient(lesson.subject),
        "border-0 shadow-lg hover:shadow-2xl transition-all duration-500",
        "hover:scale-[1.02] hover:-translate-y-1"
      )}>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03]">
          <BookOpen className="w-full h-full transform rotate-12" />
        </div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 opacity-[0.03]">
          <Play className="w-full h-full" />
        </div>

        <CardHeader className="relative z-10 pb-6">
          {/* Subject Badge */}
          <div className="flex justify-end mb-3">
            <Badge className={cn(
              "font-medium px-3 py-1 rounded-full border-0 shadow-sm",
              getSubjectColor(lesson.subject)
            )}>
              {lesson.subject}
            </Badge>
          </div>

          {/* Title */}
          <CardTitle className="text-xl font-bold text-gray-800 mb-4 leading-tight group-hover:text-gray-900 transition-colors">
            {lesson.title}
          </CardTitle>
          
          {/* Meta Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">
                {format(lessonDate, 'MMM d, yyyy • h:mm a')}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <div className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">
                {lesson.tutor.first_name} {lesson.tutor.last_name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <div className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">
                {lesson.lesson_students.length} student{lesson.lesson_students.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex-1 flex flex-col pt-0 px-6 pb-6">
          {/* Spacer to ensure minimum distance from header content */}
          <div className="flex-1 min-h-[1rem]" />
          <div className={cn(
            "grid gap-3",
            canGenerateAssessment ? "grid-cols-3" : "grid-cols-2"
          )}>
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "group/btn relative overflow-hidden bg-white/80 backdrop-blur-sm border-0",
                "shadow-md hover:shadow-lg transition-all duration-300",
                "hover:bg-white/90 hover:scale-105",
                !hasRecording && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => setShowRecording(true)}
              disabled={!hasRecording}
            >
              <div className="flex items-center gap-2 relative z-10">
                <div className="p-1 rounded-full bg-red-100 group-hover/btn:bg-red-200 transition-colors">
                  <Play className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium text-gray-700">Recording</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "group/btn relative overflow-hidden bg-white/80 backdrop-blur-sm border-0",
                "shadow-md hover:shadow-lg transition-all duration-300",
                "hover:bg-white/90 hover:scale-105"
              )}
              onClick={() => setShowSummary(true)}
            >
              <div className="flex items-center gap-2 relative z-10">
                <div className="p-1 rounded-full bg-blue-100 group-hover/btn:bg-blue-200 transition-colors">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">Summary</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-cyan-50 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            </Button>
            
            {canGenerateAssessment && (
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "group/btn relative overflow-hidden bg-white/80 backdrop-blur-sm border-0",
                  "shadow-md hover:shadow-lg transition-all duration-300",
                  "hover:bg-white/90 hover:scale-105"
                )}
                onClick={() => setShowGenerateAssessment(true)}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <div className="p-1 rounded-full bg-purple-100 group-hover/btn:bg-purple-200 transition-colors">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-700">Assessment</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              </Button>
            )}
          </div>
        </CardContent>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </Card>

      {/* Recording Modal */}
      <Dialog open={showRecording} onOpenChange={setShowRecording}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{lesson.title} - Recording</DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6">
            {lesson.lesson_space_recording_url ? (
              <iframe
                src={lesson.lesson_space_recording_url}
                className="w-full h-full rounded-lg border-0"
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

      {/* Generate Assessment Modal */}
      <GenerateAssessmentFromLessonDialog
        isOpen={showGenerateAssessment}
        onClose={() => setShowGenerateAssessment(false)}
        onSuccess={() => {
          // Could add navigation to assessments page or show success message
        }}
        lesson={lesson}
      />
    </>
  );
};

export default LessonSummaryCard;