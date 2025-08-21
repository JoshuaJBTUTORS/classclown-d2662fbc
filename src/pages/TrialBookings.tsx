import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { 
  Calendar as CalendarIcon, 
  Download,
  Search, 
  Eye,
  Check,
  X,
  Clock,
  Phone,
  Mail,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import TrialBookingApprovalDialogWithAdmin from '@/components/trialBooking/TrialBookingApprovalDialogWithAdmin';
import { cn } from '@/lib/utils';

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
}

const TrialBookings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [bookings, setBookings] = useState<TrialBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<TrialBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<TrialBooking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [tutors, setTutors] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

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
  }, [bookings, searchQuery, statusFilter]);

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

    setFilteredBookings(filtered);
  };

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
        <Navbar toggleSidebar={toggleSidebar} />
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
              <CardTitle>Trial Lesson Requests</CardTitle>
            </CardHeader>
            <CardContent>
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
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Child Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Preferred Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Loading trial bookings...
                        </TableCell>
                      </TableRow>
                    ) : filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
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
              {selectedBooking.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'approved');
                      setIsDetailsOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'rejected');
                      setIsDetailsOpen(false);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              )}
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
    </>
  );
};

export default TrialBookings;
