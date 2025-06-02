
import { useState } from 'react';
import { performFullAvailabilityCheck, AvailabilityCheckRequest, AvailabilityCheckResult } from '@/services/availabilityCheckService';
import { toast } from 'sonner';

export const useAvailabilityCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<AvailabilityCheckResult | null>(null);

  const checkAvailability = async (request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult | null> => {
    setIsChecking(true);
    try {
      const result = await performFullAvailabilityCheck(request);
      setCheckResult(result);
      
      if (result.isAvailable) {
        toast.success('No conflicts found - time slot is available!');
      } else {
        toast.warning(`${result.conflicts.length} conflict${result.conflicts.length !== 1 ? 's' : ''} detected`);
      }
      
      return result;
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to check availability');
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const resetCheckResult = () => {
    setCheckResult(null);
  };

  return {
    checkAvailability,
    isChecking,
    checkResult,
    resetCheckResult
  };
};
