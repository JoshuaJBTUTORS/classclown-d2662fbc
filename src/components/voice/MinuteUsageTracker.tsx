import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface MinuteUsageTrackerProps {
  sessionStartTime: Date;
}

export const MinuteUsageTracker = ({ sessionStartTime }: MinuteUsageTrackerProps) => {
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [secondsInCurrentMinute, setSecondsInCurrentMinute] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = sessionStartTime.getTime();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      
      setMinutesUsed(minutes);
      setSecondsInCurrentMinute(seconds);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionStartTime]);
  
  return (
    <div className="flex items-center gap-2 text-sm text-mint-700 bg-mint-50 px-3 py-2 rounded-full border border-mint-200">
      <Clock className="h-4 w-4" />
      <span className="font-medium">
        {minutesUsed}:{secondsInCurrentMinute.toString().padStart(2, '0')}
      </span>
      <span className="text-mint-600">
        {minutesUsed === 1 ? 'minute' : 'minutes'} used
      </span>
    </div>
  );
};