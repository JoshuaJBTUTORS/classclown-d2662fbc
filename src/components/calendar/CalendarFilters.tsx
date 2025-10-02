
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Users, GraduationCap, BookOpen, ChevronsUpDown, Check, UserCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Tutor } from '@/types/tutor';
import { Parent } from '@/types/parent';
import { LESSON_SUBJECTS } from '@/constants/subjects';
import { useStudentData } from '@/hooks/useStudentData';
import { cn } from '@/lib/utils';

interface CalendarFiltersProps {
  selectedStudents: string[];
  selectedTutors: string[];
  selectedParents: string[];
  selectedSubjects: string[];
  selectedLessonType: string;
  onStudentFilterChange: (studentIds: string[]) => void;
  onTutorFilterChange: (tutorIds: string[]) => void;
  onParentFilterChange: (parentIds: string[]) => void;
  onSubjectFilterChange: (subjects: string[]) => void;
  onLessonTypeFilterChange: (lessonType: string) => void;
  onClearFilters: () => void;
}

const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  selectedStudents,
  selectedTutors,
  selectedParents,
  selectedSubjects,
  selectedLessonType,
  onStudentFilterChange,
  onTutorFilterChange,
  onParentFilterChange,
  onSubjectFilterChange,
  onLessonTypeFilterChange,
  onClearFilters
}) => {
  const { students, isLoading: studentsLoading } = useStudentData();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [tutorSearchOpen, setTutorSearchOpen] = useState(false);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);
  const [subjectSearchOpen, setSubjectSearchOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tutors with status field included
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('id, first_name, last_name, email, status')
        .eq('status', 'active')
        .order('first_name');

      if (tutorsError) throw tutorsError;

      // Fetch parents
      const { data: parentsData, error: parentsError } = await supabase
        .from('parents')
        .select('id, first_name, last_name, email, user_id')
        .order('first_name');

      if (parentsError) throw parentsError;

      setTutors(tutorsData || []);
      setParents(parentsData || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onStudentFilterChange(selectedStudents.filter(id => id !== studentId));
    } else {
      onStudentFilterChange([...selectedStudents, studentId]);
    }
  };

  const handleTutorToggle = (tutorId: string) => {
    if (selectedTutors.includes(tutorId)) {
      onTutorFilterChange(selectedTutors.filter(id => id !== tutorId));
    } else {
      onTutorFilterChange([...selectedTutors, tutorId]);
    }
  };

  const handleParentToggle = (parentId: string) => {
    if (selectedParents.includes(parentId)) {
      onParentFilterChange(selectedParents.filter(id => id !== parentId));
    } else {
      onParentFilterChange([...selectedParents, parentId]);
    }
  };

  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      onSubjectFilterChange(selectedSubjects.filter(s => s !== subject));
    } else {
      onSubjectFilterChange([...selectedSubjects, subject]);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const search = studentSearch.toLowerCase();
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search)
    );
  }, [students, studentSearch]);

  const filteredTutors = useMemo(() => {
    if (!tutorSearch) return tutors;
    const search = tutorSearch.toLowerCase();
    return tutors.filter(t => 
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(search) ||
      t.email?.toLowerCase().includes(search)
    );
  }, [tutors, tutorSearch]);

  const filteredParents = useMemo(() => {
    if (!parentSearch) return parents;
    const search = parentSearch.toLowerCase();
    return parents.filter(p => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search)
    );
  }, [parents, parentSearch]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch) return LESSON_SUBJECTS;
    const search = subjectSearch.toLowerCase();
    return LESSON_SUBJECTS.filter(s => s.toLowerCase().includes(search));
  }, [subjectSearch]);

  const totalFiltersActive = selectedStudents.length + selectedTutors.length + selectedParents.length + selectedSubjects.length + (selectedLessonType !== 'All Lessons' ? 1 : 0);

  if (isLoading || studentsLoading) {
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

      <div className="space-y-4">
        {/* Student Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <label className="text-sm font-medium">Students</label>
          </div>
          <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9">
                <span className="text-sm">
                  {selectedStudents.length > 0 
                    ? `${selectedStudents.length} selected` 
                    : 'Search students...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search students..." 
                  value={studentSearch}
                  onValueChange={setStudentSearch}
                />
                <CommandList>
                  <CommandEmpty>No students found.</CommandEmpty>
                  <CommandGroup>
                    {filteredStudents.map((student) => (
                      <CommandItem
                        key={student.id}
                        onSelect={() => handleStudentToggle(student.id.toString())}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedStudents.includes(student.id.toString()) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{student.first_name} {student.last_name}</span>
                          {student.email && (
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
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
                      onClick={() => onStudentFilterChange(selectedStudents.filter(id => id !== studentId))}
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
          <Popover open={tutorSearchOpen} onOpenChange={setTutorSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9">
                <span className="text-sm">
                  {selectedTutors.length > 0 
                    ? `${selectedTutors.length} selected` 
                    : 'Search tutors...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search tutors..." 
                  value={tutorSearch}
                  onValueChange={setTutorSearch}
                />
                <CommandList>
                  <CommandEmpty>No tutors found.</CommandEmpty>
                  <CommandGroup>
                    {filteredTutors.map((tutor) => (
                      <CommandItem
                        key={tutor.id}
                        onSelect={() => handleTutorToggle(tutor.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTutors.includes(tutor.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{tutor.first_name} {tutor.last_name}</span>
                          {tutor.email && (
                            <span className="text-xs text-muted-foreground">{tutor.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
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
                      onClick={() => onTutorFilterChange(selectedTutors.filter(id => id !== tutorId))}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Parent Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <label className="text-sm font-medium">Parents</label>
          </div>
          <Popover open={parentSearchOpen} onOpenChange={setParentSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9">
                <span className="text-sm">
                  {selectedParents.length > 0 
                    ? `${selectedParents.length} selected` 
                    : 'Search parents...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search parents..." 
                  value={parentSearch}
                  onValueChange={setParentSearch}
                />
                <CommandList>
                  <CommandEmpty>No parents found.</CommandEmpty>
                  <CommandGroup>
                    {filteredParents.map((parent) => (
                      <CommandItem
                        key={parent.id}
                        onSelect={() => handleParentToggle(parent.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedParents.includes(parent.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{parent.first_name} {parent.last_name}</span>
                          {parent.email && (
                            <span className="text-xs text-muted-foreground">{parent.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedParents.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedParents.map((parentId) => {
                const parent = parents.find(p => p.id === parentId);
                if (!parent) return null;
                return (
                  <Badge
                    key={parentId}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {parent.first_name} {parent.last_name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onParentFilterChange(selectedParents.filter(id => id !== parentId))}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <label className="text-sm font-medium">Subjects</label>
          </div>
          <Popover open={subjectSearchOpen} onOpenChange={setSubjectSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9">
                <span className="text-sm">
                  {selectedSubjects.length > 0 
                    ? `${selectedSubjects.length} selected` 
                    : 'Search subjects...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search subjects..." 
                  value={subjectSearch}
                  onValueChange={setSubjectSearch}
                />
                <CommandList>
                  <CommandEmpty>No subjects found.</CommandEmpty>
                  <CommandGroup>
                    {filteredSubjects.map((subject) => (
                      <CommandItem
                        key={subject}
                        onSelect={() => handleSubjectToggle(subject)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSubjects.includes(subject) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {subject}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedSubjects.map((subject) => (
                <Badge
                  key={subject}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  {subject}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onSubjectFilterChange(selectedSubjects.filter(s => s !== subject))}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Lesson Type Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <label className="text-sm font-medium">Lesson Type</label>
          </div>
          <Select value={selectedLessonType} onValueChange={onLessonTypeFilterChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select lesson type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Lessons">All Lessons</SelectItem>
              <SelectItem value="Full Lessons">Full Lessons</SelectItem>
              <SelectItem value="Trial Lessons">Trial Lessons</SelectItem>
              <SelectItem value="Demo Lessons">Demo Lessons</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CalendarFilters;
