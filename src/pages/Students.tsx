
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
import { Student } from '@/components/students/ViewStudentProfile'; 
import AddStudentForm from '@/components/students/AddStudentForm';

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch students from Supabase
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match the Student interface
      const formattedStudents: Student[] = data.map((student: any) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email || '',
        phone: student.phone || '',
        subjects: student.subjects || '',
        status: (student.status as 'active' | 'inactive') || 'active',
        joinedDate: student.created_at 
          ? new Date(student.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) 
          : undefined,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        parent_first_name: student.parent_first_name || '',
        parent_last_name: student.parent_last_name || '',
        student_id: student.student_id,
        created_at: student.created_at
      }));
      
      setStudents(formattedStudents);
      setFilteredStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
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
          (typeof student.subjects === 'string' && student.subjects.toLowerCase().includes(query))
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
              title="Students" 
              subtitle="Manage your students"
              className="mb-4 md:mb-0"
            />
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Student List</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
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
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        Loading students...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
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
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {student.email}
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
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                              >
                                Delete Student
                              </DropdownMenuItem>
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

      {/* Use the AddStudentForm component */}
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
    </div>
  );
};

export default Students;
