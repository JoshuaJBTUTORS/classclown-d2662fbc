
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Users, GraduationCap, BookOpen, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tutor } from '@/types/tutor';
import { LESSON_SUBJECTS } from '@/constants/subjects';
import { useStudentData } from '@/hooks/useStudentData';

interface CalendarFiltersProps {
  selectedStudents: string[];
  selectedTutors: string[];
  selectedSubjects: string[];
  selectedAdminDemos: string[];
  selectedLessonType: string;
  onStudentFilterChange: (studentIds: string[]) => void;
  onTutorFilterChange: (tutorIds: string[]) => void;
  onSubjectFilterChange: (subjects: string[]) => void;
  onAdminDemoFilterChange: (adminIds: string[]) => void;
  onLessonTypeFilterChange: (lessonType: string) => void;
  onClearFilters: () => void;
}

const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  selectedStudents,
  selectedTutors,
  selectedSubjects,
  selectedAdminDemos,
  selectedLessonType,
  onStudentFilterChange,
  onTutorFilterChange,
  onSubjectFilterChange,
  onAdminDemoFilterChange,
  onLessonTypeFilterChange,
  onClearFilters
}) => {
  const { students, isLoading: studentsLoading } = useStudentData();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      // Fetch admins
      const { data: adminsData, error: adminsError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles!user_roles_user_id_fkey(first_name, last_name)
        `)
        .eq('role', 'admin');

      if (adminsError) {
        console.error('Error fetching admins:', adminsError);
        // Try alternative approach without foreign key
        const { data: alternativeAdminsData, error: altError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', 
            (await supabase.from('user_roles').select('user_id').eq('role', 'admin')).data?.map(r => r.user_id) || []
          );
        
        if (!altError && alternativeAdminsData) {
          const formattedAltAdmins = alternativeAdminsData.map(profile => ({
            user_id: profile.id,
            profiles: profile
          }));
          setAdmins(formattedAltAdmins);
        } else {
          setAdmins([]);
        }
      } else {
        setAdmins(adminsData || []);
      }

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

  const handleSubjectSelect = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      onSubjectFilterChange(selectedSubjects.filter(s => s !== subject));
    } else {
      onSubjectFilterChange([...selectedSubjects, subject]);
    }
  };

  const handleAdminDemoSelect = (adminId: string) => {
    if (selectedAdminDemos.includes(adminId)) {
      onAdminDemoFilterChange(selectedAdminDemos.filter(id => id !== adminId));
    } else {
      onAdminDemoFilterChange([...selectedAdminDemos, adminId]);
    }
  };

  const removeStudentFilter = (studentId: string) => {
    onStudentFilterChange(selectedStudents.filter(id => id !== studentId));
  };

  const removeTutorFilter = (tutorId: string) => {
    onTutorFilterChange(selectedTutors.filter(id => id !== tutorId));
  };

  const removeSubjectFilter = (subject: string) => {
    onSubjectFilterChange(selectedSubjects.filter(s => s !== subject));
  };

  const removeAdminDemoFilter = (adminId: string) => {
    onAdminDemoFilterChange(selectedAdminDemos.filter(id => id !== adminId));
  };

  const totalFiltersActive = selectedStudents.length + selectedTutors.length + selectedSubjects.length + selectedAdminDemos.length + (selectedLessonType !== 'All Lessons' ? 1 : 0);

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

        {/* Subject Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <label className="text-sm font-medium">Subjects</label>
          </div>
          <Select onValueChange={handleSubjectSelect}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select subjects..." />
            </SelectTrigger>
            <SelectContent>
              {LESSON_SUBJECTS.map((subject) => (
                <SelectItem
                  key={subject}
                  value={subject}
                  className={selectedSubjects.includes(subject) ? 'bg-accent' : ''}
                >
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Subjects */}
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
                    onClick={() => removeSubjectFilter(subject)}
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
            </SelectContent>
          </Select>
        </div>

        {/* Admin Demos Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <label className="text-sm font-medium">Admin Demos</label>
          </div>
          <Select onValueChange={handleAdminDemoSelect}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select admin demos..." />
            </SelectTrigger>
            <SelectContent>
              {admins.map((admin) => (
                <SelectItem
                  key={admin.user_id}
                  value={admin.user_id}
                  className={selectedAdminDemos.includes(admin.user_id) ? 'bg-accent' : ''}
                >
                  {admin.profiles.first_name} {admin.profiles.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Admin Demos */}
          {selectedAdminDemos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedAdminDemos.map((adminId) => {
                const admin = admins.find(a => a.user_id === adminId);
                if (!admin) return null;
                return (
                  <Badge
                    key={adminId}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {admin.profiles.first_name} {admin.profiles.last_name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeAdminDemoFilter(adminId)}
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
