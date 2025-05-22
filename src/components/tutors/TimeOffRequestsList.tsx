import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tutor } from '@/types/tutor';
import { TimeOffRequest, TimeOffStatus } from '@/types/availability';
import { format, parseISO } from 'date-fns';
import { X, Check } from 'lucide-react';

interface TimeOffRequestsListProps {
  tutor: Tutor;
  isAdmin?: boolean;
  onRequestUpdated?: () => void;
}

const TimeOffRequestsList: React.FC<TimeOffRequestsListProps> = ({ 
  tutor, 
  isAdmin = false,
  onRequestUpdated 
}) => {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [tutor.id]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('tutor_time_off')
        .select('*')
        .eq('tutor_id', tutor.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Use type assertion to ensure the data is properly typed
      const typedData = (data || []).map((item: any) => ({
        ...item,
        status: item.status as TimeOffStatus
      })) as TimeOffRequest[];
      
      setRequests(typedData);
    } catch (error: any) {
      console.error('Error fetching time-off requests:', error);
      toast.error('Failed to load time-off requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      setProcessingId(id);
      
      const { error } = await supabase
        .from('tutor_time_off')
        .delete()
        .eq('id', id)
        .eq('status', 'pending'); // Only allow cancellation of pending requests
      
      if (error) throw error;
      
      toast.success('Request cancelled successfully');
      fetchRequests();
      if (onRequestUpdated) onRequestUpdated();
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: TimeOffStatus) => {
    try {
      setProcessingId(id);
      
      const { error } = await supabase
        .from('tutor_time_off')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Request ${status} successfully`);
      fetchRequests();
      if (onRequestUpdated) onRequestUpdated();
    } catch (error: any) {
      console.error(`Error updating request status to ${status}:`, error);
      toast.error(`Failed to ${status} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: TimeOffStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-600 text-white">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No time-off requests found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="border-border/40">
          <CardContent className="pt-6">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <div className="text-lg font-medium">
                  {formatDateRange(request.start_date, request.end_date)}
                </div>
                {request.reason && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {request.reason}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(request.status)}
                
                {/* Allow cancellation of pending requests */}
                {request.status === 'pending' && !isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelRequest(request.id!)}
                    disabled={processingId === request.id}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    Cancel
                  </Button>
                )}
                
                {/* Admin actions for pending requests */}
                {isAdmin && request.status === 'pending' && (
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:border-green-600"
                      onClick={() => handleUpdateStatus(request.id!, 'approved')}
                      disabled={processingId === request.id}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Approve</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:border-red-600"
                      onClick={() => handleUpdateStatus(request.id!, 'rejected')}
                      disabled={processingId === request.id}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Reject</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TimeOffRequestsList;
