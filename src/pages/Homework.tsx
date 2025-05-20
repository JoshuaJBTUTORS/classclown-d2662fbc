
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import UnifiedHomeworkView from '@/components/homework/UnifiedHomeworkView';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Homework: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<'tutor' | 'student' | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(true); // For development testing

  useEffect(() => {
    // For demonstration purposes, we'll detect role based on the user's email
    // In a real app, this would be based on proper authentication
    const checkUserRole = async () => {
      setIsLoading(true);
      try {
        console.log("Checking user role...");

        // Check if user is a tutor
        const { data: tutorData, error: tutorError } = await supabase
          .from('tutors')
          .select('id')
          .limit(1);
        
        console.log("Tutor check result:", { tutorData, tutorError });
        
        if (!tutorError && tutorData && tutorData.length > 0) {
          console.log("Setting user as tutor");
          setUserRole('tutor');
          setIsLoading(false);
          return;
        }

        // Check if user is a student
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .limit(1);
        
        console.log("Student check result:", { studentData, studentError });
        
        if (!studentError && studentData && studentData.length > 0) {
          console.log("Setting user as student with ID:", studentData[0].id);
          setUserRole('student');
          setStudentId(studentData[0].id);
          setIsLoading(false);
          return;
        }

        // Default to student role with ID 1 if no match is found
        console.log("No role found, defaulting to student");
        setUserRole('student');
        setStudentId(1);
        toast.info("No specific role found, defaulting to student view");
      } catch (error) {
        console.error("Error detecting user role:", error);
        toast.error("Failed to detect user role");
        // Fallback to student role
        setUserRole('student');
        setStudentId(1);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Function to switch roles for testing
  const handleRoleSwitch = (role: 'tutor' | 'student') => {
    setUserRole(role);
    if (role === 'student') {
      // Get first student for testing
      // Fix the TypeScript error by using async/await or proper Promise handling
      const fetchStudentId = async () => {
        try {
          const { data, error } = await supabase
            .from('students')
            .select('id')
            .limit(1);
          
          if (error) {
            console.error("Failed to get student ID:", error);
            setStudentId(1);
            toast.error("Error fetching student data");
            return;
          }
          
          if (data && data.length > 0) {
            setStudentId(data[0].id);
            toast.success(`Switched to student view with ID: ${data[0].id}`);
          } else {
            setStudentId(1);
            toast.warning("No students found, using default ID: 1");
          }
        } catch (err) {
          console.error("Exception while fetching student ID:", err);
          setStudentId(1);
          toast.error("Error fetching student data");
        }
      };
      
      // Execute the async function
      fetchStudentId();
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
              title="Homework" 
              subtitle={userRole === 'tutor' 
                ? "Manage homework assignments and submissions" 
                : "View and submit your homework assignments"}
              className="mb-4 md:mb-0"
            />
            
            {/* Role switcher for testing */}
            {debugMode && (
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <span className="text-sm text-muted-foreground">Testing:</span>
                <Select
                  value={userRole || ""}
                  onValueChange={(val) => handleRoleSwitch(val as 'tutor' | 'student')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutor">Tutor Role</SelectItem>
                    <SelectItem value="student">Student Role</SelectItem>
                  </SelectContent>
                </Select>
                {userRole === 'student' && (
                  <span className="text-xs text-muted-foreground">
                    Student ID: {studentId || 'None'}
                  </span>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-10 text-center">Loading role information...</div>
          ) : (
            <UnifiedHomeworkView userRole={userRole} studentId={studentId} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Homework;
