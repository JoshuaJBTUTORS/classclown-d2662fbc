
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openBookingModal = () => {
    navigate('/book-trial');
  };

  const closeBookingModal = () => {
    navigate(-1); // Go back to previous page
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
      
      // Navigate back to home or landing page after successful submission
      navigate('/');
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
    isSubmitting,
    openBookingModal,
    closeBookingModal,
    submitTrialBooking,
  };
};
