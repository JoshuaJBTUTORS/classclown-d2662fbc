
import React from 'react';
import { Calendar, CalendarDays, Clock, Users } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ViewOptionsProps {
  currentView: string;
  onViewChange: (view: string) => void;
  showTeacherView?: boolean;
}

const ViewOptions: React.FC<ViewOptionsProps> = ({ currentView, onViewChange, showTeacherView = false }) => {
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 border rounded-md">
        {/* Standard calendar views */}
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

        {/* Teacher view options (only for admin/owner) */}
        {showTeacherView && (
          <>
            <Separator orientation="vertical" className="h-6" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={currentView === 'teacherWeek'}
                  onPressedChange={() => onViewChange('teacherWeek')}
                  size="sm"
                  className="data-[state=on]:bg-muted"
                >
                  <Users className="h-4 w-4 mr-1" />
                  <Calendar className="h-3 w-3" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Teacher week view</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={currentView === 'teacherDay'}
                  onPressedChange={() => onViewChange('teacherDay')}
                  size="sm"
                  className="data-[state=on]:bg-muted"
                >
                  <Users className="h-4 w-4 mr-1" />
                  <Clock className="h-3 w-3" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Teacher day view</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ViewOptions;
