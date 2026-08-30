import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import TrialBookingApprovalDialogWithAdmin from '@/components/trialBooking/TrialBookingApprovalDialogWithAdmin';
import ReviewRoomApprovalDialog from '@/components/trialBooking/ReviewRoomApprovalDialog';
import {
  DoodleCalendar,
  DoodleCheck,
  DoodleClock,
  DoodlePerson,
  DoodleSparkle,
} from '@/components/calendar/LessonDoodles';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import { cn } from '@/lib/utils';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M11 4.2c3.6-.3 6.4 2.4 6.3 5.9-.1 3.3-2.8 5.8-6.1 5.7-3.4-.1-5.9-2.7-5.8-6C5.5 6.7 7.9 4.4 11 4.2z" />
    <path d="M15.4 14.6c1.6 1.5 3 3.1 4.3 4.9" />
  </svg>
);

const DoodleEye: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M3.5 12c2.4-4 5.2-6 8.6-6s6.3 2 8.4 6c-2.2 3.9-5.1 5.9-8.5 5.9S5.8 15.9 3.5 12z" />
    <path d="M12 9.1c1.7-.1 3 1.2 2.9 2.8-.1 1.6-1.4 2.8-3 2.7-1.6-.1-2.8-1.3-2.7-2.9.1-1.5 1.3-2.6 2.8-2.6z" />
  </svg>
);

const DoodleX: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M6.2 6.4c3.8 3.8 7.7 7.5 11.6 11.2M17.8 6.2c-3.8 3.9-7.6 7.7-11.4 11.5" />
  </svg>
);

const DoodleUserPlus: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M10 4.4c2-.1 3.5 1.4 3.4 3.4-.1 1.8-1.5 3.2-3.4 3.1-1.8-.1-3.2-1.5-3.1-3.4.1-1.8 1.4-3 3.1-3.1z" />
    <path d="M3.8 19.5c.6-3.4 3-5.3 6.3-5.3 1.5 0 2.8.3 3.9 1" />
    <path d="M17.8 13.1v6M14.8 16.1h6" />
  </svg>
);

const DoodleDownload: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M12 3.8v10.4M7.6 10.2c1.5 1.5 2.9 3 4.4 4.6 1.5-1.6 2.9-3.1 4.4-4.6" />
    <path d="M4.8 18.8c4.8.5 9.6.5 14.4 0" />
  </svg>
);

const DoodleBell: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M6.2 10.3c.1-3.4 2.3-5.5 5.8-5.5s5.7 2.1 5.8 5.5c0 2.1.4 3.7 1.5 5.1-4.5.5-9 .5-13.5 0 1.1-1.4 1.5-3 1.4-5.1z" />
    <path d="M10 18.7c.5 1.1 1.1 1.6 2 1.6s1.5-.5 2-1.6" />
  </svg>
);

const avatarTones = [
  'bg-pastel-mint',
  'bg-pastel-lilac',
  'bg-pastel-butter',
  'bg-pastel-blush',
  'bg-pastel-sky',
];

