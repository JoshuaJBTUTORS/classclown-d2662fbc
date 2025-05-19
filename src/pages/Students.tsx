
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Filter, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import StudentForm from '@/components/forms/StudentForm';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  status: 'active' | 'inactive';
  joinedDate: string;
  first_name: string;
  last_name: string;
  parent_first_name: string;
  parent_last_name: string;
  student_id?: string;
}

const Students = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Fetch students from Supabase on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Transform the data to match our Student interface
        const transformedStudents = data.map(student => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          phone: student.phone || '',
          subjects: student.subjects || [],
          status: student.status || 'active',
          joinedDate: new Date(student.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          first_name: student.first_name,
          last_name: student.last_name,
          parent_first_name: student.parent_first_name,
          parent_last_name: student.parent_last_name,
          student_id: student.student_id
        }));
        
        setStudents(transformedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleAddStudent = async (data: any) => {
    try {
      // Convert comma-separated subjects to array
      const subjectsArray = data.subjects
        .split(',')
        .map((subject: string) => subject.trim())
        .filter((subject: string) => subject !== '');
      
      const newStudent = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        parent_first_name: data.parentFirstName,
        parent_last_name: data.parentLastName,
        student_id: data.studentId || null,
        subjects: subjectsArray,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      
      // Add to Supabase
      const { data: insertedData, error } = await supabase
        .from('students')
        .insert(newStudent)
        .select();
        
      if (error) throw error;
      
      if (insertedData && insertedData[0]) {
        // Transform the inserted data to match our Student interface
        const studentRecord = insertedData[0];
        const newStudentRecord = {
          id: studentRecord.id,
          name: `${studentRecord.first_name} ${studentRecord.last_name}`,
          email: studentRecord.email,
          phone: '',
          subjects: studentRecord.subjects || [],
          status: studentRecord.status,
          joinedDate: new Date(studentRecord.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          first_name: studentRecord.first_name,
          last_name: studentRecord.last_name,
          parent_first_name: studentRecord.parent_first_name,
          parent_last_name: studentRecord.parent_last_name,
          student_id: studentRecord.student_id
        };
        
        // Update state with new student
        setStudents(prevStudents => [newStudentRecord, ...prevStudents]);
        
        setDialogOpen(false);
        toast({
          title: "Success",
          description: "Student has been added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Students" 
              subtitle="Manage all your students and their information"
              className="mb-4 md:mb-0"
            />
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Enter the student's details below to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <StudentForm 
                  onSubmit={handleAddStudent} 
                  onCancel={() => setDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="w-full pl-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading students...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No students added yet. Add your first student by clicking the "Add New Student" button.
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <div>{student.email}</div>
                            <div className="text-muted-foreground text-sm">{student.phone}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {student.subjects.map((subject, i) => (
                                <Badge key={i} variant="secondary" className="rounded-sm">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={student.status === 'active' ? 'default' : 'outline'} 
                              className="capitalize"
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{student.joinedDate}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem>Schedule Session</DropdownMenuItem>
                                <DropdownMenuItem>View Progress</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
            
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{students.length}</strong> of <strong>{students.length}</strong> students
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled={students.length === 0}>Next</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Students;
