
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

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
      // Here you would typically send the data to your backend/CRM
      // For now, we'll just show a success message
      console.log('Trial booking data:', data);
      
      toast({
        title: "Trial Lesson Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your free trial lesson.",
      });
      
      closeBookingModal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit trial lesson request. Please try again.",
        variant: "destructive",
      });
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
