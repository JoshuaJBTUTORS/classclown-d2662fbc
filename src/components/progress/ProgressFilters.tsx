
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

interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

const ProgressFilters: React.FC<ProgressFiltersProps> = ({ filters, onFiltersChange, userRole }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userRole === 'owner') {
      fetchStudents();
      fetchSubjects();
    }
  }, [userRole]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('subject')
        .not('subject', 'is', null);

      if (error) throw error;
      
      const uniqueSubjects = [...new Set(data?.map(l => l.subject).filter(Boolean))];
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

  if (userRole === 'student') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Date Range Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                          to: range?.to || null 
                        } 
                      })
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Subject Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Subjects</label>
              <Select
                value={filters.selectedSubjects[0] || "all"}
                onValueChange={(value) => 
                  onFiltersChange({ 
                    selectedSubjects: value === "all" ? [] : [value] 
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {/* Date Range Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                        to: range?.to || null 
                      } 
                    })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Student Filter - Only for owners */}
          {userRole === 'owner' && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Students</label>
              <Select
                value={filters.selectedStudents[0] || "all"}
                onValueChange={(value) => 
                  onFiltersChange({ 
                    selectedStudents: value === "all" ? [] : [value] 
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Subjects</label>
            <Select
              value={filters.selectedSubjects[0] || "all"}
              onValueChange={(value) => 
                onFiltersChange({ 
                  selectedSubjects: value === "all" ? [] : [value] 
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressFilters;
