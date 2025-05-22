
import React, { useState, useEffect } from 'react';
import { TimeOffRequest } from '@/types/availability';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

interface TimeOffRequestsListProps {
  tutorId: string;
}

const TimeOffRequestsList: React.FC<TimeOffRequestsListProps> = ({ tutorId }) => {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tutorId) {
      fetchTimeOffRequests();
    }
  }, [tutorId]);

  const fetchTimeOffRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutor_time_off')
        .select('*')
        .eq('tutor_id', tutorId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setRequests(data as TimeOffRequest[]);
    } catch (error: any) {
      console.error('Error fetching time off requests:', error);
      toast.error('Failed to load time off requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading time off requests...</div>;
  }

  if (requests.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No time off requests found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Time Off Requests</h3>
        <p className="text-sm text-muted-foreground">Previous and upcoming time off requests.</p>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">
                  {format(parseISO(request.start_date), 'MMM d, yyyy')} - {format(parseISO(request.end_date), 'MMM d, yyyy')}
                </CardTitle>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {request.reason || 'No reason provided'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Requested on {format(parseISO(request.created_at || new Date().toISOString()), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimeOffRequestsList;
