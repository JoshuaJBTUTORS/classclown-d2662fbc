import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Loader2 } from 'lucide-react';
import { formatInUKTime } from '@/utils/timezone';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import { TimeOffFilters } from '@/components/timeOff/TimeOffFilters';
import { ConflictDetectionDialog } from '@/components/timeOff/ConflictDetectionDialog';
import { checkTimeOffConflicts, TimeOffConflict } from '@/services/timeOffConflictService';
import { DoodleClock, DoodleCalendar } from '@/components/calendar/LessonDoodles';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import { cn } from '@/lib/utils';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleCheckCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M12 3.4c4.7-.3 8.4 3.2 8.3 7.9-.1 4.9-3.9 8.8-8.5 8.7-4.8-.1-8.4-4-8.3-8.7.1-4.6 3.8-8.2 8.5-7.9z" />
    <path d="M8.2 12.2c1.2 1.3 2.3 2.5 3.4 3.8 1.6-2.4 3.2-4.7 4.9-7" />
  </svg>
);

const initials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

const avatarTones = [
  'bg-pastel-mint',
  'bg-pastel-lilac',
  'bg-pastel-butter',
  'bg-pastel-blush',
  'bg-pastel-sky',
];

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

      // Date range filter — match time off periods overlapping the selected range
      const reqStart = new Date(request.start_date);
      const reqEnd = new Date(request.end_date || request.start_date);

      if (startDate) {
        const from = new Date(startDate);
        from.setHours(0, 0, 0, 0);
        if (reqEnd < from) return false;
      }
      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        if (reqStart > to) return false;
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
      <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
        <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1">
            <div className="px-4 py-16 text-center sm:px-6">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">Access Denied</h1>
              <p className="mt-2 text-muted-foreground">This page is only accessible to admins and owners.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
      <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-w-0 w-full flex-1">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Time Off Requests
                </h1>
                <span className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleClock className="h-5 w-5" />
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Review and manage tutor time off requests</p>
            </div>

            {/* Filters */}
            <div className="mt-6">
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
            </div>

            {/* Pending Requests */}
            <section className="mt-8 rounded-[var(--radius-soft)] bg-pastel-butter/50 p-4 shadow-[var(--shadow-soft)] sm:p-6">
              <div className="mb-4 flex items-center gap-3 px-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleClock className="h-4 w-4" />
                </span>
                <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  Pending Requests
                </h2>
                <span className="inline-flex items-center rounded-full bg-pastel-butter px-3 py-1 text-xs font-semibold text-pastel-butter-foreground">
                  {getPendingRequests().length}
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : getPendingRequests().length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-card/70 px-6 py-12 text-center">
                  <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                  <p className="text-sm text-muted-foreground">No pending time off requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getPendingRequests().map((request, i) => (
                    <div
                      key={request.id}
                      className="rounded-[1.25rem] bg-card p-4 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground',
                              avatarTones[i % avatarTones.length]
                            )}
                          >
                            {initials(request.tutor.first_name, request.tutor.last_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {request.tutor.first_name} {request.tutor.last_name}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">{request.tutor.email}</p>
                            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                              <DoodleCalendar className="h-4 w-4 shrink-0 text-foreground/70" />
                              {formatInUKTime(request.start_date, 'PPP p')} - {formatInUKTime(request.end_date, 'PPP p')}
                            </p>
                            {request.reason && (
                              <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                              Requested on {formatInUKTime(request.created_at, 'PPP')}
                            </p>
                          </div>
                        </div>
                        <span className={cn('inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold', statusChip(request.status))}>
                          {statusLabel(request.status)}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(request, 'approve')}
                          className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(request, 'deny')}
                          className="rounded-full border-2 border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Processed Requests */}
            <section className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              <div className="mb-4 flex items-center gap-3 px-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleCheckCircle className="h-4 w-4" />
                </span>
                <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  Recent Processed Requests
                </h2>
              </div>

              {getProcessedRequests().length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-pastel-sand/60 px-6 py-12 text-center">
                  <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                  <p className="text-sm text-muted-foreground">No processed requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getProcessedRequests().slice(0, 10).map((request, i) => (
                    <div
                      key={request.id}
                      className="rounded-[1.25rem] bg-pastel-sand/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sky/50 sm:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground',
                              avatarTones[i % avatarTones.length]
                            )}
                          >
                            {initials(request.tutor.first_name, request.tutor.last_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {request.tutor.first_name} {request.tutor.last_name}
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                              <DoodleCalendar className="h-4 w-4 shrink-0 text-foreground/70" />
                              {formatInUKTime(request.start_date, 'PPP p')} - {formatInUKTime(request.end_date, 'PPP p')}
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
                        </div>
                        <span className={cn('inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold', statusChip(request.status))}>
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

      {/* Action Dialog - Only shown for denial or when no conflicts */}
      <Dialog open={!!selectedRequest && actionType === 'deny'} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="cc-dialog max-w-md rounded-[var(--radius-soft)] border-2 border-foreground/10 p-6">
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/10 bg-pastel-blush text-pastel-blush-foreground">
                  <X className="h-8 w-8" strokeWidth={2.5} />
                </span>
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
                    Deny Time Off Request
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="rounded-[1.25rem] border-2 border-foreground/10 bg-pastel-blush/40 p-4">
                <p className="font-semibold text-foreground">
                  {selectedRequest.tutor.first_name} {selectedRequest.tutor.last_name}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <DoodleCalendar className="h-4 w-4 shrink-0" />
                  {formatInUKTime(selectedRequest.start_date, 'PPP p')} - {formatInUKTime(selectedRequest.end_date, 'PPP p')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedRequest.reason}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                  className="min-h-[96px] rounded-2xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-full border-2 border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={updateRequestMutation.isPending}
                  className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
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
