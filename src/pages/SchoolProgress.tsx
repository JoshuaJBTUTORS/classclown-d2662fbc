import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Upload, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import PageTitle from "@/components/ui/PageTitle";
import { SchoolProgressCard } from "@/components/schoolProgress/SchoolProgressCard";
import { SchoolProgressUpload } from "@/components/schoolProgress/SchoolProgressUpload";
import { SchoolProgressViewer } from "@/components/schoolProgress/SchoolProgressViewer";
import { SchoolProgressFilters } from "@/components/schoolProgress/SchoolProgressFilters";
import { SchoolProgress, schoolProgressService } from "@/services/schoolProgressService";
import { Student } from "@/types/student";

export default function SchoolProgressPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<SchoolProgress | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<SchoolProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const queryClient = useQueryClient();

  // Get current user role and student info
  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (roleData) {
        setUserRole(roleData.role);

        // If student, get their info
        if (roleData.role === 'student') {
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('email', user.email)
            .single();
          
          if (studentData) {
            setCurrentStudent(studentData);
          }
        }

        // If parent, get their children
        if (roleData.role === 'parent') {
          const { data: parentData } = await supabase
            .from('parents')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (parentData) {
            const { data: studentsData } = await supabase
              .from('students')
              .select('*')
              .eq('parent_id', parentData.id);
            
            if (studentsData) {
              setAllStudents(studentsData);
              if (studentsData.length === 1) {
                setCurrentStudent(studentsData[0]);
              }
            }
          }
        }

        // If admin/owner, get all students
        if (roleData.role === 'admin' || roleData.role === 'owner') {
          const { data: studentsData } = await supabase
            .from('students')
            .select('*, parents(first_name, last_name)')
            .order('first_name');
          
          if (studentsData) {
            setAllStudents(studentsData);
          }
        }
      }
    };

    getUserInfo();
  }, []);

  // Fetch school progress data
  const { data: progressData = [], isLoading } = useQuery({
    queryKey: ['school-progress', currentStudent?.id],
    queryFn: () => schoolProgressService.getProgress(
      userRole === 'admin' || userRole === 'owner' ? undefined : Number(currentStudent?.id)
    ),
    enabled: !!userRole && (!!currentStudent || userRole === 'admin' || userRole === 'owner')
  });

  // Filter progress data
  const filteredProgress = progressData.filter(progress => {
    const matchesSearch = !searchQuery || 
      progress.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      progress.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      progress.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFileType = fileTypeFilter === 'all' || progress.file_type === fileTypeFilter;
    const matchesYear = academicYearFilter === 'all' || progress.academic_year === academicYearFilter;
    
    return matchesSearch && matchesFileType && matchesYear;
  });

  // Get available academic years for filter
  const availableYears = Array.from(
    new Set(progressData.map(p => p.academic_year).filter(Boolean))
  ).sort();

  // Get student name for display
  const getStudentName = (studentId: number) => {
    const student = allStudents.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const handleView = (progress: SchoolProgress) => {
    setSelectedProgress(progress);
  };

  const handleDownload = async (progress: SchoolProgress) => {
    try {
      await schoolProgressService.downloadFile(progress.file_url, progress.file_name);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download file");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProgress) return;

    try {
      await schoolProgressService.deleteProgress(deleteProgress.id);
      queryClient.invalidateQueries({ queryKey: ['school-progress'] });
      toast.success("File deleted successfully");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete file");
    } finally {
      setDeleteProgress(null);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    queryClient.invalidateQueries({ queryKey: ['school-progress'] });
  };

  // Show loading or no access states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading school progress...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userRole || (!currentStudent && userRole !== 'admin' && userRole !== 'owner')) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 p-8">
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                {userRole === 'parent' && allStudents.length === 0 
                  ? "No students found in your account. Please contact an administrator."
                  : "You don't have access to school progress features."
                }
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageTitle 
              title="School Progress" 
              subtitle="Upload and view report cards, mock exam results, and other school documents"
            />
            
            {(userRole === 'student' || userRole === 'parent') && currentStudent && (
              <Button onClick={() => setShowUpload(!showUpload)} className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>

        {/* Upload Form */}
        {showUpload && currentStudent && (
          <SchoolProgressUpload
            studentId={currentStudent.id as number}
            onUploadSuccess={handleUploadSuccess}
            onCancel={() => setShowUpload(false)}
          />
        )}

        {/* Filters */}
        <SchoolProgressFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          fileTypeFilter={fileTypeFilter}
          onFileTypeChange={setFileTypeFilter}
          academicYearFilter={academicYearFilter}
          onAcademicYearChange={setAcademicYearFilter}
          availableYears={availableYears}
        />

        {/* Progress Grid */}
        {filteredProgress.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {progressData.length === 0 
                ? "Start by uploading your first school progress document"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {(userRole === 'student' || userRole === 'parent') && currentStudent && (
              <Button onClick={() => setShowUpload(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProgress.map((progress) => (
              <SchoolProgressCard
                key={progress.id}
                progress={progress}
                onView={handleView}
                onDownload={handleDownload}
                onDelete={setDeleteProgress}
                showStudentName={userRole === 'admin' || userRole === 'owner'}
                studentName={getStudentName(progress.student_id)}
              />
            ))}
          </div>
        )}

          {/* File Viewer */}
          <SchoolProgressViewer
            progress={selectedProgress}
            open={!!selectedProgress}
            onOpenChange={(open) => !open && setSelectedProgress(null)}
          />

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteProgress} onOpenChange={() => setDeleteProgress(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{deleteProgress?.file_name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteConfirm}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}