import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimeOffRequest {
  id: string;
  tutorName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const recentRequests: TimeOffRequest[] = [
  {
    id: '1',
    tutorName: 'Dr. Emma Wilson',
    startDate: 'May 25',
    endDate: 'May 27',
    reason: 'Family vacation',
    status: 'pending',
  },
  {
    id: '2',
    tutorName: 'Prof. Michael Brown',
    startDate: 'June 1',
    endDate: 'June 1',
    reason: 'Medical appointment',
    status: 'approved',
  },
  {
    id: '3',
    tutorName: 'Dr. Sarah Thompson',
    startDate: 'June 15',
    endDate: 'June 20',
    reason: 'Conference attendance',
    status: 'pending',
  },
];

export default function TimeOffRequestsWidget() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Off Requests
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate('/time-off-requests')}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{request.tutorName}</span>
                  <Badge variant={
                    request.status === 'approved' ? 'default' : 
                    request.status === 'pending' ? 'outline' : 'destructive'
                  }>
                    {request.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {request.startDate} - {request.endDate}
                </div>
                <div className="text-sm text-muted-foreground">
                  {request.reason}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  {request.status === 'pending' ? 'Review' : 'Details'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}