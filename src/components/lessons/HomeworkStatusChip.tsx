import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { HeyCleoHomeworkStatus } from '@/hooks/useHeyCleoHomeworkStatus';

interface Props {
  status?: HeyCleoHomeworkStatus;
}

const config = {
  completed: {
    label: 'HW done',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    Icon: CheckCircle,
  },
  started: {
    label: 'HW started',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
    Icon: Clock,
  },
  not_started: {
    label: 'HW not started',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
    Icon: XCircle,
  },
  no_data: {
    label: 'No HW data',
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted',
    Icon: BookOpen,
  },
} as const;

const HomeworkStatusChip: React.FC<Props> = ({ status }) => {
  const state = status?.state ?? 'no_data';
  const { label, className, Icon } = config[state];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs cursor-default ${className}`}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px]">
          {state === 'no_data' ? (
            <p className="text-xs">No HeyCleo homework found for last week.</p>
          ) : (
            <div className="text-xs space-y-1">
              <p className="font-medium">{status?.title || 'Homework'}</p>
              {status?.dueDate && <p>Due {format(parseISO(status.dueDate), 'MMM d, yyyy')}</p>}
              {status?.marksAvailable != null && status.marksAvailable > 0 && (
                <p>
                  Score: {status.marksAwarded ?? 0}/{status.marksAvailable}
                  {status.percentage != null ? ` (${Math.round(status.percentage)}%)` : ''}
                </p>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HomeworkStatusChip;
