import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { formatInUKTime } from '@/utils/timezone';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import { TimeOffFilters } from '@/components/timeOff/TimeOffFilters';
import { ConflictDetectionDialog } from '@/components/timeOff/ConflictDetectionDialog';
import { checkTimeOffConflicts, TimeOffConflict } from '@/services/timeOffConflictService';
import { cn } from '@/lib/utils';

const TimeOffRequests = () => {
  const { userRole, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'deny' | null>(null);
  
  // Conflict detection states
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflicts, setConflicts] = useState<TimeOffConflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [hasNoConflicts, setHasNoConflicts] = useState(false);
  
  // Filter states
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  const queryClient = useQueryClient();

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch all tutors for filter dropdown
  const { data: tutors } = useQuery({
    queryKey: ['tutors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutors')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch all time off requests
  const { data: timeOffRequests, isLoading } = useQuery({
    queryKey: ['allTimeOffRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select(`
          *,
          tutor:tutors(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Update time off request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      adminNotes 
    }: { 
      requestId: string; 
      status: 'approved' | 'denied'; 
      adminNotes: string 
    }) => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Time off request ${variables.status} successfully`);
      queryClient.invalidateQueries({ queryKey: ['allTimeOffRequests'] });
      setSelectedRequest(null);
      setAdminNotes('');
      setActionType(null);
    },
    onError: (error) => {
      console.error('Error updating time off request:', error);
      toast.error('Failed to update time off request');
    }
  });

  const handleAction = async (request: any, action: 'approve' | 'deny') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    
    // If approving, check for conflicts first
    if (action === 'approve') {
      await checkForConflicts(request);
    }
  };

  const checkForConflicts = async (request: any) => {
    setIsCheckingConflicts(true);
    setShowConflictDialog(true);
    
    try {
      const conflictResult = await checkTimeOffConflicts(
        request.tutor_id,
        request.start_date,
        request.end_date
      );
      
      setConflicts(conflictResult.conflicts);
      
      if (!conflictResult.hasConflicts) {
        // No conflicts found - keep dialog open to show success message
        setHasNoConflicts(true);
      } else {
        setHasNoConflicts(false);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      toast.error('Failed to check for conflicts. Please try again.');
      setShowConflictDialog(false);
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  const proceedWithApproval = () => {
    setShowConflictDialog(false);
    setHasNoConflicts(false);
    handleSubmitAction();
  };

  const handleGoToCalendar = () => {
    setShowConflictDialog(false);
    setHasNoConflicts(false);
    toast.info('Please resolve the conflicts in the calendar before approving this request.');
    navigate('/calendar');
  };

  const handleSubmitAction = () => {
    if (!selectedRequest || !actionType) return;

    // Convert action type to status value
    const status = actionType === 'approve' ? 'approved' : 'denied';

    updateRequestMutation.mutate({
      requestId: selectedRequest.id,
      status,
      adminNotes
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  // Filter logic
  const filteredRequests = useMemo(() => {
    if (!timeOffRequests) return [];
    
    return timeOffRequests.filter(request => {
      // Tutor filter
      if (selectedTutors.length > 0 && !selectedTutors.includes(request.tutor_id)) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }
      
      // Date range filter
      const requestDate = new Date(request.created_at);
      if (startDate && requestDate < startDate) {
        return false;
      }
      if (endDate && requestDate > endDate) {
        return false;
      }
      
      return true;
    });
  }, [timeOffRequests, selectedTutors, statusFilter, startDate, endDate]);

  const getPendingRequests = () => {
    return filteredRequests.filter(request => request.status === 'pending');
  };

  const getProcessedRequests = () => {
    return filteredRequests.filter(request => request.status !== 'pending');
  };

  const handleClearFilters = () => {
    setSelectedTutors([]);
    setStatusFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (userRole !== 'admin' && userRole !== 'owner') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className={cn(
          "flex flex-col flex-1 transition-all duration-300 w-full",
          "lg:ml-0",
          sidebarOpen && "lg:ml-64"
        )}>
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
              <p className="text-gray-600 mt-2">This page is only accessible to admins and owners.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 w-full",
        "lg:ml-0",
        sidebarOpen && "lg:ml-64"
      )}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Time Off Requests</h1>
              <p className="text-gray-600 mt-1">Review and manage tutor time off requests</p>
            </div>

            {/* Filters */}
            <TimeOffFilters
              selectedTutors={selectedTutors}
              onTutorChange={setSelectedTutors}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              onClearFilters={handleClearFilters}
              tutors={tutors || []}
              isLoading={isLoading}
            />

            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                  Pending Requests ({getPendingRequests().length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : getPendingRequests().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending time off requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getPendingRequests().map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {request.tutor.first_name} {request.tutor.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{request.tutor.email}</p>
                            <p className="font-medium mt-1">
                              {formatInUKTime(request.start_date, 'PPP p')} - {formatInUKTime(request.end_date, 'PPP p')}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">{request.reason}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Requested on {formatInUKTime(request.created_at, 'PPP')}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(request, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(request, 'deny')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processed Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Processed Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {getProcessedRequests().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No processed requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getProcessedRequests().slice(0, 10).map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {request.tutor.first_name} {request.tutor.last_name}
                            </p>
                            <p className="font-medium text-sm">
                              {formatInUKTime(request.start_date, 'PPP p')} - {formatInUKTime(request.end_date, 'PPP p')}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">{request.reason}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Requested on {formatInUKTime(request.created_at, 'PPP')}
                          {request.reviewed_at && (
                            <span> • Reviewed on {formatInUKTime(request.reviewed_at, 'PPP')}</span>
                          )}
                        </div>
                        {request.admin_notes && (
                          <div className="bg-gray-50 p-2 rounded text-sm">
                            <strong>Admin Notes:</strong> {request.admin_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Action Dialog - Only shown for denial or when no conflicts */}
      <Dialog open={!!selectedRequest && actionType === 'deny'} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Deny Time Off Request
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">
                  {selectedRequest.tutor.first_name} {selectedRequest.tutor.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  {formatInUKTime(selectedRequest.start_date, 'PPP p')} - {formatInUKTime(selectedRequest.end_date, 'PPP p')}
                </p>
                <p className="text-sm mt-1">{selectedRequest.reason}</p>
              </div>
              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={updateRequestMutation.isPending}
                  variant="destructive"
                >
                  {updateRequestMutation.isPending ? 'Processing...' : 'Deny Request'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conflict Detection Dialog */}
      <ConflictDetectionDialog
        isOpen={showConflictDialog}
        onClose={() => {
          setShowConflictDialog(false);
          setSelectedRequest(null);
          setActionType(null);
          setHasNoConflicts(false);
        }}
        conflicts={conflicts}
        isLoading={isCheckingConflicts}
        hasNoConflicts={hasNoConflicts}
        onNoConflictsContinue={proceedWithApproval}
        onGoToCalendar={handleGoToCalendar}
        tutorName={selectedRequest ? `${selectedRequest.tutor.first_name} ${selectedRequest.tutor.last_name}` : ''}
        timeOffPeriod={selectedRequest ? `${formatInUKTime(selectedRequest.start_date, 'PPP')} - ${formatInUKTime(selectedRequest.end_date, 'PPP')}` : ''}
      />
    </div>
  );
};

export default TimeOffRequests;
