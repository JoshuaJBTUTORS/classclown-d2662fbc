import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Check, X, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import PageTitle from '@/components/ui/PageTitle';

interface TopicRequest {
  id: string;
  student_id: number;
  requested_topic: string;
  status: 'pending' | 'approved' | 'denied';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  lesson_id: string;
  parent_id: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const TopicRequestsApproval = () => {
  const { toast } = useToast();
  const { isAdmin, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch topic requests with student details
  const { data: topicRequests, isLoading } = useQuery({
    queryKey: ['topic-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_requests')
        .select(`
          *,
          students!inner (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (TopicRequest & { students: Student })[];
    },
    enabled: isAdmin || isOwner,
  });

  // Update topic request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: 'approved' | 'denied'; adminNotes?: string }) => {
      const { error } = await supabase
        .from('topic_requests')
        .update({ 
          status, 
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
          reviewed_by: (supabase.auth.getUser() as any).data?.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

        // Trigger email notification
        await supabase.functions.invoke('send-topic-request-notification', {
          body: { requestId: id, status, adminNotes, requestedTopic: topicRequests?.find(r => r.id === id)?.requested_topic || '' }
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-requests'] });
      toast({
        title: 'Success',
        description: 'Topic request status updated and notification sent.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update topic request status.',
        variant: 'destructive',
      });
      console.error('Error updating topic request:', error);
    },
  });

  // Filter requests
  const filteredRequests = topicRequests?.filter(request => {
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      request.students.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.students.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || selectedSubject === 'General Topic Request';
    
    return matchesStatus && matchesSearch && matchesSubject;
  });

  // Get unique subjects for filter - since we don't have subjects, we'll use a placeholder
  const subjects = ['Math', 'English', 'Science', 'History', 'Other'];

  // Statistics
  const stats = {
    total: topicRequests?.length || 0,
    pending: topicRequests?.filter(req => req.status === 'pending').length || 0,
    approved: topicRequests?.filter(req => req.status === 'approved').length || 0,
    denied: topicRequests?.filter(req => req.status === 'denied').length || 0,
  };

  const ApprovalDialog = ({ request, onApprove }: { request: TopicRequest & { students: Student }, onApprove: (status: 'approved' | 'denied', notes?: string) => void }) => {
    const [adminNotes, setAdminNotes] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleApprove = (status: 'approved' | 'denied') => {
      onApprove(status, adminNotes);
      setIsOpen(false);
      setAdminNotes('');
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="mr-2">
            Review
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Topic Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Student</Label>
                <p className="text-sm text-muted-foreground">
                  {request.students.first_name} {request.students.last_name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Subject</Label>
                <p className="text-sm text-muted-foreground">General Topic Request</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Requested Topic</Label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                {request.requested_topic}
              </p>
            </div>

            <div>
              <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add notes for the student/parent..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Deny
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deny Topic Request</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to deny this topic request? The student and parent will be notified.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleApprove('denied')}>
                      Deny Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm">
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Topic Request</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this topic request? The student and parent will be notified.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleApprove('approved')}>
                      Approve Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (!isAdmin && !isOwner) {
    return (
      <>
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <div className="flex-1 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
              <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1">
          <PageTitle 
            title="Topic Request Approval" 
            subtitle="Review and approve student topic requests"
          />
          <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Topic Requests</h1>
          <p className="text-muted-foreground">Manage student topic requests</p>
        </div>
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
            <p className="text-sm text-muted-foreground">Denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRequests && filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">
                          {request.students.first_name} {request.students.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{request.students.email}</p>
                      </div>
                      <Badge variant="outline">General Topic Request</Badge>
                      <Badge 
                        variant={
                          request.status === 'approved' ? 'default' : 
                          request.status === 'denied' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Requested Topic:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.requested_topic}
                      </p>
                    </div>

                    {request.admin_notes && (
                      <div>
                        <Label className="text-sm font-medium">Admin Notes:</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                      {request.updated_at !== request.created_at && (
                        <> • Updated: {new Date(request.updated_at).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {request.status === 'pending' && (
                      <ApprovalDialog 
                        request={request}
                        onApprove={(status, notes) => 
                          updateStatusMutation.mutate({ id: request.id, status, adminNotes: notes })
                        }
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Topic Requests Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedStatus !== 'all' || selectedSubject !== 'all' 
                  ? 'No requests match your current filters.' 
                  : 'No topic requests have been submitted yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopicRequestsApproval;