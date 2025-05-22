
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimeOffRequest } from '@/types/availability';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface TimeOffRequestsListProps {
  tutorId: string;
}

const TimeOffRequestsList: React.FC<TimeOffRequestsListProps> = ({ tutorId }) => {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();

  useEffect(() => {
    fetchTimeOffRequests();
  }, [tutorId]);

  const fetchTimeOffRequests = async () => {
    if (!tutorId) return;
    
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

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Time Off History</h3>
      
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-muted-foreground text-center py-4">No time off requests found.</div>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-md p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                  </div>
                  {request.reason && (
                    <div className="text-sm text-muted-foreground mt-1">{request.reason}</div>
                  )}
                </div>
                <Badge variant={getBadgeVariant(request.status)} className="capitalize">
                  {request.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeOffRequestsList;
