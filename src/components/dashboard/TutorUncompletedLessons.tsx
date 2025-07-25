import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, Clock } from 'lucide-react';

interface UncompletedLesson {
  id: string;
  student: string;
  subject: string;
  date: string;
  time: string;
  type: 'attendance' | 'completion' | 'both';
  daysOverdue: number;
}

const uncompletedLessons: UncompletedLesson[] = [
  {
    id: '1',
    student: 'Michael Johnson',
    subject: 'Mathematics',
    date: 'May 18',
    time: '3:00 PM - 4:00 PM',
    type: 'attendance',
    daysOverdue: 3,
  },
  {
    id: '2',
    student: 'Sarah Wilson',
    subject: 'Physics',
    date: 'May 17',
    time: '2:00 PM - 3:00 PM',
    type: 'completion',
    daysOverdue: 4,
  },
  {
    id: '3',
    student: 'David Chen',
    subject: 'Chemistry',
    date: 'May 16',
    time: '4:00 PM - 5:00 PM',
    type: 'both',
    daysOverdue: 5,
  },
  {
    id: '4',
    student: 'Emily Davis',
    subject: 'Mathematics',
    date: 'May 19',
    time: '1:00 PM - 2:00 PM',
    type: 'attendance',
    daysOverdue: 2,
  },
];

export default function TutorUncompletedLessons() {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'attendance': return 'Mark Attendance';
      case 'completion': return 'Complete Session';
      case 'both': return 'Attendance & Complete';
      default: return 'Action Required';
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'attendance': return 'outline' as const;
      case 'completion': return 'secondary' as const;
      case 'both': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Uncompleted Lessons
        </CardTitle>
        <Badge variant="destructive" className="text-xs">
          {uncompletedLessons.length} pending
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uncompletedLessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lesson.subject}</span>
                  <Badge variant={getTypeVariant(lesson.type)} className="text-xs">
                    {getTypeLabel(lesson.type)}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-orange-600">
                    {lesson.daysOverdue}d overdue
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{lesson.student}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{lesson.date} • {lesson.time}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="default" size="sm">
                  Complete
                </Button>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}