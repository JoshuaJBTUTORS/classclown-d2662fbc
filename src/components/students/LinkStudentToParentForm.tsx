import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Student } from '@/types/student';
import { Parent } from '@/types/parent';
import { Badge } from '@/components/ui/badge';
import { X, User, Users } from 'lucide-react';

interface LinkStudentToParentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  parentId: z.string().min(1, "Please select a parent"),
});

type FormData = z.infer<typeof formSchema>;

const LinkStudentToParentForm: React.FC<LinkStudentToParentFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [standaloneStudents, setStandaloneStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [studentSearch, setStudentSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showParentDropdown, setShowParentDropdown] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      parentId: '',
    },
  });

  // Filter students based on search
  const filteredStudents = standaloneStudents.filter(student =>
    `${student.first_name} ${student.last_name} ${student.email}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  // Filter parents based on search
  const filteredParents = parents.filter(parent =>
    `${parent.first_name} ${parent.last_name} ${parent.email}`
      .toLowerCase()
      .includes(parentSearch.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      fetchStandaloneStudents();
      fetchParents();
      // Reset form and selections when opening
      setSelectedStudent(null);
      setSelectedParent(null);
      setStudentSearch('');
      setParentSearch('');
      form.reset();
    }
  }, [isOpen]);

  const fetchStandaloneStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, email, status, parent_id')
        .is('parent_id', null)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setStandaloneStudents(data || []);
    } catch (error) {
      console.error('Error fetching standalone students:', error);
      toast.error('Failed to load standalone students');
    }
  };

  const fetchParents = async () => {
    try {
      const { data, error } = await supabase
        .from('parents')
        .select('id, first_name, last_name, email, user_id')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setParents(data || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast.error('Failed to load parents');
    }
  };

  const onSubmit = async () => {
    if (!selectedStudent || !selectedParent) {
      toast.error('Please select both a student and a parent');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update the student's parent_id
      const { error } = await supabase
        .from('students')
        .update({ parent_id: selectedParent.id })
        .eq('id', typeof selectedStudent.id === 'string' ? parseInt(selectedStudent.id) : selectedStudent.id);

      if (error) throw error;

      toast.success('Student successfully linked to parent');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error linking student to parent:', error);
      toast.error('Failed to link student to parent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSelectedParent(null);
    setStudentSearch('');
    setParentSearch('');
    setShowStudentDropdown(false);
    setShowParentDropdown(false);
    form.reset();
    onClose();
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.first_name} ${student.last_name}`);
    setShowStudentDropdown(false);
    form.setValue('studentId', student.id.toString());
  };

  const selectParent = (parent: Parent) => {
    setSelectedParent(parent);
    setParentSearch(`${parent.first_name} ${parent.last_name}`);
    setShowParentDropdown(false);
    form.setValue('parentId', parent.id);
  };

  const clearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    form.setValue('studentId', '');
  };

  const clearParent = () => {
    setSelectedParent(null);
    setParentSearch('');
    form.setValue('parentId', '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Existing Student to Parent</DialogTitle>
          <DialogDescription>
            Select a standalone student and link them to an existing parent account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Student</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Type to search standalone students..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                      if (!e.target.value) {
                        clearStudent();
                      }
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    className={selectedStudent ? 'pr-8' : ''}
                  />
                  {selectedStudent && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearStudent}
                      className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Student Dropdown */}
              {showStudentDropdown && studentSearch && !selectedStudent && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <div className="max-h-60 overflow-auto p-1">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => selectStudent(student)}
                          className="flex cursor-pointer items-center gap-2 rounded-sm p-2 hover:bg-accent"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No students found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Selected Student Display */}
            {selectedStudent && (
              <div className="flex items-center gap-2 rounded-md border p-2 bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>
                  <span className="text-muted-foreground"> - {selectedStudent.email}</span>
                </span>
              </div>
            )}
          </div>

          {/* Parent Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Parent</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Type to search parents..."
                    value={parentSearch}
                    onChange={(e) => {
                      setParentSearch(e.target.value);
                      setShowParentDropdown(true);
                      if (!e.target.value) {
                        clearParent();
                      }
                    }}
                    onFocus={() => setShowParentDropdown(true)}
                    className={selectedParent ? 'pr-8' : ''}
                  />
                  {selectedParent && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearParent}
                      className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Parent Dropdown */}
              {showParentDropdown && parentSearch && !selectedParent && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <div className="max-h-60 overflow-auto p-1">
                    {filteredParents.length > 0 ? (
                      filteredParents.map((parent) => (
                        <div
                          key={parent.id}
                          onClick={() => selectParent(parent)}
                          className="flex cursor-pointer items-center gap-2 rounded-sm p-2 hover:bg-accent"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {parent.first_name} {parent.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {parent.email}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No parents found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Selected Parent Display */}
            {selectedParent && (
              <div className="flex items-center gap-2 rounded-md border p-2 bg-muted/50">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{selectedParent.first_name} {selectedParent.last_name}</strong>
                  <span className="text-muted-foreground"> - {selectedParent.email}</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={isSubmitting || !selectedStudent || !selectedParent}
            >
              {isSubmitting ? 'Linking...' : 'Link Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkStudentToParentForm;