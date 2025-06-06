
import { useState } from 'react';

export const useTrialBookingManager = () => {
  const [isTrialBookingOpen, setIsTrialBookingOpen] = useState(false);

  const openTrialBooking = () => {
    setIsTrialBookingOpen(true);
  };

  const closeTrialBooking = () => {
    setIsTrialBookingOpen(false);
  };

  const handleTrialBookingSuccess = () => {
    console.log('Trial booking submitted successfully');
    closeTrialBooking();
  };

  return {
    isTrialBookingOpen,
    openTrialBooking,
    closeTrialBooking,
    handleTrialBookingSuccess,
  };
};
