import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock } from 'lucide-react';

interface UpcomingLesson {
  id: string;
  student: string;
  subject: string;
  date: string;
  time: string;
  type: 'individual' | 'group';
  status: 'confirmed' | 'pending';
}

const upcomingLessons: UpcomingLesson[] = [
  {
    id: '1',
    student: 'Emma Johnson',
    subject: 'Mathematics',
    date: 'Today',
    time: '3:00 PM - 4:00 PM',
    type: 'individual',
    status: 'confirmed',
  },
  {
    id: '2',
    student: 'Alex Brown, Sophie Davis',
    subject: 'Physics',
    date: 'Today',
    time: '5:00 PM - 6:00 PM',
    type: 'group',
    status: 'confirmed',
  },
  {
    id: '3',
    student: 'Oliver Chen',
    subject: 'Chemistry',
    date: 'Tomorrow',
    time: '2:00 PM - 3:00 PM',
    type: 'individual',
    status: 'pending',
  },
  {
    id: '4',
    student: 'Lily Wilson',
    subject: 'Mathematics',
    date: 'Tomorrow',
    time: '4:00 PM - 5:00 PM',
    type: 'individual',
    status: 'confirmed',
  },
];

export default function TutorUpcomingLessons() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Lessons
        </CardTitle>
        <Button variant="outline" size="sm">
          View Calendar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingLessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lesson.subject}</span>
                  <Badge variant={lesson.type === 'group' ? 'secondary' : 'outline'}>
                    {lesson.type}
                  </Badge>
                  <Badge variant={lesson.status === 'confirmed' ? 'default' : 'outline'}>
                    {lesson.status}
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
                <Button variant="ghost" size="sm">
                  Join
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