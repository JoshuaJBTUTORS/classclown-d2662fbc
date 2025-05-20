
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import HomeworkManager from '@/components/homework/HomeworkManager';
import StudentHomeworkView from '@/components/homework/StudentHomeworkView';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';
import { toast } from 'sonner';

const Homework: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<'tutor' | 'student' | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For demonstration purposes, we'll detect role based on the user's email
    // In a real app, this would be based on proper authentication
    checkUserRole();
  }, []);

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
        console.log("Setting user as student");
        setUserRole('student');
        setStudentId(studentData[0].id);
        setIsLoading(false);
        return;
      }

      // Default to tutor role if no match is found
      console.log("No role match found, defaulting to tutor");
      setUserRole('tutor');
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole('tutor'); // Default to tutor on error
      setIsLoading(false);
    }
  };

  const handleRoleSwitch = async () => {
    if (userRole === 'tutor') {
      try {
        // Switch to student - check if we have any student data
        const { data, error } = await supabase
          .from('students')
          .select('id')
          .limit(1);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setUserRole('student');
          setStudentId(data[0].id);
          toast.success('Switched to Student view');
        } else {
          toast.error('No student data available for testing');
        }
      } catch (error) {
        console.error("Error switching to student role:", error);
        toast.error('Failed to switch roles');
      }
    } else {
      // Switch to tutor
      setUserRole('tutor');
      toast.success('Switched to Tutor view');
    }
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Homework" 
              subtitle={userRole === 'tutor' 
                ? "Manage homework assignments and submissions" 
                : "View and submit your homework assignments"}
              className="mb-4 md:mb-0"
            />
            
            {/* Role switcher for testing */}
            <Button 
              variant="outline" 
              className="flex items-center gap-2 mb-4 md:mb-0" 
              onClick={handleRoleSwitch}
            >
              <UserCog className="h-4 w-4" />
              {userRole === 'tutor' 
                ? 'Switch to Student View' 
                : 'Switch to Tutor View'}
            </Button>
          </div>

          {isLoading ? (
            <div className="py-10 text-center">Loading...</div>
          ) : userRole === 'tutor' ? (
            <HomeworkManager />
          ) : studentId ? (
            <StudentHomeworkView studentId={studentId} />
          ) : (
            <div className="py-10 text-center">Loading...</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Homework;
