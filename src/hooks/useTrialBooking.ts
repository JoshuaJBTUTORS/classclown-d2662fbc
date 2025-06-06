
import { useState } from 'react';
import { toast } from 'sonner';

interface TrialBookingData {
  parentName: string;
  childName: string;
  email: string;
  phone?: string;
  subject: string;
  preferredTime: string;
  message?: string;
}

export const useTrialBooking = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const submitTrialBooking = async (data: TrialBookingData) => {
    setIsSubmitting(true);
    try {
      // This is now handled by the TrialBookingForm component
      console.log('Trial booking data:', data);
      
      toast.success("Trial Lesson Request Submitted! We'll contact you within 24 hours to schedule your free trial lesson.");
      
      closeBookingModal();
    } catch (error) {
      toast.error("Failed to submit trial lesson request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isBookingModalOpen,
    isSubmitting,
    openBookingModal,
    closeBookingModal,
    submitTrialBooking,
  };
};
