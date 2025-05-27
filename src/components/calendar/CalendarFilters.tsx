import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Users, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';
import { Tutor } from '@/types/tutor';

interface CalendarFiltersProps {
  selectedStudents: string[];
  selectedTutors: string[];
  onStudentFilterChange: (studentIds: string[]) => void;
  onTutorFilterChange: (tutorIds: string[]) => void;
  onClearFilters: () => void;
}

const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  selectedStudents,
  selectedTutors,
  onStudentFilterChange,
  onTutorFilterChange,
  onClearFilters
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch students with status field included
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, email, status')
        .eq('status', 'active')
        .order('first_name');

      if (studentsError) throw studentsError;

      // Fetch tutors with status field included
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('id, first_name, last_name, email, status')
        .eq('status', 'active')
        .order('first_name');

      if (tutorsError) throw tutorsError;

      setStudents(studentsData || []);
      setTutors(tutorsData || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onStudentFilterChange(selectedStudents.filter(id => id !== studentId));
    } else {
      onStudentFilterChange([...selectedStudents, studentId]);
    }
  };

  const handleTutorSelect = (tutorId: string) => {
    if (selectedTutors.includes(tutorId)) {
      onTutorFilterChange(selectedTutors.filter(id => id !== tutorId));
    } else {
      onTutorFilterChange([...selectedTutors, tutorId]);
    }
  };

  const removeStudentFilter = (studentId: string) => {
    onStudentFilterChange(selectedStudents.filter(id => id !== studentId));
  };

  const removeTutorFilter = (tutorId: string) => {
    onTutorFilterChange(selectedTutors.filter(id => id !== tutorId));
  };

  const totalFiltersActive = selectedStudents.length + selectedTutors.length;

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">Loading filters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter Calendar</span>
          {totalFiltersActive > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalFiltersActive} active
            </Badge>
          )}
        </div>
        {totalFiltersActive > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <label className="text-sm font-medium">Students</label>
          </div>
          <Select onValueChange={handleStudentSelect}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select students..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem
                  key={student.id}
                  value={student.id.toString()}
                  className={selectedStudents.includes(student.id.toString()) ? 'bg-accent' : ''}
                >
                  {student.first_name} {student.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Students */}
          {selectedStudents.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedStudents.map((studentId) => {
                const student = students.find(s => s.id.toString() === studentId);
                if (!student) return null;
                return (
                  <Badge
                    key={studentId}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {student.first_name} {student.last_name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeStudentFilter(studentId)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Tutor Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <label className="text-sm font-medium">Tutors</label>
          </div>
          <Select onValueChange={handleTutorSelect}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select tutors..." />
            </SelectTrigger>
            <SelectContent>
              {tutors.map((tutor) => (
                <SelectItem
                  key={tutor.id}
                  value={tutor.id}
                  className={selectedTutors.includes(tutor.id) ? 'bg-accent' : ''}
                >
                  {tutor.first_name} {tutor.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Tutors */}
          {selectedTutors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTutors.map((tutorId) => {
                const tutor = tutors.find(t => t.id === tutorId);
                if (!tutor) return null;
                return (
                  <Badge
                    key={tutorId}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {tutor.first_name} {tutor.last_name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTutorFilter(tutorId)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarFilters;
