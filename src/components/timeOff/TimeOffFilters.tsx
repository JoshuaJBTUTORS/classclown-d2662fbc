import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FilterX } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Tutor Filter */}
          <div className="flex-1 min-w-0">
            <Label>Filter by Tutor</Label>
            <Select value={selectedTutors.length === 1 ? selectedTutors[0] : ''} onValueChange={(value) => {
              if (value === 'all') {
                onTutorChange([]);
              } else {
                handleTutorSelect(value);
              }
            }}>
              <SelectTrigger>
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

          {/* Status Filter */}
          <div className="flex-1 min-w-0">
            <Label>Filter by Status</Label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Filter */}
          <div className="flex-1 min-w-0">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
          <div className="flex-1 min-w-0">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
            variant="outline"
            onClick={onClearFilters}
            disabled={!hasActiveFilters || isLoading}
            className="whitespace-nowrap"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
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
      </CardContent>
    </Card>
  );
};