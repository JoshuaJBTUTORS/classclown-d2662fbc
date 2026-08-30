import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { formatInUKTime, createUKDateTime } from '@/utils/timezone';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import { DoodleClock, DoodleCalendar } from '@/components/calendar/LessonDoodles';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import { cn } from '@/lib/utils';

const statusChip = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-pastel-mint text-pastel-mint-foreground';
    case 'denied':
      return 'bg-pastel-blush text-pastel-blush-foreground';
    default:
      return 'bg-pastel-butter text-pastel-butter-foreground';
  }
};

const statusLabel = (status: string) =>
  status === 'approved' ? 'Approved' : status === 'denied' ? 'Denied' : 'Pending';

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
        .ilike('email', user.email)
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

  if (userRole !== 'tutor') {
    return (
      <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          <div className="min-w-0 w-full flex-1">
            <div className="px-4 py-16 text-center sm:px-6">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">Access Denied</h1>
              <p className="mt-2 text-muted-foreground">This page is only accessible to tutors.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
      <MobileMenuButton toggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="min-w-0 w-full flex-1">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Time Off Requests
                </h1>
                <span className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleClock className="h-5 w-5" />
                </span>
              </div>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="w-full rounded-full bg-foreground px-6 text-background hover:bg-foreground/90 sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>

            {/* Request form */}
            {showForm && (
              <section className="mt-8 rounded-[var(--radius-soft)] bg-pastel-butter/50 p-4 shadow-[var(--shadow-soft)] sm:p-6">
                <div className="mb-4 flex items-center gap-3 px-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                    <DoodleCalendar className="h-4 w-4" />
                  </span>
                  <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                    Submit Time Off Request
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-start gap-3 rounded-[1.25rem] bg-card/80 p-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Please note:</strong> A minimum of 1 week notice is required. If lessons are affected, please give a team member a call - 01438582848.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Start Date
                      </Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="h-11 rounded-full border-2 border-foreground/10 bg-card px-4"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        End Date
                      </Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="h-11 rounded-full border-2 border-foreground/10 bg-card px-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reason" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Reason
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a reason for your time off request..."
                      required
                      className="min-h-[96px] rounded-2xl border-2 border-foreground/10 bg-card"
                    />
                  </div>

                  <div className="flex flex-col justify-end gap-2 pt-1 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="rounded-full border-2 border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTimeOffMutation.isPending}
                      className="rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
                    >
                      {createTimeOffMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {/* Requests list */}
            <section className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              <div className="mb-4 flex items-center gap-3 px-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleClock className="h-4 w-4" />
                </span>
                <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  Your Time Off Requests
                </h2>
                {!isLoading && (
                  <span className="inline-flex items-center rounded-full bg-pastel-butter px-3 py-1 text-xs font-semibold text-pastel-butter-foreground">
                    {timeOffRequests?.length ?? 0}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : timeOffRequests?.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-muted/40 px-6 py-12 text-center">
                  <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                  <p className="text-sm text-muted-foreground">No time off requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeOffRequests?.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-[1.25rem] border-2 border-foreground/10 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] sm:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="flex items-start gap-2 font-semibold text-foreground">
                            <DoodleCalendar className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                            <span>
                              {formatInUKTime(request.start_date, 'PPP p')} - {formatInUKTime(request.end_date, 'PPP p')}
                            </span>
                          </p>
                          {request.reason && (
                            <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            Requested on {formatInUKTime(request.created_at, 'PPP')}
                            {request.reviewed_at && (
                              <span> • Reviewed on {formatInUKTime(request.reviewed_at, 'PPP')}</span>
                            )}
                          </p>
                        </div>
                        <span className={cn('inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold', statusChip(request.status))}>
                          {statusLabel(request.status)}
                        </span>
                      </div>
                      {request.admin_notes && (
                        <div className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
                          <strong>Admin Notes:</strong> {request.admin_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <AlertDialog open={showNoticeErrorDialog} onOpenChange={setShowNoticeErrorDialog}>
        <AlertDialogContent className="cc-dialog max-w-md rounded-[var(--radius-soft)] border-2 border-foreground/10 p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/10 bg-pastel-blush text-pastel-blush-foreground">
              <AlertCircle className="h-8 w-8" strokeWidth={2.5} />
            </span>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
                Insufficient Notice Period
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-muted-foreground">
                <span className="block">
                  Your time off request is less than 1 week away (currently <strong className="text-foreground">{daysNotice} day{daysNotice !== 1 ? 's' : ''}</strong> notice).
                </span>
                <span className="block font-semibold text-foreground">
                  Please contact a team member directly to discuss urgent time off needs.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setShowNoticeErrorDialog(false)}
              className="rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeOff;
