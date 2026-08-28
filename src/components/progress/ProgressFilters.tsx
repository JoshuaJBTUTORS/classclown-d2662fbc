import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

type RangeMode = '6' | '12' | 'all' | 'year';

const startOfMonthsAgo = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (months - 1), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const ProgressFilters: React.FC<ProgressFiltersProps> = ({ filters, onFiltersChange, userRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<RangeMode>('12');
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (userRole === 'owner') fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  // Keep the shared dateRange in sync with the month selection
  useEffect(() => {
    if (mode === 'all') {
      onFiltersChange({ dateRange: { from: null, to: null } });
      return;
    }
    if (mode === 'year') {
      onFiltersChange({
        dateRange: {
          from: new Date(year, 0, 1, 0, 0, 0, 0),
          to: new Date(year, 11, 31, 23, 59, 59, 999),
        },
      });
      return;
    }
    onFiltersChange({ dateRange: { from: startOfMonthsAgo(Number(mode)), to: null } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, year]);

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

  const pillClass =
    'h-10 rounded-full border-0 bg-background/70 px-4 text-sm font-medium text-foreground shadow-sm hover:bg-background';

  const rangeOptions: { value: RangeMode; label: string }[] = [
    { value: '6', label: 'Last 6 months' },
    { value: '12', label: 'Last 12 months' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Month range */}
      <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-1">
        {rangeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            className={cn(
              'h-8 rounded-full px-4 text-sm font-medium transition-colors',
              mode === option.value
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Year stepper */}
      <div
        className={cn(
          'flex items-center gap-1 rounded-full border border-foreground/15 bg-background/70 px-1.5 py-1',
          mode === 'year' && 'border-foreground bg-foreground text-background',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-foreground/10"
          onClick={() => {
            setYear((y) => y - 1);
            setMode('year');
          }}
          aria-label="Previous year"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={() => setMode('year')}
          className="min-w-[3.5rem] text-sm font-semibold"
        >
          {year}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-foreground/10"
          onClick={() => {
            setYear((y) => y + 1);
            setMode('year');
          }}
          aria-label="Next year"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* User Filter - Only for owners */}
      {userRole === 'owner' && (
        <Select
          value={filters.selectedStudents[0] || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ selectedStudents: value === 'all' ? [] : [value] })
          }
        >
          <SelectTrigger className={cn(pillClass, 'w-[200px]')}>
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

      {(mode !== '12' || filters.selectedStudents.length > 0) && (
        <Button
          variant="ghost"
          onClick={() => {
            setMode('12');
            setYear(new Date().getFullYear());
            onFiltersChange({ selectedStudents: [] });
          }}
          className="h-10 rounded-full px-4 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground"
        >
          Clear
        </Button>
      )}
    </div>
  );
};

export default ProgressFilters;
