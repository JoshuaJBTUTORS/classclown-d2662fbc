
import React from 'react';
import { Calendar, CalendarDays, Clock } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ViewOptionsProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const ViewOptions: React.FC<ViewOptionsProps> = ({ currentView, onViewChange }) => {
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 border rounded-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={currentView === 'dayGridMonth'}
              onPressedChange={() => onViewChange('dayGridMonth')}
              size="sm"
              className="data-[state=on]:bg-muted"
            >
              <CalendarDays className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Month view</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={currentView === 'timeGridWeek'}
              onPressedChange={() => onViewChange('timeGridWeek')}
              size="sm"
              className="data-[state=on]:bg-muted"
            >
              <Calendar className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Week view</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={currentView === 'timeGridDay'}
              onPressedChange={() => onViewChange('timeGridDay')}
              size="sm"
              className="data-[state=on]:bg-muted"
            >
              <Clock className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Day view</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ViewOptions;
