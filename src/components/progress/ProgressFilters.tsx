import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoodleCalendar } from './ProgressDoodles';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProgressFiltersProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
  };
  onFiltersChange: (filters: any) => void;
  userRole: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

const monthsAgo = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (months - 1), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const ProgressFilters: React.FC<ProgressFiltersProps> = ({ filters, onFiltersChange, userRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (userRole === 'owner') fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const { from, to } = filters.dateRange;

  const label = from
    ? to
      ? `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`
      : `${format(from, 'd MMM yyyy')} – now`
    : 'All time';

  const presets: { label: string; range: { from: Date | null; to: Date | null } }[] = [
    { label: 'Last 3 months', range: { from: monthsAgo(3), to: null } },
    { label: 'Last 6 months', range: { from: monthsAgo(6), to: null } },
    { label: 'Last 12 months', range: { from: monthsAgo(12), to: null } },
    { label: 'All time', range: { from: null, to: null } },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-11 justify-start gap-2.5 rounded-full border-foreground/15 bg-background px-5 text-sm font-semibold text-foreground shadow-sm hover:bg-background"
          >
            <DoodleCalendar className="h-[18px] w-[18px]" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden rounded-[1.5rem] border-foreground/10 p-0 shadow-lg"
          align="start"
        >
          <div className="flex items-center gap-2.5 border-b border-foreground/10 bg-pastel-sky px-5 py-3.5 text-pastel-sky-foreground">
            <DoodleCalendar className="h-[18px] w-[18px]" />
            <span className="font-heading text-sm font-semibold">Pick a date range</span>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={from || undefined}
            selected={{ from: from || undefined, to: to || undefined }}
            onSelect={(range) =>
              onFiltersChange({
                dateRange: { from: range?.from || null, to: range?.to || null },
              })
            }
            numberOfMonths={2}
            className={cn('p-3 pointer-events-auto')}
          />
          <div className="flex flex-wrap gap-2 border-t border-foreground/10 bg-muted/40 p-3">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onFiltersChange({ dateRange: preset.range });
                  setOpen(false);
                }}
                className="rounded-full border border-foreground/10 bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {userRole === 'owner' && (
        <Select
          value={filters.selectedStudents[0] || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ selectedStudents: value === 'all' ? [] : [value] })
          }
        >
          <SelectTrigger className="h-11 w-full rounded-full border-foreground/15 bg-background px-5 text-sm font-semibold shadow-sm sm:w-[220px]">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent className="rounded-[1.25rem]">
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.first_name} {u.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(from || to || filters.selectedStudents.length > 0) && (
        <Button
          variant="ghost"
          onClick={() =>
            onFiltersChange({ dateRange: { from: null, to: null }, selectedStudents: [] })
          }
          className="h-11 rounded-full px-4 text-sm font-semibold text-pastel-sky-foreground hover:bg-background/60"
        >
          Clear
        </Button>
      )}
    </div>
  );
};

export default ProgressFilters;
