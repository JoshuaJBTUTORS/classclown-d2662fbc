import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DoodleCalendar } from '@/components/calendar/LessonDoodles';
import { cn } from '@/lib/utils';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleFilterClear: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M4.5 6.5c5-.8 10-.9 15-.3l-5.3 6.1c-.1 2.4-.2 4.7-.3 7.1-1.3.6-2.5 1.1-3.8 1.6-.2-2.9-.3-5.9-.5-8.8z" />
    <path d="M17.5 16.8l3 3M20.5 16.8l-3 3" />
  </svg>
);

interface TimeOffFiltersProps {
  selectedTutors: string[];
  onTutorChange: (tutors: string[]) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
  tutors: Array<{ id: string; first_name: string; last_name: string }>;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
];

const statusChipTone = (value: string, active: boolean) => {
  if (!active) return 'border-2 border-foreground/60 bg-transparent text-foreground hover:bg-foreground/5';
  switch (value) {
    case 'pending':
      return 'border-2 border-transparent bg-pastel-butter text-pastel-butter-foreground';
    case 'approved':
      return 'border-2 border-transparent bg-pastel-mint text-pastel-mint-foreground';
    case 'denied':
      return 'border-2 border-transparent bg-pastel-blush text-pastel-blush-foreground';
    default:
      return 'border-2 border-transparent bg-foreground text-background';
  }
};

export const TimeOffFilters: React.FC<TimeOffFiltersProps> = ({
  selectedTutors,
  onTutorChange,
  statusFilter,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  tutors,
  isLoading = false
}) => {
  const handleTutorSelect = (tutorId: string) => {
    if (selectedTutors.includes(tutorId)) {
      onTutorChange(selectedTutors.filter(id => id !== tutorId));
    } else {
      onTutorChange([...selectedTutors, tutorId]);
    }
  };

  const getSelectedTutorNames = () => {
    if (selectedTutors.length === 0) return 'All tutors';
    if (selectedTutors.length === 1) {
      const tutor = tutors.find(t => t.id === selectedTutors[0]);
      return tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Unknown tutor';
    }
    return `${selectedTutors.length} tutors selected`;
  };

  const hasActiveFilters = selectedTutors.length > 0 || statusFilter !== 'all' || startDate || endDate;

  return (
    <div className="rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        {/* Tutor Filter */}
        <div className="min-w-0 flex-1">
          <Label className="mb-1.5 block text-sm font-medium text-foreground">Filter by Tutor</Label>
          <Select value={selectedTutors.length === 1 ? selectedTutors[0] : ''} onValueChange={(value) => {
            if (value === 'all') {
              onTutorChange([]);
            } else {
              handleTutorSelect(value);
            }
          }}>
            <SelectTrigger className="h-12 rounded-full border-2 border-foreground bg-transparent px-5 shadow-none focus:ring-0">
              <SelectValue placeholder={getSelectedTutorNames()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tutors</SelectItem>
              {tutors.map((tutor) => (
                <SelectItem key={tutor.id} value={tutor.id}>
                  {tutor.first_name} {tutor.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="min-w-0 flex-1">
          <Label className="mb-1.5 block text-sm font-medium text-foreground">From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 w-full justify-start rounded-full border-2 border-foreground bg-transparent px-5 text-left font-normal text-foreground shadow-none hover:bg-foreground/5",
                  !startDate && "text-muted-foreground"
                )}
              >
                <DoodleCalendar className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Filter */}
        <div className="min-w-0 flex-1">
          <Label className="mb-1.5 block text-sm font-medium text-foreground">To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 w-full justify-start rounded-full border-2 border-foreground bg-transparent px-5 text-left font-normal text-foreground shadow-none hover:bg-foreground/5",
                  !endDate && "text-muted-foreground"
                )}
              >
                <DoodleCalendar className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear Filters Button */}
        <Button
          onClick={onClearFilters}
          disabled={!hasActiveFilters || isLoading}
          className="h-12 whitespace-nowrap rounded-full bg-foreground px-6 text-background hover:bg-foreground/90 disabled:opacity-40"
        >
          <DoodleFilterClear className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>

      {/* Status chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Status:</span>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusChange(option.value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200',
              statusChipTone(option.value, statusFilter === option.value)
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 text-sm text-muted-foreground">
          Active filters: {[
            selectedTutors.length > 0 && `${selectedTutors.length} tutor(s)`,
            statusFilter !== 'all' && `Status: ${statusFilter}`,
            startDate && `From: ${format(startDate, 'PPP')}`,
            endDate && `To: ${format(endDate, 'PPP')}`
          ].filter(Boolean).join(' • ')}
        </div>
      )}
    </div>
  );
};
