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
import { DoodleEmpty, DoodleSend } from '@/components/progress/ProgressDoodles';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Trial Bookings" 
              subtitle="Manage trial lesson requests"
              className="mb-4 md:mb-0"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Trial Lesson Requests</CardTitle>
                <Button asChild variant="outline" size="sm" className="gap-1.5 w-fit">
                  <Link to="/review-room" target="_blank">
                    <Sparkles className="h-4 w-4" />
                    Review Room
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as typeof sourceTab)} className="mb-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="trial">Trial Lessons</TabsTrigger>
                  <TabsTrigger value="review_room">Review Room</TabsTrigger>
                </TabsList>
              </Tabs>

              {sourceTab === 'review_room' && (
                <Tabs
                  value={reviewRoomDayTab}
                  onValueChange={setReviewRoomDayTab}
                  className="mb-4"
                >
                  <TabsList>
                    <TabsTrigger value="all">All Days</TabsTrigger>
                    {REVIEW_ROOM_DAYS.map((d) => (
                      <TabsTrigger key={d.date} value={d.date}>
                        {d.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by parent name, child name, or email..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-[180px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[180px]">
                  <Select value={referralFilter} onValueChange={(v) => setReferralFilter(v as typeof referralFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by referral" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Referrals</SelectItem>
                      <SelectItem value="referred">Referred only</SelectItem>
                      <SelectItem value="not_referred">Not referred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Child Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>
                        {sourceTab === 'review_room' ? 'Sessions' : 'Preferred Date'}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referral</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Loading trial bookings...
                        </TableCell>
                      </TableRow>
                    ) : sourceTab === 'review_room' ? (
                      (() => {
                        // Group by lowercased email
                        const groups = new Map<string, TrialBooking[]>();
                        for (const b of filteredBookings) {
                          const key = (b.email || '').toLowerCase();
                          if (!groups.has(key)) groups.set(key, []);
                          groups.get(key)!.push(b);
                        }
                        const groupArr = Array.from(groups.values()).sort((a, b) =>
                          (a[0].parent_name || '').localeCompare(b[0].parent_name || ''),
                        );

                        if (groupArr.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={8} className="h-24 text-center">
                                No Review Room bookings found
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return groupArr.map((group) => {
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
                            <TableRow key={`grp-${head.email}`}>
                              <TableCell className="font-medium">{head.parent_name}</TableCell>
                              <TableCell>{head.child_name}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3" />
                                    {head.email}
                                  </div>
                                  {head.phone && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      {head.phone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 max-w-[260px]">
                                  <span className="text-xs text-muted-foreground">
                                    {group.length} session{group.length === 1 ? '' : 's'}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {sortedSessions.slice(0, 4).map((s) => (
                                      <Badge
                                        key={s.id}
                                        variant="outline"
                                        className={cn(
                                          'text-[10px] font-normal',
                                          s.status === 'approved' && 'border-green-300 bg-green-50 text-green-800',
                                          s.status === 'rejected' && 'border-red-300 bg-red-50 text-red-700 line-through',
                                          s.status === 'pending' && 'border-yellow-300 bg-yellow-50 text-yellow-800',
                                        )}
                                      >
                                        {s.preferred_date
                                          ? format(parseISO(s.preferred_date), 'MMM d')
                                          : '?'}{' '}
                                        {s.preferred_time?.slice(0, 5)}
                                      </Badge>
                                    ))}
                                    {sortedSessions.length > 4 && (
                                      <Badge variant="outline" className="text-[10px] font-normal">
                                        +{sortedSessions.length - 4} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge className={getStatusColor(aggregateStatus)}>
                                    {aggregateStatus.charAt(0).toUpperCase() + aggregateStatus.slice(1)}
                                  </Badge>
                                  {(approvedCount > 0 || rejectedCount > 0) && pendingCount > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {pendingCount} pending · {approvedCount} approved
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {head.referral_code ? (
                                  <Badge variant="secondary" title={`Referred with code ${head.referral_code}`}>
                                    Referred
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{format(parseISO(head.created_at), 'MMM d, yyyy')}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewBookingDetails(head)}
                                    title="View first session details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => resendConfirmation(head)}
                                    disabled={resendingId === head.id}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Resend confirmation email"
                                  >
                                    <BellRing className="h-4 w-4" />
                                  </Button>
                                  {pendingCount > 0 && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReviewRoomGroup(group)}
                                        className="text-green-600 hover:text-green-800"
                                        title={`Approve ${pendingCount} session${pendingCount === 1 ? '' : 's'}`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                          for (const s of group.filter((g) => g.status === 'pending')) {
                                            await updateBookingStatus(s.id, 'rejected');
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                        title="Reject all pending"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()
                    ) : filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No trial bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.parent_name}</TableCell>
                          <TableCell>{booking.child_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {booking.email}
                              </div>
                              {booking.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {booking.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.preferred_date ? (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{format(parseISO(booking.preferred_date), 'MMM d, yyyy')}</span>
                                {booking.preferred_time && (
                                  <span className="text-muted-foreground">at {booking.preferred_time}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not specified</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {booking.referral_code ? (
                              <Badge variant="secondary" title={`Referred with code ${booking.referral_code}`}>
                                Referred
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{format(parseISO(booking.created_at), 'MMM d, yyyy')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewBookingDetails(booking)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resendConfirmation(booking)}
                                disabled={resendingId === booking.id}
                                className="text-blue-600 hover:text-blue-800"
                                title="Resend confirmation email"
                              >
                                <BellRing className="h-4 w-4" />
                              </Button>
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openApprovalDialog(booking)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trial Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Parent Name</label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.parent_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Child Name</label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.child_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Preferred Date</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.preferred_date ? format(parseISO(selectedBooking.preferred_date), 'MMM d, yyyy') : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Demo Session Time</label>
                  <p className="text-sm text-muted-foreground">{selectedBooking.preferred_time || 'Not specified'}</p>
                </div>
              </div>
              {selectedBooking.lesson_time && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Lesson Time</label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.lesson_time}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time Difference</label>
                    <p className="text-sm text-muted-foreground">15 minutes demo + lesson</p>
                  </div>
                </div>
              )}
              {selectedBooking.message && (
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedBooking.message}</p>
                </div>
              )}
              {selectedBooking.referral_code && (
                <div className="rounded-md border bg-muted/50 p-3">
                  <label className="text-sm font-medium">Referral</label>
                  <p className="text-sm text-muted-foreground">
                    Booked via referral code <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{selectedBooking.referral_code}</code>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Submitted</label>
                  <p className="text-sm text-muted-foreground">{format(parseISO(selectedBooking.created_at), 'MMM d, yyyy h:mm a')}</p>
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
    </>
  );
};

export default TrialBookings;
