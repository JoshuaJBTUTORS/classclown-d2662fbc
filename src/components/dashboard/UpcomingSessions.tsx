
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Session {
  id: string;
  student: string;
  tutor: string;
  subject: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const sessions: Session[] = [
  {
    id: '1',
    student: 'John Smith',
    tutor: 'Dr. Emma Wilson',
    subject: 'Advanced Mathematics',
    date: 'Today',
    time: '3:00 PM - 4:30 PM',
    status: 'confirmed',
  },
  {
    id: '2',
    student: 'Sarah Johnson',
    tutor: 'Prof. Michael Brown',
    subject: 'Physics',
    date: 'Today',
    time: '5:00 PM - 6:00 PM',
    status: 'confirmed',
  },
  {
    id: '3',
    student: 'David Lee',
    tutor: 'Dr. Alex Thompson',
    subject: 'Chemistry',
    date: 'Tomorrow',
    time: '10:00 AM - 11:30 AM',
    status: 'pending',
  },
  {
    id: '4',
    student: 'Emily Chen',
    tutor: 'Prof. James Wilson',
    subject: 'English Literature',
    date: 'Tomorrow',
    time: '1:00 PM - 2:30 PM',
    status: 'confirmed',
  },
  {
    id: '5',
    student: 'Robert Miller',
    tutor: 'Dr. Susan Taylor',
    subject: 'Biology',
    date: 'May 21, 2025',
    time: '4:00 PM - 5:30 PM',
    status: 'confirmed',
  },
];

export default function UpcomingSessions() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Sessions</CardTitle>
        <Button variant="outline" size="sm">View All</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{session.subject}</span>
                  <Badge variant={
                    session.status === 'confirmed' ? 'default' : 
                    session.status === 'pending' ? 'outline' : 'destructive'
                  }>
                    {session.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.student} with {session.tutor}
                </div>
                <div className="text-sm font-medium">
                  {session.date} • {session.time}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Details</Button>
                <Button variant="outline" size="sm">Reschedule</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
