import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, Clock, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { convertUKToUTC, formatInUKTime, createUKDateTime } from '@/utils/timezone';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';

const TimeOff = () => {
  const { userRole, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [showNoticeErrorDialog, setShowNoticeErrorDialog] = useState(false);
  const [daysNotice, setDaysNotice] = useState(0);
  const queryClient = useQueryClient();

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Validate minimum notice period (6 days)
  const validateNoticeMinimum = (startDateStr: string): { isValid: boolean, daysNotice: number } => {
    const now = new Date();
    const [datePart, timePart] = startDateStr.split('T');
    const startDateObj = new Date(datePart);
    
    // Create UK time for fair comparison
    const ukStartDate = createUKDateTime(startDateObj, timePart);
    
    // Calculate difference in milliseconds
    const diffMs = ukStartDate.getTime() - now.getTime();
    
    // Convert to days (round down)
    const daysNotice = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Minimum 6 days notice required
    return {
      isValid: daysNotice >= 6,
      daysNotice: Math.max(0, daysNotice) // Don't show negative days
    };
  };

  // Fetch tutor's time off requests
  const { data: timeOffRequests, isLoading } = useQuery({
    queryKey: ['timeOffRequests', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const { data, error } = await supabase
        .from('time_off_requests')
        .select(`
          *,
          tutor:tutors(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.email
  });

  // Create time off request mutation
  const createTimeOffMutation = useMutation({
    mutationFn: async ({ startDate, endDate, reason }: { startDate: string; endDate: string; reason: string }) => {
      if (!user?.email) throw new Error('User not authenticated');

      // Get tutor ID first
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('id')
        .eq('email', user.email)
        .single();

      if (tutorError) throw tutorError;

      // Parse datetime-local strings as UK time and convert to UTC
      // datetime-local format: "2025-09-05T18:00" - interpret as UK local time
      const [startDatePart, startTimePart] = startDate.split('T');
      const [endDatePart, endTimePart] = endDate.split('T');
      
      // Create Date objects as UK time using createUKDateTime
      const startDateObj = new Date(startDatePart);
      const endDateObj = new Date(endDatePart);
      const ukStartDate = createUKDateTime(startDateObj, startTimePart);
      const ukEndDate = createUKDateTime(endDateObj, endTimePart);
      
       const { data, error } = await supabase
         .from('time_off_requests')
         .insert({
           tutor_id: tutorData.id,
           start_date: ukStartDate.toISOString(),
           end_date: ukEndDate.toISOString(),
           reason: reason
         })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Time off request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['timeOffRequests'] });
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    },
    onError: (error) => {
      console.error('Error creating time off request:', error);
      toast.error('Failed to submit time off request');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    // Validate minimum notice period
    const noticeValidation = validateNoticeMinimum(startDate);
    if (!noticeValidation.isValid) {
      setDaysNotice(noticeValidation.daysNotice);
      setShowNoticeErrorDialog(true);
      return;
    }

    createTimeOffMutation.mutate({ startDate, endDate, reason });
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

  if (userRole !== 'tutor') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 lg:pl-64">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
              <p className="text-gray-600 mt-2">This page is only accessible to tutors.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Time Off Requests</h1>
                <p className="text-gray-600 mt-1">Manage your time off requests</p>
              </div>
              <Button onClick={() => setShowForm(!showForm)} className="bg-[#e94b7f] hover:bg-[#d63c6f]">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>

            {showForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Time Off Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>Please note:</strong> A minimum of 1 week notice is required. If lessons are affected, please give a team member a call.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="datetime-local"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide a reason for your time off request..."
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTimeOffMutation.isPending}
                        className="bg-[#e94b7f] hover:bg-[#d63c6f]"
                      >
                        {createTimeOffMutation.isPending ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Your Time Off Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : timeOffRequests?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No time off requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeOffRequests?.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
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

      <AlertDialog open={showNoticeErrorDialog} onOpenChange={setShowNoticeErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Insufficient Notice Period</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Your time off request is less than 1 week away (currently <strong>{daysNotice} day{daysNotice !== 1 ? 's' : ''}</strong> notice).
              </p>
              <p className="font-semibold">
                Please contact a team member directly to discuss urgent time off needs.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoticeErrorDialog(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeOff;
