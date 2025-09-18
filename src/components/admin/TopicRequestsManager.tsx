import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TopicRequest {
  id: string;
  lesson_id: string;
  student_id: number;
  parent_id?: string;
  requested_topic: string;
  status: 'pending' | 'approved' | 'denied';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  lessons: {
    title: string;
    start_time: string;
    subject?: string;
  };
  students: {
    first_name: string;
    last_name: string;
    email?: string;
  };
  parents?: {
    first_name: string;
    last_name: string;
    email?: string;
  };
}

export function TopicRequestsManager() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<TopicRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TopicRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTopicRequests();
  }, [statusFilter]);

  const fetchTopicRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('topic_requests')
        .select(`
          *,
          lessons!inner(
            title,
            start_time,
            subject
          ),
          students!inner(
            first_name,
            last_name,
            email
          ),
          parents(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching topic requests:', error);
      toast({
        title: "Error",
        description: "Failed to load topic requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'denied', notes?: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('topic_requests')
        .update({
          status: newStatus,
          admin_notes: notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send email notification if approved
      if (newStatus === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          try {
            await supabase.functions.invoke('send-topic-request-notification', {
              body: {
                requestId: requestId,
                status: newStatus,
                adminNotes: notes
              }
            });
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
            // Don't show error to user since the main action succeeded
          }
        }
      }

      toast({
        title: "Success",
        description: `Topic request ${newStatus} successfully!`,
      });

      fetchTopicRequests();
      setDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating topic request:', error);
      toast({
        title: "Error",
        description: "Failed to update topic request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openReviewDialog = (request: TopicRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Topic Requests</h2>
        <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No topic requests found for the selected filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {request.lessons.title} {request.lessons.subject && `(${request.lessons.subject})`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Student: {request.students.first_name} {request.students.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lesson Date: {formatDateTime(request.lessons.start_time)}
                    </p>
                    {request.parents && (
                      <p className="text-sm text-muted-foreground">
                        Parent: {request.parents.first_name} {request.parents.last_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Requested Topic:</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{request.requested_topic}</p>
                  </div>

                  {request.admin_notes && (
                    <div>
                      <Label className="text-sm font-medium">Admin Notes:</Label>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">{request.admin_notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Submitted: {formatDateTime(request.created_at)}</span>
                    {request.reviewed_at && (
                      <span>Reviewed: {formatDateTime(request.reviewed_at)}</span>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex space-x-2 pt-2">
                      <Dialog open={dialogOpen && selectedRequest?.id === request.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewDialog(request)}
                            disabled={processingId === request.id}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Topic Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Admin Notes (Optional)</Label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add any notes about this decision..."
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleStatusUpdate(request.id, 'approved', adminNotes)}
                                disabled={processingId === request.id}
                                className="flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleStatusUpdate(request.id, 'denied', adminNotes)}
                                disabled={processingId === request.id}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        disabled={processingId === request.id}
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Quick Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(request.id, 'denied')}
                        disabled={processingId === request.id}
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}