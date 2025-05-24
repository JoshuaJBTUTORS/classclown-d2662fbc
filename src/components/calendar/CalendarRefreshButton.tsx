
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CalendarRefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdateTime: Date | null;
  userRole: 'student' | 'tutor' | 'admin' | 'owner';
  className?: string;
}

const CalendarRefreshButton: React.FC<CalendarRefreshButtonProps> = ({
  onRefresh,
  isRefreshing,
  lastUpdateTime,
  userRole,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Calendar'}
      </Button>
      
      {lastUpdateTime && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Last updated: {format(lastUpdateTime, 'HH:mm:ss')}
          </span>
        </div>
      )}
      
      {userRole === 'student' && (
        <div className="text-xs text-muted-foreground">
          Calendar updates automatically
        </div>
      )}
    </div>
  );
};

export default CalendarRefreshButton;
