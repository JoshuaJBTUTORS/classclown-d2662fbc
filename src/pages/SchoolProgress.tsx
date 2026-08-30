import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import MobileMenuButton from "@/components/navigation/MobileMenuButton";
import Sidebar from "@/components/navigation/Sidebar";
import { SchoolProgressHero } from "@/components/schoolProgress/SchoolProgressHero";
import { SchoolProgressCard } from "@/components/schoolProgress/SchoolProgressCard";
import { SchoolProgressUpload } from "@/components/schoolProgress/SchoolProgressUpload";
import { SchoolProgressViewer } from "@/components/schoolProgress/SchoolProgressViewer";
import { SchoolProgressFilters } from "@/components/schoolProgress/SchoolProgressFilters";
import { SchoolProgress, schoolProgressService } from "@/services/schoolProgressService";
import { Student } from "@/types/student";
import LoadingHand from '@/components/ui/loading-hand';

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
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);

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
              if (studentsData.length >= 1) {
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
      setUserInfoLoaded(true);
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
  if (isLoading || !userInfoLoaded) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <LoadingHand />
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
          <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex w-full flex-1 flex-col space-y-6 p-4 sm:p-6 lg:p-8">
          <SchoolProgressHero
            documentCount={filteredProgress.length}
            canUpload={userRole === 'student' || userRole === 'parent'}
            showUpload={showUpload}
            onToggleUpload={() => setShowUpload(!showUpload)}
            students={userRole === 'parent' ? allStudents : []}
            currentStudent={currentStudent}
            onStudentChange={setCurrentStudent}
          />

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
          <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pastel-sky">
              <Upload className="h-7 w-7 text-pastel-sky-foreground" />
            </div>
            <h3 className="font-heading text-2xl font-extrabold tracking-tight">No documents yet</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
              {progressData.length === 0
                ? "Upload report cards, mock exam results and other school documents to keep everything in one place."
                : "Try adjusting your search or filter criteria."}
            </p>
            {(userRole === 'student' || userRole === 'parent') && progressData.length === 0 && (
              <Button
                onClick={() => setShowUpload(true)}
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProgress.map((progress, index) => (
              <div
                key={progress.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
              <SchoolProgressCard
                progress={progress}
                onView={handleView}
                onDownload={handleDownload}
                onDelete={setDeleteProgress}
                showStudentName={userRole === 'admin' || userRole === 'owner'}
                studentName={getStudentName(progress.student_id)}
              />
              </div>
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