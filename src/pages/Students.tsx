import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import EditStudentForm from '@/components/students/EditStudentForm';
import ViewStudentProfile from '@/components/students/ViewStudentProfile';
import { Student } from '@/types/student';
import AddStudentForm from '@/components/students/AddStudentForm';
import AddParentStudentForm from '@/components/students/AddParentStudentForm';
import DeleteStudentDialog from '@/components/students/DeleteStudentDialog';
import { useAuth } from '@/contexts/AuthContext';

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isParent, isAdmin, isOwner } = useAuth();

  // Fetch students from Supabase with parent information
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      console.log('Starting student fetch...');
      
      // First get all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log('Students data received:', studentsData);

      if (!studentsData || studentsData.length === 0) {
        console.log('No students found in database');
        setStudents([]);
        setFilteredStudents([]);
        setIsLoading(false);
        return;
      }

      // Get all unique parent IDs (excluding null values)
      const parentIds = [...new Set(studentsData
        .map(student => student.parent_id)
        .filter(Boolean))] as string[];

      console.log('Parent IDs to fetch:', parentIds);

      // Fetch parent data if there are any parent IDs
      let parentsData: any[] = [];
      if (parentIds.length > 0) {
        const { data: fetchedParents, error: parentsError } = await supabase
          .from('parents')
          .select('id, first_name, last_name, email, phone')
          .in('id', parentIds);

        if (parentsError) {
          console.error('Error fetching parents:', parentsError);
        } else {
          parentsData = fetchedParents || [];
        }
      }

      console.log('Parents data received:', parentsData);

      // Create a map of parent ID to parent data
      const parentsMap = new Map();
      parentsData.forEach(parent => {
        parentsMap.set(parent.id, parent);
      });

      // Transform the data to match the Student interface
      const formattedStudents: Student[] = studentsData
        .filter(student => {
          // Only filter out completely empty records
          if (!student.first_name?.trim() && !student.last_name?.trim()) {
            console.warn('Skipping student with missing name:', student);
            return false;
          }
          return true;
        })
        .map((student: any) => {
          const parentData = student.parent_id ? parentsMap.get(student.parent_id) : null;
          
          const formattedStudent: Student = {
            id: student.id,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            email: student.email || '',
            phone: student.phone || '',
            subjects: student.subjects || '',
            status: student.status || 'active',
            joinedDate: student.created_at 
              ? new Date(student.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) 
              : 'Not available',
            first_name: student.first_name || '',
            last_name: student.last_name || '',
            parent_id: student.parent_id || null,
            user_id: student.user_id,
            student_id: student.student_id,
            created_at: student.created_at,
            grade: student.grade,
            // Add parent information for display
            parentName: parentData 
              ? `${parentData.first_name || ''} ${parentData.last_name || ''}`.trim()
              : 'No Parent Assigned',
            parentEmail: parentData?.email || '',
            parentPhone: parentData?.phone || ''
          };
          
          return formattedStudent;
        });
      
      console.log('Final formatted students:', formattedStudents);
      console.log('Total students to display:', formattedStudents.length);
      
      setStudents(formattedStudents);
      setFilteredStudents(formattedStudents);
    } catch (error) {
      console.error('Error in fetchStudents:', error);
      toast.error('Failed to load students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.first_name.toLowerCase().includes(query) ||
          student.last_name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          (typeof student.subjects === 'string' && student.subjects.toLowerCase().includes(query)) ||
          (student.parentName && student.parentName.toLowerCase().includes(query))
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };
  
  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleStudentUpdated = (updatedStudent: Student) => {
    fetchStudents();
    setIsEditDialogOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <PageTitle 
              title={isParent ? "My Children" : "Students"} 
              subtitle={isParent ? "Manage your children's profiles" : "Manage student accounts and family relationships"}
              className="mb-4 md:mb-0"
            />
            <div className="flex gap-2">
              {(isAdmin || isOwner) && (
                <>
                  <Button 
                    onClick={() => setIsAddFamilyDialogOpen(true)} 
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Plus className="h-4 w-4" />
                    Add Family
                  </Button>
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)} 
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add Student Only
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>{isParent ? "Children" : "Student List"}</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students or parents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Parent</TableHead>
                    <TableHead className="hidden md:table-cell">Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="font-medium">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.user_id ? '🔐 Has Login' : '👤 Parent Managed'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {student.email || <span className="text-gray-400">Not provided</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            <div className="font-medium">{student.parentName}</div>
                            {student.parentEmail && (
                              <div className="text-gray-500">{student.parentEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {typeof student.subjects === 'string' && student.subjects ? 
                              student.subjects.split(',').map((subject, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {subject.trim()}
                                </Badge>
                              )) : 
                              Array.isArray(student.subjects) && student.subjects.length > 0 ?
                              student.subjects.map((subject, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              )) :
                              <span className="text-muted-foreground text-sm">None</span>
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Options</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewClick(student)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(student)}>
                                Edit Student
                              </DropdownMenuItem>
                              {(isAdmin || isOwner) && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteClick(student)}
                                >
                                  Delete Student
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Family Dialog */}
      <AddParentStudentForm
        isOpen={isAddFamilyDialogOpen}
        onClose={() => setIsAddFamilyDialogOpen(false)}
        onSuccess={fetchStudents}
      />

      {/* Add Student Only Dialog */}
      <AddStudentForm
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={fetchStudents}
      />

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <EditStudentForm
          student={selectedStudent}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdate={handleStudentUpdated}
        />
      )}

      {/* View Student Dialog */}
      {selectedStudent && (
        <ViewStudentProfile
          student={selectedStudent}
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
        />
      )}
      
      {/* Delete Student Dialog */}
      {selectedStudent && (
        <DeleteStudentDialog
          student={selectedStudent}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={fetchStudents}
        />
      )}
    </div>
  );
};

export default Students;
