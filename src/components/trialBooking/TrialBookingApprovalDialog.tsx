import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createTrialStudent } from '@/services/trialAccountService';
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
  const [currentStep, setCurrentStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (booking && isOpen) {
      setLessonDate(booking.preferred_date || '');
      setLessonTime(booking.preferred_time || '');
      setCurrentStep('form');
      setErrorMessage('');
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
    setCurrentStep('processing');
    
    try {
      console.log('Starting approval process for booking:', booking.id);
      
      // Step 1: Create trial student account (standalone, no parent)
      toast.info('Creating trial student account...');
      const accountResult = await createTrialStudent({
        parent_name: booking.parent_name,
        child_name: booking.child_name,
        email: booking.email,
        phone: booking.phone
      });

      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to create trial student');
      }

      console.log('Trial student created successfully');
      
      // Step 2: Create trial lesson
      toast.info('Creating trial lesson...');
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

      console.log('Trial lesson created successfully');
      setCurrentStep('success');
      toast.success('Trial lesson approved and created successfully!');
      
      // Wait a moment before closing to show success state
      setTimeout(() => {
        onApprovalComplete();
        onClose();
        setCurrentStep('form');
      }, 2000);
      
    } catch (error) {
      console.error('Error approving trial booking:', error);
      setCurrentStep('error');
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrorMessage(errorMsg);
      toast.error(`Failed to approve trial booking: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCurrentStep('form');
      setErrorMessage('');
      onClose();
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'processing' && 'Processing Trial Approval...'}
            {currentStep === 'success' && 'Trial Lesson Approved!'}
            {currentStep === 'error' && 'Approval Failed'}
            {currentStep === 'form' && 'Approve Trial Lesson'}
          </DialogTitle>
        </DialogHeader>
        
        {currentStep === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Creating trial student and lesson...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        )}

        {currentStep === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-green-700">Trial lesson approved successfully!</p>
            <p className="text-sm text-muted-foreground">Trial student created and lesson scheduled</p>
          </div>
        )}

        {currentStep === 'error' && (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-700">Approval failed</p>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            <Button onClick={() => setCurrentStep('form')} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {currentStep === 'form' && (
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
                <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    No tutors available for the selected subject
                  </p>
                </div>
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
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrialBookingApprovalDialog;
