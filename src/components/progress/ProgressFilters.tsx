
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProgressFiltersProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
  };
  onFiltersChange: (filters: any) => void;
  userRole: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

const ProgressFilters: React.FC<ProgressFiltersProps> = ({ filters, onFiltersChange, userRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (userRole === 'owner') {
      fetchUsers();
    }
    fetchSubjects();
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

  const fetchSubjects = async () => {
    try {
      // Get subjects from lessons
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('subject')
        .not('subject', 'is', null);

      if (lessonError) throw lessonError;

      // Get subjects from assessments
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('ai_assessments')
        .select('subject')
        .not('subject', 'is', null);

      if (assessmentError) throw assessmentError;
      
      const lessonSubjects = lessonData?.map(l => l.subject).filter(Boolean) || [];
      const assessmentSubjects = assessmentData?.map(a => a.subject).filter(Boolean) || [];
      const uniqueSubjects = [...new Set([...lessonSubjects, ...assessmentSubjects])];
      
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { from: null, to: null },
      selectedStudents: [],
      selectedSubjects: []
    });
  };

  const hasActiveFilters = 
    filters.dateRange.from || 
    filters.dateRange.to || 
    filters.selectedStudents.length > 0 || 
    filters.selectedSubjects.length > 0;

  const pillClass =
    'h-10 rounded-full border-0 bg-background/70 px-4 text-sm font-medium text-foreground shadow-sm hover:bg-background';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(pillClass, 'justify-start gap-2 font-normal', !filters.dateRange.from && 'text-muted-foreground')}
          >
            <CalendarIcon className="h-4 w-4" />
            {filters.dateRange.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, 'LLL dd, y')} – {format(filters.dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(filters.dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Any dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-[1.25rem] p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange.from || undefined}
            selected={{
              from: filters.dateRange.from || undefined,
              to: filters.dateRange.to || undefined,
            }}
            onSelect={(range) =>
              onFiltersChange({
                dateRange: {
                  from: range?.from || null,
                  to: range?.to || null,
                },
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

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

      {/* Subject Filter */}
      <Select
        value={filters.selectedSubjects[0] || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ selectedSubjects: value === 'all' ? [] : [value] })
        }
      >
        <SelectTrigger className={cn(pillClass, 'w-[200px]')}>
          <SelectValue placeholder="All subjects" />
        </SelectTrigger>
        <SelectContent className="rounded-[1.25rem]">
          <SelectItem value="all">All subjects</SelectItem>
          {subjects.map((subject) => (
            <SelectItem key={subject} value={subject}>
              {subject}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="h-10 gap-1.5 rounded-full px-4 text-sm text-pastel-sky-foreground hover:bg-background/60"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default ProgressFilters;

