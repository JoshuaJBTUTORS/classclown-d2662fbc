import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Clock, Users, BookOpen, User } from 'lucide-react';
import LessonSpacePlayer from './LessonSpacePlayer';
import StudentLessonSummary from '@/components/calendar/StudentLessonSummary';

interface LessonSummaryCardProps {
  lesson: {
    id: string;
    title: string;
    subject: string;
    start_time: string;
    end_time: string;
    lesson_space_session_id?: string;
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
  const lessonDate = parseISO(lesson.start_time);
  const lessonDuration = Math.round(
    (parseISO(lesson.end_time).getTime() - parseISO(lesson.start_time).getTime()) / (1000 * 60)
  );

  return (
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

      <CardContent className="space-y-6 flex-1">
        {/* Video Player Section */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Lesson Recording
          </h3>
          {lesson.lesson_space_session_id ? (
            <LessonSpacePlayer
              sessionId={lesson.lesson_space_session_id}
              title={`${lesson.title} - ${format(lessonDate, 'MMM d, yyyy')}`}
              className="rounded-lg overflow-hidden border"
            />
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recording available</p>
              </div>
            </div>
          )}
        </div>

        {/* Student Summaries Section */}
        <div>
          <StudentLessonSummary
            lessonId={lesson.id}
            students={lesson.lesson_students}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonSummaryCard;