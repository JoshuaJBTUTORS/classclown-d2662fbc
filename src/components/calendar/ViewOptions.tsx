
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
  // Determine if we're in teacher view context based on current view
  const isTeacherContext = currentView === 'teacherWeek' || currentView === 'teacherDay';
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-[var(--shadow-soft)]">
        {isTeacherContext ? (
          // Teacher view options only
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={currentView === 'teacherWeek'}
                  onPressedChange={() => onViewChange('teacherWeek')}
                  size="sm"
                  className="rounded-full px-4 h-10 data-[state=on]:bg-foreground data-[state=on]:text-background"
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
                  className="rounded-full px-4 h-10 data-[state=on]:bg-foreground data-[state=on]:text-background"
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
        ) : (
          // Standard calendar views
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={currentView === 'dayGridMonth'}
                  onPressedChange={() => onViewChange('dayGridMonth')}
                  size="sm"
                  className="rounded-full px-4 h-10 data-[state=on]:bg-foreground data-[state=on]:text-background"
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
                  className="rounded-full px-4 h-10 data-[state=on]:bg-foreground data-[state=on]:text-background"
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
                  className="rounded-full px-4 h-10 data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  <Clock className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Day view</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ViewOptions;
