
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createTrialAccounts } from '@/services/trialAccountService';
import { createTrialLesson } from '@/services/trialLessonService';
import { useAuth } from '@/contexts/AuthContext';

interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TrialBooking {
  id: string;
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
  preferred_date?: string;
  preferred_time?: string;
  subject_id?: string;
  status: string;
}

interface TrialBookingApprovalDialogProps {
  booking: TrialBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onApprovalComplete: () => void;
}

const TrialBookingApprovalDialog: React.FC<TrialBookingApprovalDialogProps> = ({
  booking,
  isOpen,
  onClose,
  onApprovalComplete
}) => {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonTime, setLessonTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTutors, setLoadingTutors] = useState(false);

  useEffect(() => {
    if (booking && isOpen) {
      setLessonDate(booking.preferred_date || '');
      setLessonTime(booking.preferred_time || '');
      fetchAvailableTutors();
    }
  }, [booking, isOpen]);

  const fetchAvailableTutors = async () => {
    if (!booking?.subject_id) {
      // If no subject specified, get all active tutors
      setLoadingTutors(true);
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
      } finally {
        setLoadingTutors(false);
      }
      return;
    }

    setLoadingTutors(true);
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          tutor_subjects!inner(subject_id)
        `)
        .eq('status', 'active')
        .eq('tutor_subjects.subject_id', booking.subject_id)
        .order('first_name');

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load available tutors');
    } finally {
      setLoadingTutors(false);
    }
  };

  const handleApproval = async () => {
    if (!booking || !selectedTutorId || !lessonDate || !lessonTime || !user) {
      toast.error('Please select a tutor and confirm lesson details');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Create trial accounts
      const accountResult = await createTrialAccounts({
        parent_name: booking.parent_name,
        child_name: booking.child_name,
        email: booking.email,
        phone: booking.phone
      });

      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to create trial accounts');
      }

      // Step 2: Create trial lesson
      const lessonResult = await createTrialLesson({
        bookingId: booking.id,
        tutorId: selectedTutorId,
        studentId: accountResult.studentId,
        preferredDate: lessonDate,
        preferredTime: lessonTime,
        subjectId: booking.subject_id,
        approvedBy: user.id
      });

      if (!lessonResult.success) {
        throw new Error(lessonResult.error || 'Failed to create trial lesson');
      }

      toast.success('Trial lesson approved and created successfully!');
      onApprovalComplete();
      onClose();
    } catch (error) {
      console.error('Error approving trial booking:', error);
      toast.error('Failed to approve trial booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approve Trial Lesson</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Parent:</span> {booking.parent_name}
              </div>
              <div>
                <span className="font-medium">Child:</span> {booking.child_name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {booking.email}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {booking.phone || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Tutor Selection */}
          <div>
            <Label htmlFor="tutor">Assign Tutor *</Label>
            <Select value={selectedTutorId} onValueChange={setSelectedTutorId} disabled={loadingTutors}>
              <SelectTrigger>
                <SelectValue placeholder={loadingTutors ? "Loading tutors..." : "Select a tutor"} />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {tutor.first_name} {tutor.last_name} ({tutor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tutors.length === 0 && !loadingTutors && (
              <p className="text-sm text-red-600 mt-1">
                No tutors available for the selected subject
              </p>
            )}
          </div>

          {/* Lesson Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lessonDate">Lesson Date *</Label>
              <Input
                id="lessonDate"
                type="date"
                value={lessonDate}
                onChange={(e) => setLessonDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lessonTime">Lesson Time *</Label>
              <Input
                id="lessonTime"
                type="time"
                value={lessonTime}
                onChange={(e) => setLessonTime(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleApproval} 
              disabled={isLoading || !selectedTutorId || !lessonDate || !lessonTime}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Create Lesson
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialBookingApprovalDialog;
