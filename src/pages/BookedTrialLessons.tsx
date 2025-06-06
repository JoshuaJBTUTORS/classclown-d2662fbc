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
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Check,
  X,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TrialBooking } from '@/types/trialBooking';
import { useAuth } from '@/contexts/AuthContext';

const BookedTrialLessons = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trialBookings, setTrialBookings] = useState<TrialBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<TrialBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<TrialBooking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTrialBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [trialBookings, searchQuery, statusFilter]);

  const fetchTrialBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trial_bookings')
        .select(`
          *,
          year_group:year_groups(id, display_name),
          subject:subjects(id, name),
          tutor:tutors(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast the status to the correct type to fix TypeScript error
      const processedData = (data || []).map(booking => ({
        ...booking,
        status: booking.status as 'pending' | 'approved' | 'rejected' | 'completed'
      }));
      
      setTrialBookings(processedData);
    } catch (error) {
      console.error('Error fetching trial bookings:', error);
      toast.error('Failed to load trial bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = trialBookings;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.parent_name.toLowerCase().includes(query) ||
        booking.child_name.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query) ||
        booking.subject?.name.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleViewDetails = (booking: TrialBooking) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.admin_notes || '');
    setIsDetailsOpen(true);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: 'approved' | 'rejected', notes?: string) => {
    setIsProcessing(true);
    try {
      const updateData: any = {
        status: newStatus,
        admin_notes: notes || null,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('trial_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // If approved, create a lesson
      if (newStatus === 'approved' && selectedBooking) {
        await createLessonFromBooking(selectedBooking, bookingId);
      }

      await fetchTrialBookings();
      setIsDetailsOpen(false);
      toast.success(`Trial booking ${newStatus} successfully${newStatus === 'approved' ? ' and lesson created' : ''}`);
    } catch (error) {
      console.error('Error updating trial booking:', error);
      toast.error('Failed to update trial booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const createLessonFromBooking = async (booking: TrialBooking, bookingId: string) => {
    try {
      // Create lesson date - use preferred date or default to next week
      const lessonDate = booking.preferred_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const lessonTime = booking.preferred_time || '10:00';
      
      const startDateTime = new Date(`${lessonDate}T${lessonTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour lesson

      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: `Trial Lesson - ${booking.subject?.name} for ${booking.child_name}`,
          description: `Trial lesson booked by ${booking.parent_name}. ${booking.message || ''}`,
          tutor_id: booking.tutor_id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'scheduled',
          is_group: false,
          subject: booking.subject?.name
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Update trial booking with lesson ID
      await supabase
        .from('trial_bookings')
        .update({ lesson_id: lesson.id })
        .eq('id', bookingId);

    } catch (error) {
      console.error('Error creating lesson from booking:', error);
      toast.error('Trial booking approved but failed to create lesson. Please create manually.');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Booked Trial Lessons" 
              subtitle="Manage trial lesson requests and approvals"
              className="mb-4 md:mb-0"
            />
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
                      placeholder="Search by parent name, child name, email, or subject..."
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
                      <TableHead>Parent & Child</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Year Group</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Preferred Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
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
                    ) : filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No trial bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{booking.parent_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {booking.child_name}
                              </div>
                            </div>
                          </TableCell>
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
                          <TableCell>{booking.year_group?.display_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              {booking.subject?.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.preferred_date && booking.preferred_time ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(booking.preferred_date), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {booking.preferred_time}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Flexible</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            {format(parseISO(booking.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(booking)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
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

      {/* Trial Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Trial Booking Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Parent Information
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedBooking.parent_name}</p>
                    <p><strong>Email:</strong> {selectedBooking.email}</p>
                    {selectedBooking.phone && <p><strong>Phone:</strong> {selectedBooking.phone}</p>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    Student Information
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedBooking.child_name}</p>
                    <p><strong>Year Group:</strong> {selectedBooking.year_group?.display_name}</p>
                    <p><strong>Subject:</strong> {selectedBooking.subject?.name}</p>
                  </div>
                </div>
              </div>

              {(selectedBooking.preferred_date || selectedBooking.preferred_time) && (
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Preferred Schedule
                  </h4>
                  <div className="space-y-1 text-sm">
                    {selectedBooking.preferred_date && <p><strong>Date:</strong> {format(parseISO(selectedBooking.preferred_date), 'EEEE, MMMM d, yyyy')}</p>}
                    {selectedBooking.preferred_time && <p><strong>Time:</strong> {selectedBooking.preferred_time}</p>}
                  </div>
                </div>
              )}

              {selectedBooking.tutor && (
                <div>
                  <h4 className="font-medium mb-2">Requested Tutor</h4>
                  <p className="text-sm">{selectedBooking.tutor.first_name} {selectedBooking.tutor.last_name}</p>
                </div>
              )}

              {selectedBooking.message && (
                <div>
                  <h4 className="font-medium mb-2">Additional Message</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedBooking.message}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Admin Notes</h4>
                <Textarea
                  placeholder="Add notes about this booking..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Status:</span>
                {getStatusBadge(selectedBooking.status)}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {selectedBooking?.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'rejected', adminNotes)}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'approved', adminNotes)}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Approve & Create Lesson
                  </Button>
                </>
              )}
            </div>
            <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookedTrialLessons;
