import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { Calendar as CalendarIcon } from 'lucide-react';

// ... keep existing code (other imports and components)

const Calendar = () => {
  const { isLearningHubOnly } = useAuth();
  const { openBookingModal } = useTrialBooking();

  // If user has learning_hub_only role, show locked feature
  if (isLearningHubOnly) {
    return (
      <LockedFeature
        featureName="Calendar & Scheduling"
        featureIcon={<CalendarIcon className="h-16 w-16 text-gray-300" />}
        description="Access your lesson calendar, book sessions, and manage your tutoring schedule."
        onBookTrial={openBookingModal}
      />
    );
  }

  // ... keep existing code (rest of the Calendar component)
  return (
    <div>
      {/* Existing calendar functionality for other user types */}
      <p>Calendar functionality for authenticated users</p>
    </div>
  );
};

export default Calendar;
