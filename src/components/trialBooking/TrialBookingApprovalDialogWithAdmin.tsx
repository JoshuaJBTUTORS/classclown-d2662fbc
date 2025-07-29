import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createTrialLesson } from '@/services/trialLessonService';
import { useSubjects } from '@/hooks/useSubjects';
import { Loader2 } from 'lucide-react';

interface TrialBookingApprovalDialogWithAdminProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onApprovalComplete: () => void;
  tutors: any[];
  admins: any[];
}

const TrialBookingApprovalDialogWithAdmin: React.FC<TrialBookingApprovalDialogWithAdminProps> = ({
  isOpen,
  onClose,
  booking,
  onApprovalComplete,
  tutors,
  admins
}) => {
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { subjects } = useSubjects();

  // Get subject name from subject_id
  const subjectName = subjects.find(s => s.id === booking.subject_id)?.name || 'Unknown Subject';

  const handleApprove = async () => {
    if (!selectedTutor || !selectedAdmin) {
      toast({
        title: "Error",
        description: "Please select both a tutor and an admin",
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

  if (!booking) return null;

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
              <Label htmlFor="tutor-select">Select Tutor</Label>
              <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.first_name} {tutor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={!selectedTutor || !selectedAdmin || isCreating}
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