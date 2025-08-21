import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createTrialLesson } from '@/services/trialLessonService';
import { useSubjects } from '@/hooks/useSubjects';
import { useSmartAvailableTutors } from '@/hooks/useSmartAvailableTutors';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface TrialBookingApprovalDialogWithAdminProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onApprovalComplete: () => void;
  admins: any[];
}

const TrialBookingApprovalDialogWithAdmin: React.FC<TrialBookingApprovalDialogWithAdminProps> = ({
  isOpen,
  onClose,
  booking,
  onApprovalComplete,
  admins
}) => {
  // Early return if booking is null
  if (!booking) return null;

  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { subjects } = useSubjects();

  // Use smart availability filtering for tutors
  const { tutors: smartTutors, isLoading: tutorsLoading, error: tutorsError } = useSmartAvailableTutors(
    booking?.subject_id,
    booking?.preferred_date,
    booking?.preferred_time
  );

  // Get subject name from subject_id
  const subjectName = subjects.find(s => s && s.id === booking.subject_id)?.name || 'Unknown Subject';

  // Helper function to get availability status icon and color
  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'busy':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'time_off':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'no_availability':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Available</Badge>;
      case 'busy':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">Busy</Badge>;
      case 'time_off':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Time Off</Badge>;
      case 'no_availability':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">No Availability</Badge>;
      case 'checking':
        return <Badge variant="outline" className="bg-gray-50 text-gray-500">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleApprove = async () => {
    if (!selectedTutor || !selectedAdmin) {
      toast({
        title: "Error",
        description: "Please select both a tutor and an admin",
        variant: "destructive",
      });
      return;
    }

    // Check if selected tutor is actually available
    const selectedTutorData = smartTutors.find(t => t.id === selectedTutor);
    if (selectedTutorData && selectedTutorData.availability_status !== 'available') {
      toast({
        title: "Warning",
        description: `The selected tutor is ${selectedTutorData.availability_status}. Please select an available tutor or choose a different time.`,
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createTrialLesson({
        bookingId: booking.id,
        tutorId: selectedTutor,
        adminId: selectedAdmin,
        preferredDate: booking.preferred_date,
        preferredTime: booking.preferred_time,
        subjectId: booking.subject_id,
        studentName: booking.child_name,
        parentEmail: booking.email,
        parentName: booking.parent_name,
      });

      toast({
        title: "Success",
        description: "Trial lesson approved and created successfully",
      });

      onApprovalComplete();
      onClose();
    } catch (error: any) {
      console.error('Error creating trial lesson:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create trial lesson",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Approve Trial Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Student:</strong> {booking.child_name}
              </div>
              <div>
                <strong>Parent:</strong> {booking.parent_name}
              </div>
              <div>
                <strong>Subject:</strong> {subjectName}
              </div>
              <div>
                <strong>Email:</strong> {booking.email}
              </div>
              <div>
                <strong>Date:</strong> {new Date(booking.preferred_date).toLocaleDateString()}
              </div>
              <div>
                <strong>Time:</strong> {booking.preferred_time}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tutor-select">
                Select Tutor 
                <span className="text-sm text-muted-foreground ml-2">
                  (Filtered by subject and availability)
                </span>
              </Label>
              
              {tutorsError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {tutorsError}
                </div>
              )}
              
              {tutorsLoading ? (
                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking tutor availability...
                </div>
              ) : smartTutors.length === 0 ? (
                <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  No tutors available for {subjectName} at {booking.preferred_time} on{' '}
                  {new Date(booking.preferred_date).toLocaleDateString()}
                </div>
              ) : (
                <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {smartTutors.map((tutor) => (
                      <SelectItem 
                        key={tutor.id} 
                        value={tutor.id}
                        disabled={tutor.availability_status !== 'available'}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {getAvailabilityIcon(tutor.availability_status)}
                            <span>{tutor.first_name} {tutor.last_name}</span>
                          </div>
                          {getAvailabilityBadge(tutor.availability_status)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Show availability details for selected tutor */}
              {selectedTutor && smartTutors.find(t => t.id === selectedTutor) && (
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  {(() => {
                    const tutor = smartTutors.find(t => t.id === selectedTutor);
                    if (!tutor) return null;
                    
                    if (tutor.availability_status === 'available') {
                      return (
                        <div className="flex items-center text-sm text-green-700">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          This tutor is available for the requested time
                        </div>
                      );
                    } else if (tutor.conflicts && tutor.conflicts.length > 0) {
                      return (
                        <div className="text-sm">
                          <p className="font-medium text-red-700 mb-1">Conflicts:</p>
                          <ul className="text-red-600 space-y-1">
                            {tutor.conflicts.map((conflict, idx) => (
                              <li key={idx}>• {conflict}</li>
                            ))}
                          </ul>
                          {tutor.next_available_slot && (
                            <p className="text-blue-600 mt-2">
                              Next available: {tutor.next_available_slot}
                            </p>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-select">Select Admin for Demo Session</Label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.first_name} {admin.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Demo Session Info</h4>
            <p className="text-sm text-blue-700">
              A 15-minute demo session will be created before the main lesson. 
              The admin will join first to introduce the platform, then the tutor will join for the actual lesson.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              All times shown in UK timezone ({booking.preferred_time} on {new Date(booking.preferred_date).toLocaleDateString()})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={!selectedTutor || !selectedAdmin || isCreating || tutorsLoading || smartTutors.length === 0}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve & Create Lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrialBookingApprovalDialogWithAdmin;