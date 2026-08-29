import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ChevronDown, Users, UserPlus, User, Upload, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditStudentForm from '@/components/students/EditStudentForm';
import ViewStudentProfile from '@/components/students/ViewStudentProfile';
import { Student } from '@/types/student';
import AddStudentForm from '@/components/students/AddStudentForm';
import AddParentStudentForm from '@/components/students/AddParentStudentForm';
import AddStudentToParentForm from '@/components/students/AddStudentToParentForm';
import LinkStudentToParentForm from '@/components/students/LinkStudentToParentForm';
import EditParentForm from '@/components/parents/EditParentForm';
import AddParentOnlyForm from '@/components/parents/AddParentOnlyForm';
import DeleteStudentDialog from '@/components/students/DeleteStudentDialog';
import { BulkImportDialog } from '@/components/students/BulkImportDialog';
import { useAuth } from '@/contexts/AuthContext';
import { studentDataService } from '@/services/studentDataService';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
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

const chipBase = cn(
  'inline-flex items-center gap-2.5 rounded-full pl-2 pr-4 h-11 text-sm font-medium transition-all duration-200',
  'bg-transparent text-foreground border border-foreground hover:-translate-y-0.5 hover:bg-foreground/5',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
);
const chipIcon =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M11 4.2c3.6-.3 6.4 2.4 6.3 5.9-.1 3.3-2.8 5.8-6.1 5.7-3.4-.1-5.9-2.7-5.8-6C5.5 6.7 7.9 4.4 11 4.2z" />
    <path d="M15.4 14.6c1.6 1.5 3 3.1 4.3 4.9" />
  </svg>
);

const DoodleArrow: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M4.8 12.2c4.7-.4 9.4-.5 14.1-.3" />
    <path d="M14.2 7.3c1.8 1.5 3.4 3 4.8 4.7-1.5 1.6-3.1 3.1-4.9 4.5" />
  </svg>
);

const initials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

const avatarTones = [
  'bg-pastel-mint',
  'bg-pastel-lilac',
  'bg-pastel-butter',
  'bg-pastel-blush',
  'bg-pastel-sky',
];

const statusTone = (status?: string) => {
  const s = status || 'active';
  if (s === 'trial') return 'bg-pastel-butter text-pastel-butter-foreground';
  if (s === 'active') return 'bg-pastel-mint text-pastel-mint-foreground';
  return 'bg-muted text-muted-foreground';
};

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'trial'>('active');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddFamilyDialogOpen, setIsAddFamilyDialogOpen] = useState(false);
  const [isAddToParentDialogOpen, setIsAddToParentDialogOpen] = useState(false);
  const [isLinkStudentDialogOpen, setIsLinkStudentDialogOpen] = useState(false);
  const [isAddParentOnlyDialogOpen, setIsAddParentOnlyDialogOpen] = useState(false);
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
          .select('id, first_name, last_name, email, phone, has_complimentary_access')
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
        console.log('Processing student:', student);
        
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
        
        console.log('Formatted student:', formattedStudent);
        return formattedStudent;
      });
      
      console.log('Final formatted students array:', formattedStudents);
      console.log('Total students to display:', formattedStudents.length);
      
      setStudents(formattedStudents);
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

  // Tab classification: trial students vs everyone else
  const trialStudents = students.filter((s) => (s.status || 'active') === 'trial');
  const activeStudents = students.filter((s) => (s.status || 'active') !== 'trial');
  const tabStudents = activeTab === 'trial' ? trialStudents : activeStudents;

  // Filter students based on search query
  const query = searchQuery.trim().toLowerCase();
  const filteredStudents = query
    ? tabStudents.filter(
        (student) =>
          (student.first_name || '').toLowerCase().includes(query) ||
          (student.last_name || '').toLowerCase().includes(query) ||
          (student.email || '').toLowerCase().includes(query) ||
          (typeof student.subjects === 'string' && student.subjects.toLowerCase().includes(query)) ||
          (student.parentName && student.parentName.toLowerCase().includes(query))
      )
    : tabStudents;

  const handleTabChange = (tab: 'active' | 'trial') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

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

  const handleEditParentClick = async (student: Student) => {
    // Fetch the complete parent data from the database
    if (student.parent_id) {
      try {
        const { data: parentData, error } = await supabase
          .from('parents')
          .select('*')
          .eq('id', student.parent_id)
          .single();

        if (error || !parentData) {
          console.error('Error fetching parent data:', error);
          toast.error('Failed to load parent data');
          return;
        }

        setSelectedParent(parentData);
        setIsEditParentDialogOpen(true);
      } catch (error) {
        console.error('Error in handleEditParentClick:', error);
        toast.error('Failed to load parent data');
      }
    }
  };

  const handleStudentUpdated = (updatedStudent: Student) => {
    fetchStudents();
    setIsEditDialogOpen(false);
  };

  const handleParentUpdated = (updatedParent: any) => {
    // Update the selectedParent state with the new data
    setSelectedParent(updatedParent);
    fetchStudents();
    setIsEditParentDialogOpen(false);
  };


  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                {isParent ? 'My Children' : 'Clients'}
              </h1>
              {students.length > 0 && (
                <span className="mt-2 inline-flex items-center rounded-full bg-pastel-lilac px-3 py-1 text-xs font-semibold text-foreground">
                  {students.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <span className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleSearch className="h-4 w-4" />
                </span>
                <input
                  placeholder={isParent ? 'Search children...' : 'Search clients...'}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-11 w-full rounded-full border-2 border-foreground bg-transparent pl-12 pr-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-foreground/[0.03]"
                />
              </div>
              {(isAdmin || isOwner) && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/onboarding')}
                    className={chipBase}
                  >
                    <span className={chipIcon}>
                      <UserPlus className="h-4 w-4" />
                    </span>
                    Cleo Onboarding
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className={chipBase}>
                        <span className={chipIcon}>
                          <Plus className="h-4 w-4" />
                        </span>
                        Add New
                        <ChevronDown className="h-4 w-4" />
                      </button>
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
                      onClick={() => setIsLinkStudentDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Link Existing Student
                    </DropdownMenuItem>
                     <DropdownMenuItem
                      onClick={() => setIsAddDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Add Client Only
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsAddParentOnlyDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Parent Only
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
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {!isLoading && students.length > 0 && (
            <div className="flex items-center gap-2">
              {(
                [
                  { key: 'active' as const, label: 'Active', count: activeStudents.length },
                  { key: 'trial' as const, label: 'Trial', count: trialStudents.length },
                ]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border-2 border-foreground px-4 py-2 text-sm font-semibold transition-colors',
                    activeTab === tab.key
                      ? 'bg-foreground text-background'
                      : 'bg-transparent text-foreground hover:bg-foreground/[0.04]'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold',
                      activeTab === tab.key
                        ? 'bg-background/20 text-background'
                        : 'bg-pastel-lilac text-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-6">
              {isLoading ? (
                <div className="space-y-2 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-[1.25rem]" />
                  ))}
                </div>
              ) : currentStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
                  {searchQuery ? (
                    <Search className="h-8 w-8 text-foreground/70" />
                  ) : (
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? `No clients match "${searchQuery}".`
                      : activeTab === 'trial'
                        ? 'No trial clients.'
                        : isParent
                          ? "Your children's profiles will appear here."
                          : 'No clients yet. Add your first client to get started.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
                  <div className="space-y-2">
                    {/* Column headers (desktop) */}
                    <div
                      className={cn(
                        'hidden gap-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid',
                        isParent
                          ? 'grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_96px]'
                          : 'grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)_96px]'
                      )}
                    >
                      <span>Name</span>
                      <span>Email</span>
                      {!isParent && <span>Parent</span>}
                      <span>Subjects</span>
                      <span>Status</span>
                      <span className="text-right">Actions</span>
                    </div>

                    {currentStudents.map((student, i) => {
                      const subjects =
                        typeof student.subjects === 'string' && student.subjects
                          ? student.subjects.split(',').map((s) => s.trim()).filter(Boolean)
                          : Array.isArray(student.subjects)
                            ? (student.subjects as string[])
                            : [];

                      return (
                        <div
                          key={student.id}
                          className={cn(
                            'group grid w-full grid-cols-1 items-center gap-2 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sky/70 lg:gap-4',
                            isParent
                              ? 'lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_96px]'
                              : 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)_96px]'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleViewClick(student)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <span
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground',
                                avatarTones[i % avatarTones.length]
                              )}
                            >
                              {initials(student.first_name, student.last_name)}
                            </span>
                            <span className="truncate font-semibold text-foreground">
                              {student.first_name} {student.last_name}
                            </span>
                          </button>

                          <span className="truncate pl-12 text-sm text-muted-foreground lg:pl-0">
                            {student.email || '—'}
                          </span>
                          {!isParent && (
                            <span className="truncate pl-12 text-sm text-muted-foreground lg:pl-0">
                              {student.parentName || '—'}
                            </span>
                          )}
                          <span className="flex flex-wrap items-center gap-1.5 pl-12 lg:pl-0">
                            {subjects.length === 0 ? (
                              <span className="text-sm text-muted-foreground">—</span>
                            ) : (
                              <>
                                {subjects.slice(0, 2).map((subject) => (
                                  <span
                                    key={subject}
                                    className="rounded-full bg-pastel-lilac px-2.5 py-0.5 text-xs font-medium text-foreground"
                                  >
                                    {subject}
                                  </span>
                                ))}
                                {subjects.length > 2 && (
                                  <span className="rounded-full bg-pastel-lilac px-2.5 py-0.5 text-xs font-medium text-foreground">
                                    +{subjects.length - 2}
                                  </span>
                                )}
                              </>
                            )}
                          </span>

                          <span className="pl-12 lg:pl-0">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize',
                                statusTone(student.status)
                              )}
                            >
                              {student.status || 'active'}
                            </span>
                          </span>

                          <span className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Client actions"
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
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
                            <button
                              type="button"
                              onClick={() => handleViewClick(student)}
                              aria-label={`Open ${student.first_name} ${student.last_name}`}
                              className="hidden h-9 w-9 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:flex"
                            >
                              <DoodleArrow className="h-4 w-4" />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
          </div>
          
          
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

          <LinkStudentToParentForm
            isOpen={isLinkStudentDialogOpen}
            onClose={() => setIsLinkStudentDialogOpen(false)}
            onSuccess={fetchStudents}
          />

          <AddParentOnlyForm
            isOpen={isAddParentOnlyDialogOpen}
            onClose={() => setIsAddParentOnlyDialogOpen(false)}
            onSuccess={fetchStudents}
          />
          </div>
        </main>
      </div>
    </>
  );
};

export default Students;
