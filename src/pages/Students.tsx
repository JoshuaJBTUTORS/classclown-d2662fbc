import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Plus, Search, Upload, ChevronDown, Users, UserPlus, User } from 'lucide-react';
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
import AddStudentToParentForm from '@/components/students/AddStudentToParentForm';
import EditParentForm from '@/components/parents/EditParentForm';
import DeleteStudentDialog from '@/components/students/DeleteStudentDialog';
import { BulkImportDialog } from '@/components/students/BulkImportDialog';
import { useAuth } from '@/contexts/AuthContext';

import { studentDataService } from '@/services/studentDataService';
import { cn } from '@/lib/utils';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isAddToParentDialogOpen, setIsAddToParentDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditParentDialogOpen, setIsEditParentDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { isParent, isAdmin, isOwner, user, userRole, parentProfile } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      console.log('Starting student fetch...');
      console.log('Current user:', user?.email);
      console.log('User role:', userRole);
      console.log('Is admin:', isAdmin);
      console.log('Is owner:', isOwner);
      console.log('Is parent:', isParent);
      
      let studentsQuery = supabase
        .from('students')
        .select('*');


      // If user is a parent, only show their own children
      if (isParent && parentProfile?.id) {
        studentsQuery = studentsQuery.eq('parent_id', parentProfile.id);
      }

      const { data: studentsData, error: studentsError } = await studentsQuery
        .order('last_name', { ascending: true });

      console.log('Students query result:', { studentsData, studentsError });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        toast.error(`Failed to fetch students: ${studentsError.message}`);
        throw studentsError;
      }

      console.log('Raw students data from database:', studentsData);
      console.log('Number of students found:', studentsData?.length || 0);

      if (!studentsData || studentsData.length === 0) {
        console.log('No students found in database');
        setStudents([]);
        setFilteredStudents([]);
        setIsLoading(false);
        return;
      }

      // Check for data consistency issues and fix them
      if (user?.email && userRole === 'student') {
        await studentDataService.ensureStudentUserIdLink(user.email);
      }

      // Get all unique parent IDs (excluding null values)
      const parentIds = [...new Set(studentsData
        .map(student => student.parent_id)
        .filter(Boolean))] as string[];

      console.log('Parent IDs to fetch:', parentIds);

      // Fetch parent data if there are any parent IDs
      let parentsData: any[] = [];
      if (parentIds.length > 0) {
        let parentsQuery = supabase
          .from('parents')
          .select('id, first_name, last_name, email, phone')
          .in('id', parentIds);


        const { data: fetchedParents, error: parentsError } = await parentsQuery;

        console.log('Parents query result:', { fetchedParents, parentsError });

        if (parentsError) {
          console.error('Error fetching parents:', parentsError);
        } else {
          parentsData = fetchedParents || [];
          console.log('Parents data received:', parentsData);
        }
      }

      // Create a map of parent ID to parent data
      const parentsMap = new Map();
      parentsData.forEach(parent => {
        parentsMap.set(parent.id, parent);
      });

      // Transform the data to match the Student interface
      const formattedStudents: Student[] = studentsData.map((student: any) => {
        const parentData = student.parent_id ? parentsMap.get(student.parent_id) : null;
        
        // Handle the date formatting with proper null checks
        let joinedDate = 'Not available';
        if (student.created_at) {
          try {
            joinedDate = new Date(student.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          } catch (error) {
            console.warn('Error formatting date for student:', student.id, error);
            joinedDate = 'Not available';
          }
        }
        
        const formattedStudent: Student = {
          id: student.id,
          name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          email: student.email || '',
          phone: student.phone || '',
          subjects: student.subjects || '',
          status: student.status || 'active',
          joinedDate: joinedDate,
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
      
      console.log('Final formatted students array:', formattedStudents);
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
    // Only fetch if user is authenticated
    if (user) {
      fetchStudents();
    } else {
      console.log('User not authenticated, skipping fetch');
      setIsLoading(false);
    }
  }, [user, userRole, parentProfile]);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        (student) =>
          (student.first_name || '').toLowerCase().includes(query) ||
          (student.last_name || '').toLowerCase().includes(query) ||
          (student.email || '').toLowerCase().includes(query) ||
          (typeof student.subjects === 'string' && student.subjects.toLowerCase().includes(query)) ||
          (student.parentName && student.parentName.toLowerCase().includes(query))
      );
      setFilteredStudents(filtered);
    }
    // Reset to first page when filtering
    setCurrentPage(1);
  }, [searchQuery, students]);

  // Pagination calculations
  const itemsPerPage = 50;
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

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

  const handleEditParentClick = (student: Student) => {
    // Create a parent object from the student's parent data
    if (student.parent_id) {
      const parentData = {
        id: student.parent_id,
        user_id: '', // We'll need to fetch this if needed
        first_name: student.parentName?.split(' ')[0] || '',
        last_name: student.parentName?.split(' ').slice(1).join(' ') || '',
        email: student.parentEmail || '',
        phone: student.parentPhone || '',
        billing_address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        created_at: '',
        updated_at: '',
      };
      setSelectedParent(parentData);
      setIsEditParentDialogOpen(true);
    }
  };

  const handleStudentUpdated = (updatedStudent: Student) => {
    fetchStudents();
    setIsEditDialogOpen(false);
  };

  const handleParentUpdated = (updatedParent: any) => {
    fetchStudents();
    setIsEditParentDialogOpen(false);
  };

  // Helper function to get status badge variant and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Trial
          </Badge>
        );
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="flex flex-col mb-4 md:mb-0">
              <PageTitle 
                title={isParent ? "My Children" : "Clients"} 
                subtitle={isParent ? "Manage your children's profiles" : "Manage client accounts and family relationships"}
                className="mb-2"
              />
            </div>
            <div className="flex gap-2">
              {(isAdmin || isOwner) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={() => setIsAddFamilyDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Add Family
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setIsAddToParentDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add to Parent
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setIsAddDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Add Client Only
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setIsBulkImportDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Bulk Import
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>{isParent ? "Children" : "Client List"}</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients or parents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {currentStudents.length} of {totalItems} {isParent ? "children" : "clients"}
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    {!isParent && (
                      <TableHead className="hidden lg:table-cell">Parent</TableHead>
                    )}
                    <TableHead className="hidden md:table-cell">Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        Loading clients...
                      </TableCell>
                    </TableRow>
                  ) : currentStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        {searchQuery ? 'No clients found matching your search.' : 
                         isParent ? 'No children found.' : 'No clients found. Add your first client to get started.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentStudents.map((student) => (
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
                        {!isParent && (
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-sm">
                              <div className="font-medium">
                                {student.parentName}
                              </div>
                              {student.parentEmail && (
                                <div className="text-gray-500">{student.parentEmail}</div>
                              )}
                            </div>
                          </TableCell>
                        )}
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
                          {getStatusBadge(student.status)}
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
                              {(isAdmin || isOwner) && student.parent_id && (
                                <DropdownMenuItem onClick={() => handleEditParentClick(student)}>
                                  Edit Parent
                                </DropdownMenuItem>
                              )}
                              {(isAdmin || isOwner) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(student)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Delete Client
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={cn(
                            "cursor-pointer",
                            currentPage === 1 && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={cn(
                            "cursor-pointer",
                            currentPage === totalPages && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
          
          {(isAdmin || isOwner) && (
            <>
              <AddStudentForm 
                isOpen={isAddDialogOpen} 
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchStudents();
                }}
              />

              <AddParentStudentForm 
                isOpen={isAddFamilyDialogOpen} 
                onClose={() => setIsAddFamilyDialogOpen(false)}
                onSuccess={() => {
                  setIsAddFamilyDialogOpen(false);
                  fetchStudents();
                }}
              />

              <AddStudentToParentForm 
                isOpen={isAddToParentDialogOpen} 
                onClose={() => setIsAddToParentDialogOpen(false)}
                onSuccess={() => {
                  setIsAddToParentDialogOpen(false);
                  fetchStudents();
                }}
              />

              <EditParentForm
                parent={selectedParent}
                isOpen={isEditParentDialogOpen}
                onClose={() => setIsEditParentDialogOpen(false)}
                onUpdate={handleParentUpdated}
              />

              <DeleteStudentDialog
                student={selectedStudent}
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onDeleted={fetchStudents}
              />

              <BulkImportDialog
                isOpen={isBulkImportDialogOpen}
                onClose={() => setIsBulkImportDialogOpen(false)}
                onSuccess={() => {
                  setIsBulkImportDialogOpen(false);
                  fetchStudents();
                }}
              />
            </>
          )}

          <ViewStudentProfile
            student={selectedStudent}
            isOpen={isViewDialogOpen}
            onClose={() => setIsViewDialogOpen(false)}
          />

          <EditStudentForm
            student={selectedStudent}
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onUpdate={handleStudentUpdated}
          />
        </main>
      </div>
    </>
  );
};

export default Students;