const initialsFromName = (name?: string | null) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.charAt(0) || ''}${parts[1]?.charAt(0) || ''}`.toUpperCase() || '?';
};

interface TrialBooking {
  id: string;
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
  preferred_date?: string;
  preferred_time?: string;
  lesson_time?: string;
  message?: string;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  subject_id?: string;
  assigned_tutor_id?: string;
  lesson_id?: string;
  booking_source?: string;
  referral_code?: string;
}

const TrialBookings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [bookings, setBookings] = useState<TrialBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<TrialBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [referralFilter, setReferralFilter] = useState<'all' | 'referred' | 'not_referred'>('all');
  const [sourceTab, setSourceTab] = useState<'all' | 'trial' | 'review_room'>('all');
  const [reviewRoomDayTab, setReviewRoomDayTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<TrialBooking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [reviewRoomGroup, setReviewRoomGroup] = useState<TrialBooking[] | null>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const resendConfirmation = async (booking: TrialBooking) => {
    setResendingId(booking.id);
    try {
      let subjectName = 'your trial lesson';
      if (booking.subject_id) {
        const { data: subj } = await supabase
          .from('subjects')
          .select('name')
          .eq('id', booking.subject_id)
          .maybeSingle();
        if (subj?.name) subjectName = subj.name;
      }

      const { error } = await supabase.functions.invoke('send-trial-booking-confirmation', {
        body: {
          parentName: booking.parent_name,
          childName: booking.child_name,
          email: booking.email,
          phone: booking.phone,
          subject: subjectName,
          preferredDate: booking.preferred_date || '',
          preferredTime: booking.preferred_time || booking.lesson_time || '',
          message: booking.message,
          bookingType: booking.booking_source === 'review_room' ? 'review_room' : undefined,
        },
      });
      if (error) throw error;
      toast.success(`Confirmation resent to ${booking.parent_name}`);
    } catch (err: any) {
      console.error('Failed to resend confirmation:', err);
      toast.error(`Failed to resend confirmation: ${err.message || 'Unknown error'}`);
    } finally {
      setResendingId(null);
    }
  };


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    fetchBookings();
    fetchTutors();
    fetchAdmins();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter, referralFilter, sourceTab, reviewRoomDayTab]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trial_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching trial bookings:', error);
      toast.error('Failed to load trial bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('id, first_name, last_name, email')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load tutors');
    }
  };

  const fetchAdmins = async () => {
    try {
      // First get admin user IDs
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'owner']);

      if (rolesError) throw rolesError;
      
      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        return;
      }

      const adminIds = adminRoles.map(role => role.user_id);

      // Then get their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', adminIds);

      if (profilesError) throw profilesError;
      
      const adminData = profiles?.map(profile => ({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || ''
      })) || [];
      
      setAdmins(adminData);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Source tab filter
    if (sourceTab === 'review_room') {
      filtered = filtered.filter((b) => b.booking_source === 'review_room');
      if (reviewRoomDayTab !== 'all') {
        filtered = filtered.filter((b) => b.preferred_date === reviewRoomDayTab);
      }
    } else if (sourceTab === 'trial') {
      filtered = filtered.filter((b) => b.booking_source !== 'review_room');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.parent_name.toLowerCase().includes(query) ||
        booking.child_name.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (referralFilter !== 'all') {
      const hasCode = (b: TrialBooking) => Boolean(b.referral_code && b.referral_code.trim());
      filtered = filtered.filter(booking =>
        referralFilter === 'referred' ? hasCode(booking) : !hasCode(booking)
      );
    }

    setFilteredBookings(filtered);
  };

  const REVIEW_ROOM_DAYS = [
    { date: '2026-04-25', label: 'Sat 25 Apr' },
    { date: '2026-04-26', label: 'Sun 26 Apr' },
    { date: '2026-05-02', label: 'Sat 2 May' },
    { date: '2026-05-03', label: 'Sun 3 May' },
  ];

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('trial_bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status, updated_at: new Date().toISOString() }
          : booking
      ));

      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleApprovalComplete = () => {
    fetchBookings();
  };

  const viewBookingDetails = (booking: TrialBooking) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const openApprovalDialog = (booking: TrialBooking) => {
    setSelectedBooking(booking);
    setIsApprovalOpen(true);
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-pastel-butter text-pastel-butter-foreground';
      case 'approved': return 'bg-pastel-mint text-pastel-mint-foreground';
      case 'rejected': return 'bg-pastel-blush text-pastel-blush-foreground';
      case 'completed': return 'bg-pastel-sky text-pastel-sky-foreground';
      default: return 'bg-pastel-sand text-pastel-sand-foreground';
    }
  };

  const statusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const actionButtonClass = 'flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-transparent text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-40';

  const reviewGroups = Array.from(
    filteredBookings.reduce((groups, booking) => {
      const key = (booking.email || '').toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(booking);
      return groups;
    }, new Map<string, TrialBooking[]>()).values()
  ).sort((a, b) => (a[0].parent_name || '').localeCompare(b[0].parent_name || ''));


  return (
    <div className="min-h-screen w-full min-w-0 flex-1 bg-background">
      <MobileMenuButton toggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="min-w-0 w-full flex-1">
          <main className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                    Trial Bookings
                  </h1>
                  <span className="mt-2 inline-flex items-center rounded-full bg-pastel-lilac px-3 py-1 text-xs font-semibold text-foreground">
                    {filteredBookings.length}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage trial lesson requests
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border-2 border-foreground bg-transparent px-5 text-sm font-semibold text-foreground shadow-none hover:bg-foreground/[0.04]"
                >
                  <Link to="/review-room" target="_blank">
                    <DoodleSparkle className="mr-2 h-4 w-4" />
                    Review Room
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-2 border-foreground bg-transparent px-5 text-sm font-semibold text-foreground shadow-none hover:bg-foreground/[0.04]"
                >
                  <DoodleDownload className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <section className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/70 bg-pastel-butter text-foreground">
                  <DoodleSparkle className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  Trial Lesson Requests
                </h2>
              </div>

              <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as typeof sourceTab)} className="mb-4">
                <TabsList className="h-auto rounded-full border-2 border-foreground/10 bg-pastel-sand/50 p-1">
                  <TabsTrigger className="rounded-full px-4 data-[state=active]:bg-foreground data-[state=active]:text-background" value="all">All</TabsTrigger>
                  <TabsTrigger className="rounded-full px-4 data-[state=active]:bg-foreground data-[state=active]:text-background" value="trial">Trial Lessons</TabsTrigger>
                  <TabsTrigger className="rounded-full px-4 data-[state=active]:bg-foreground data-[state=active]:text-background" value="review_room">Review Room</TabsTrigger>
                </TabsList>
              </Tabs>

              {sourceTab === 'review_room' && (
                <Tabs
                  value={reviewRoomDayTab}
                  onValueChange={setReviewRoomDayTab}
                  className="mb-4"
                >
                  <TabsList className="h-auto flex-wrap rounded-[1.25rem] border-2 border-foreground/10 bg-pastel-sky/40 p-1">
                    <TabsTrigger className="rounded-full px-4 data-[state=active]:bg-foreground data-[state=active]:text-background" value="all">All Days</TabsTrigger>
                    {REVIEW_ROOM_DAYS.map((d) => (
                      <TabsTrigger
                        key={d.date}
                        value={d.date}
                        className="rounded-full px-4 data-[state=active]:bg-foreground data-[state=active]:text-background"
                      >
                        {d.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                    <DoodleSearch className="h-4 w-4" />
                  </span>
                  <Input
                    placeholder="Search by parent name, child name, or email..."
                    className="h-12 rounded-full border-2 border-foreground bg-transparent pl-12 pr-5 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 rounded-full border-2 border-foreground bg-transparent px-5 shadow-none focus:ring-0">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={referralFilter} onValueChange={(v) => setReferralFilter(v as typeof referralFilter)}>
                  <SelectTrigger className="h-12 rounded-full border-2 border-foreground bg-transparent px-5 shadow-none focus:ring-0">
                    <SelectValue placeholder="Filter by referral" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="all">All Referrals</SelectItem>
                    <SelectItem value="referred">Referred only</SelectItem>
                    <SelectItem value="not_referred">Not referred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-pastel-sand/60 px-6 py-14 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading trial bookings...</p>
                </div>
              ) : sourceTab === 'review_room' ? (
                reviewGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-pastel-sand/60 px-6 py-14 text-center">
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">No Review Room bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,0.75fr)_minmax(0,0.7fr)_minmax(0,0.75fr)_auto] gap-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                      <span>Family</span>
                      <span>Contact</span>
                      <span>Sessions</span>
                      <span>Status</span>
                      <span>Referral</span>
                      <span>Submitted</span>
                      <span className="text-right">Actions</span>
                    </div>

                    {reviewGroups.map((group, groupIndex) => {
                      const head = group[0];
                      const pendingCount = group.filter((g) => g.status === 'pending').length;
                      const approvedCount = group.filter((g) => g.status === 'approved').length;
                      const rejectedCount = group.filter((g) => g.status === 'rejected').length;
                      const aggregateStatus =
                        pendingCount > 0
                          ? 'pending'
                          : approvedCount > 0
                            ? 'approved'
                            : rejectedCount > 0
                              ? 'rejected'
                              : group[0].status;
                      const sortedSessions = [...group].sort((a, b) =>
                        `${a.preferred_date}${a.preferred_time}`.localeCompare(
                          `${b.preferred_date}${b.preferred_time}`,
                        ),
                      );

                      return (
                        <div
                          key={`grp-${head.email}`}
                          className="grid grid-cols-1 gap-4 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sky/60 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,0.75fr)_minmax(0,0.7fr)_minmax(0,0.75fr)_auto] lg:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground', avatarTones[groupIndex % avatarTones.length])}>
                              {initialsFromName(head.parent_name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{head.parent_name}</p>
                              <p className="truncate text-sm text-muted-foreground">Child: {head.child_name}</p>
                            </div>
                          </div>

                          <div className="min-w-0 pl-13 lg:pl-0">
                            <p className="truncate text-sm text-foreground">{head.email}</p>
                            <p className="truncate text-sm text-muted-foreground">{head.phone || 'No phone provided'}</p>
                          </div>

                          <div className="min-w-0 pl-13 lg:pl-0">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {group.length} session{group.length === 1 ? '' : 's'}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {sortedSessions.slice(0, 4).map((session) => (
                                <span
                                  key={session.id}
                                  className={cn(
                                    'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold',
                                    getStatusTone(session.status),
                                    session.status === 'rejected' && 'line-through opacity-75',
                                  )}
                                >
                                  {session.preferred_date ? format(parseISO(session.preferred_date), 'MMM d') : '?'} {session.preferred_time?.slice(0, 5)}
                                </span>
                              ))}
                              {sortedSessions.length > 4 && (
                                <span className="inline-flex items-center rounded-full bg-pastel-sand px-2.5 py-1 text-[10px] font-semibold text-pastel-sand-foreground">
                                  +{sortedSessions.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pl-13 lg:pl-0">
                            <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', getStatusTone(aggregateStatus))}>
                              {statusLabel(aggregateStatus)}
                            </span>
                            {(approvedCount > 0 || rejectedCount > 0) && pendingCount > 0 && (
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {pendingCount} pending · {approvedCount} approved
                              </p>
                            )}
                          </div>

                          <div className="pl-13 lg:pl-0">
                            {head.referral_code ? (
                              <span className="inline-flex items-center rounded-full bg-pastel-lilac px-3 py-1 text-xs font-semibold text-pastel-lilac-foreground" title={`Referred with code ${head.referral_code}`}>
                                Referred
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pl-13 text-sm text-muted-foreground lg:pl-0">
                            <DoodleClock className="h-4 w-4 shrink-0" />
                            <span>{format(parseISO(head.created_at), 'MMM d, yyyy')}</span>
                          </div>

                          <div className="flex flex-wrap justify-start gap-2 pl-13 lg:justify-end lg:pl-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewBookingDetails(head)}
                              title="View first session details"
                              className={actionButtonClass}
                            >
                              <DoodleEye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendConfirmation(head)}
                              disabled={resendingId === head.id}
                              className={actionButtonClass}
                              title="Resend confirmation email"
                            >
                              {resendingId === head.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoodleBell className="h-4 w-4" />}
                            </Button>
                            {pendingCount > 0 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReviewRoomGroup(group)}
                                  className={actionButtonClass}
                                  title={`Approve ${pendingCount} session${pendingCount === 1 ? '' : 's'}`}
                                >
                                  <DoodleCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    for (const s of group.filter((g) => g.status === 'pending')) {
                                      await updateBookingStatus(s.id, 'rejected');
                                    }
                                  }}
                                  className={cn(actionButtonClass, 'text-destructive hover:bg-destructive/10')}
                                  title="Reject all pending"
                                >
                                  <DoodleX className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-pastel-sand/60 px-6 py-14 text-center">
                  <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                  <p className="text-sm text-muted-foreground">No trial bookings found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.7fr)_minmax(0,0.75fr)_auto] gap-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                    <span>Family</span>
                    <span>Contact</span>
                    <span>Preferred Date</span>
                    <span>Status</span>
                    <span>Referral</span>
                    <span>Submitted</span>
                    <span className="text-right">Actions</span>
                  </div>

                  {filteredBookings.map((booking, bookingIndex) => (
                    <div
                      key={booking.id}
                      className="grid grid-cols-1 gap-4 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sky/60 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.7fr)_minmax(0,0.75fr)_auto] lg:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground', avatarTones[bookingIndex % avatarTones.length])}>
                          {initialsFromName(booking.parent_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{booking.parent_name}</p>
                          <p className="truncate text-sm text-muted-foreground">Child: {booking.child_name}</p>
                        </div>
                      </div>

                      <div className="min-w-0 pl-13 lg:pl-0">
                        <p className="truncate text-sm text-foreground">{booking.email}</p>
                        <p className="truncate text-sm text-muted-foreground">{booking.phone || 'No phone provided'}</p>
                      </div>

                      <div className="pl-13 lg:pl-0">
                        {booking.preferred_date ? (
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <DoodleCalendar className="h-4 w-4 shrink-0 text-foreground/70" />
                            <span>{format(parseISO(booking.preferred_date), 'MMM d, yyyy')}</span>
                            {booking.preferred_time && (
                              <span className="text-muted-foreground">at {booking.preferred_time}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not specified</span>
                        )}
                      </div>

                      <div className="pl-13 lg:pl-0">
                        <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', getStatusTone(booking.status))}>
                          {statusLabel(booking.status)}
                        </span>
                      </div>

                      <div className="pl-13 lg:pl-0">
                        {booking.referral_code ? (
                          <span className="inline-flex items-center rounded-full bg-pastel-lilac px-3 py-1 text-xs font-semibold text-pastel-lilac-foreground" title={`Referred with code ${booking.referral_code}`}>
                            Referred
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pl-13 text-sm text-muted-foreground lg:pl-0">
                        <DoodleClock className="h-4 w-4 shrink-0" />
                        <span>{format(parseISO(booking.created_at), 'MMM d, yyyy')}</span>
                      </div>

                      <div className="flex flex-wrap justify-start gap-2 pl-13 lg:justify-end lg:pl-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewBookingDetails(booking)}
                          title="View booking details"
                          className={actionButtonClass}
                        >
                          <DoodleEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendConfirmation(booking)}
                          disabled={resendingId === booking.id}
                          className={actionButtonClass}
                          title="Resend confirmation email"
                        >
                          {resendingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoodleBell className="h-4 w-4" />}
                        </Button>
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openApprovalDialog(booking)}
                              title="Approve booking"
                              className={actionButtonClass}
                            >
                              <DoodleUserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'rejected')}
                              title="Reject booking"
                              className={cn(actionButtonClass, 'text-destructive hover:bg-destructive/10')}
                            >
                              <DoodleX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>


      {/* Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="cc-dialog max-h-[90dvh] max-w-2xl overflow-y-auto rounded-[var(--radius-soft)] border-2 border-foreground/10 p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/10 bg-pastel-lilac text-pastel-lilac-foreground">
              <DoodlePerson className="h-8 w-8" />
            </span>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
                Trial Booking Details
              </DialogTitle>
            </DialogHeader>
          </div>

          {selectedBooking && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 rounded-[1.25rem] bg-pastel-sand/50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent Name</p>
                  <p className="mt-1 font-semibold text-foreground">{selectedBooking.parent_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Child Name</p>
                  <p className="mt-1 font-semibold text-foreground">{selectedBooking.child_name}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.25rem] bg-pastel-sky/50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="mt-1 break-all text-sm text-foreground">{selectedBooking.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
                  <p className="mt-1 text-sm text-foreground">{selectedBooking.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.25rem] bg-pastel-butter/60 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preferred Date</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                    <DoodleCalendar className="h-4 w-4 shrink-0" />
                    {selectedBooking.preferred_date ? format(parseISO(selectedBooking.preferred_date), 'MMM d, yyyy') : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo Session Time</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                    <DoodleClock className="h-4 w-4 shrink-0" />
                    {selectedBooking.preferred_time || 'Not specified'}
                  </p>
                </div>
              </div>

              {selectedBooking.lesson_time && (
                <div className="grid gap-3 rounded-[1.25rem] bg-pastel-mint/60 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lesson Time</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{selectedBooking.lesson_time}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Difference</p>
                    <p className="mt-1 text-sm font-medium text-foreground">15 minutes demo + lesson</p>
                  </div>
                </div>
              )}

              {selectedBooking.message && (
                <div className="rounded-[1.25rem] bg-pastel-sky/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{selectedBooking.message}</p>
                </div>
              )}

              {selectedBooking.referral_code && (
                <div className="rounded-[1.25rem] bg-pastel-lilac p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-pastel-lilac-foreground/80">Referral</p>
                  <p className="mt-2 text-sm text-pastel-lilac-foreground">
                    Booked via referral code <code className="rounded-full bg-background/60 px-2 py-0.5 text-xs font-mono">{selectedBooking.referral_code}</code>
                  </p>
                </div>
              )}

              <div className="grid gap-3 rounded-[1.25rem] bg-card p-4 shadow-[var(--shadow-soft)] sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                  <span className={cn('mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', getStatusTone(selectedBooking.status))}>
                    {statusLabel(selectedBooking.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
                  <p className="mt-2 text-sm text-foreground">{format(parseISO(selectedBooking.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Approval Dialog */}
      <TrialBookingApprovalDialogWithAdmin
        booking={selectedBooking}
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onApprovalComplete={handleApprovalComplete}
        admins={admins}
      />

      {/* Review Room Bulk Approval */}
      {reviewRoomGroup && (
        <ReviewRoomApprovalDialog
          isOpen={!!reviewRoomGroup}
          onClose={() => setReviewRoomGroup(null)}
          bookings={reviewRoomGroup as any}
          onComplete={() => {
            setReviewRoomGroup(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};

export default TrialBookings;
