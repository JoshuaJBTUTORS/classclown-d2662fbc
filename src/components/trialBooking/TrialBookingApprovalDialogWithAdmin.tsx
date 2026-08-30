import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createTrialLesson } from '@/services/trialLessonService';
import { useSubjects } from '@/hooks/useSubjects';
import { useSmartAvailableTutors } from '@/hooks/useSmartAvailableTutors';
import { Loader2 } from 'lucide-react';
import {
  DoodleAlert,
  DoodleCalendar,
  DoodleCheck,
  DoodleClock,
} from '@/components/calendar/LessonDoodles';
import { cn } from '@/lib/utils';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleX: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M6.2 6.4c3.8 3.8 7.7 7.5 11.6 11.2M17.8 6.2c-3.8 3.9-7.6 7.7-11.4 11.5" />
  </svg>
);

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
        return <DoodleCheck className="h-4 w-4 text-pastel-mint-foreground" />;
      case 'busy':
        return <DoodleX className="h-4 w-4 text-pastel-blush-foreground" />;
      case 'time_off':
        return <DoodleAlert className="h-4 w-4 text-pastel-butter-foreground" />;
      case 'no_availability':
        return <DoodleClock className="h-4 w-4 text-pastel-sand-foreground" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      default:
        return <DoodleClock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAvailabilityBadge = (status: string) => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold';
    switch (status) {
      case 'available':
        return <span className={cn(base, 'bg-pastel-mint text-pastel-mint-foreground')}>Available</span>;
      case 'busy':
        return <span className={cn(base, 'bg-pastel-blush text-pastel-blush-foreground')}>Busy</span>;
      case 'time_off':
        return <span className={cn(base, 'bg-pastel-butter text-pastel-butter-foreground')}>Time Off</span>;
      case 'no_availability':
        return <span className={cn(base, 'bg-pastel-sand text-pastel-sand-foreground')}>No Availability</span>;
      case 'checking':
        return <span className={cn(base, 'bg-muted text-muted-foreground')}>Checking...</span>;
      default:
        return <span className={cn(base, 'bg-muted text-muted-foreground')}>Unknown</span>;
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
      <DialogContent className="cc-dialog max-h-[92dvh] overflow-y-auto rounded-[var(--radius-soft)] border-2 border-foreground/10 p-6 sm:max-w-[560px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/10 bg-pastel-mint text-pastel-mint-foreground">
            <DoodleCheck className="h-8 w-8" />
          </span>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
              Approve Trial Booking
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="mt-5 space-y-5">
          <div className="rounded-[1.25rem] bg-pastel-sand/50 p-4">
            <h3 className="font-heading text-lg font-extrabold tracking-tight text-foreground">Booking Details</h3>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</p>
                <p className="mt-1 font-semibold text-foreground">{booking.child_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent</p>
                <p className="mt-1 font-semibold text-foreground">{booking.parent_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p>
                <p className="mt-1 text-foreground">{subjectName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 break-all text-foreground">{booking.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <DoodleCalendar className="h-4 w-4 shrink-0" />
                  {new Date(booking.preferred_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</p>
                <p className="mt-1 flex items-center gap-2 text-foreground">
                  <DoodleClock className="h-4 w-4 shrink-0" />
                  {booking.preferred_time}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tutor-select" className="text-sm font-semibold text-foreground">
                Select Tutor
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (Filtered by subject and availability)
                </span>
              </Label>
              
              {tutorsError && (
                <div className="rounded-[1rem] bg-pastel-blush/70 p-3 text-sm text-pastel-blush-foreground">
                  {tutorsError}
                </div>
              )}
              
              {tutorsLoading ? (
                <div className="flex items-center justify-center rounded-[1rem] bg-pastel-sand/60 p-4 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking tutor availability...
                </div>
              ) : smartTutors.length === 0 ? (
                <div className="rounded-[1rem] bg-pastel-sand/60 p-4 text-sm text-muted-foreground">
                  No tutors available for {subjectName} at {booking.preferred_time} on{' '}
                  {new Date(booking.preferred_date).toLocaleDateString()}
                </div>
              ) : (
                <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                  <SelectTrigger className="h-12 rounded-full border-2 border-foreground bg-transparent px-5 shadow-none focus:ring-0">
                    <SelectValue placeholder="Choose a tutor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {smartTutors.map((tutor) => (
                      <SelectItem 
                        key={tutor.id} 
                        value={tutor.id}
                        disabled={tutor.availability_status !== 'available'}
                      >
                        <div className="flex w-full items-center justify-between gap-3">
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
                <div className="rounded-[1rem] bg-pastel-mint/60 p-3">
                  {(() => {
                    const tutor = smartTutors.find(t => t.id === selectedTutor);
                    if (!tutor) return null;
                    
                    if (tutor.availability_status === 'available') {
                      return (
                        <div className="flex items-center text-sm font-medium text-pastel-mint-foreground">
                          <DoodleCheck className="mr-2 h-4 w-4" />
                          This tutor is available for the requested time
                        </div>
                      );
                    } else if (tutor.conflicts && tutor.conflicts.length > 0) {
                      return (
                        <div className="rounded-[1rem] bg-pastel-blush/70 p-3 text-sm text-pastel-blush-foreground">
                          <p className="mb-1 font-semibold">Conflicts:</p>
                          <ul className="space-y-1">
                            {tutor.conflicts.map((conflict, idx) => (
                              <li key={idx}>• {conflict}</li>
                            ))}
                          </ul>
                          {tutor.next_available_slot && (
                            <p className="mt-2 text-pastel-sky-foreground">
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
              <Label htmlFor="admin-select" className="text-sm font-semibold text-foreground">Select Admin for Demo Session</Label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger className="h-12 rounded-full border-2 border-foreground bg-transparent px-5 shadow-none focus:ring-0">
                  <SelectValue placeholder="Choose an admin" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.first_name} {admin.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-[1.25rem] bg-pastel-sky/60 p-4">
            <h4 className="font-heading font-extrabold tracking-tight text-pastel-sky-foreground">Demo Session Info</h4>
            <p className="mt-2 text-sm text-pastel-sky-foreground">
              A 15-minute demo session will be created before the main lesson. 
              The admin will join first to introduce the platform, then the tutor will join for the actual lesson.
            </p>
            <p className="mt-2 text-xs text-pastel-sky-foreground/80">
              All times shown in UK timezone ({booking.preferred_time} on {new Date(booking.preferred_date).toLocaleDateString()})
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-full border-2 border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={!selectedTutor || !selectedAdmin || isCreating || tutorsLoading || smartTutors.length === 0}
            className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
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