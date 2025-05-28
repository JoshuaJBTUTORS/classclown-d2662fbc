
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ReportFiltersProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedTutors: string[];
    selectedSubjects: string[];
  };
  onFiltersChange: (filters: any) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, onFiltersChange }) => {
  const [tutors, setTutors] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchTutors();
    fetchSubjects();
  }, []);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('subject')
        .not('subject', 'is', null);

      if (error) throw error;
      
      const uniqueSubjects = [...new Set(data?.map(item => item.subject).filter(Boolean))];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleTutorSelect = (tutorId: string) => {
    const updatedTutors = filters.selectedTutors.includes(tutorId)
      ? filters.selectedTutors.filter(id => id !== tutorId)
      : [...filters.selectedTutors, tutorId];
    
    onFiltersChange({ selectedTutors: updatedTutors });
  };

  const handleSubjectSelect = (subject: string) => {
    const updatedSubjects = filters.selectedSubjects.includes(subject)
      ? filters.selectedSubjects.filter(s => s !== subject)
      : [...filters.selectedSubjects, subject];
    
    onFiltersChange({ selectedSubjects: updatedSubjects });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { from: null, to: null },
      selectedTutors: [],
      selectedSubjects: []
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? format(filters.dateRange.from, "MMM d, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.from}
                    onSelect={(date) => onFiltersChange({ dateRange: { ...filters.dateRange, from: date } })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.to ? format(filters.dateRange.to, "MMM d, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.to}
                    onSelect={(date) => onFiltersChange({ dateRange: { ...filters.dateRange, to: date } })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tutors */}
          <div className="space-y-2">
            <Label>Tutors</Label>
            <Select onValueChange={handleTutorSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select tutors" />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {tutor.first_name} {tutor.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1">
              {filters.selectedTutors.map((tutorId) => {
                const tutor = tutors.find(t => t.id === tutorId);
                return tutor ? (
                  <Badge key={tutorId} variant="secondary" className="text-xs">
                    {tutor.first_name} {tutor.last_name}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => handleTutorSelect(tutorId)}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <Label>Subjects</Label>
            <Select onValueChange={handleSubjectSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select subjects" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1">
              {filters.selectedSubjects.map((subject) => (
                <Badge key={subject} variant="secondary" className="text-xs">
                  {subject}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleSubjectSelect(subject)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
