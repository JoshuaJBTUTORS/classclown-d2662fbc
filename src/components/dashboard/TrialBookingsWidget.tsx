import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrialBooking {
  id: string;
  parentName: string;
  childName: string;
  subject: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'completed';
}

const recentBookings: TrialBooking[] = [
  {
    id: '1',
    parentName: 'Sarah Johnson',
    childName: 'Emma Johnson',
    subject: 'Mathematics',
    date: 'Today',
    time: '4:00 PM',
    status: 'pending',
  },
  {
    id: '2',
    parentName: 'Michael Brown',
    childName: 'Alex Brown',
    subject: 'Physics',
    date: 'Tomorrow',
    time: '2:30 PM',
    status: 'approved',
  },
  {
    id: '3',
    parentName: 'Lisa Davis',
    childName: 'Oliver Davis',
    subject: 'English',
    date: 'May 23',
    time: '10:00 AM',
    status: 'pending',
  },
];

export default function TrialBookingsWidget() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Trial Bookings
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate('/trial-bookings')}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{booking.childName}</span>
                  <Badge variant={
                    booking.status === 'approved' ? 'default' : 
                    booking.status === 'pending' ? 'outline' : 'secondary'
                  }>
                    {booking.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Parent: {booking.parentName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.subject} • {booking.date} at {booking.time}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  {booking.status === 'pending' ? 'Approve' : 'Details'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}