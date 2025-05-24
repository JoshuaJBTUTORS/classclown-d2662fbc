
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import HomeworkManager from '@/components/homework/HomeworkManager';
import StudentHomeworkView from '@/components/homework/StudentHomeworkView';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const Homework: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userRole, user, profile } = useAuth();

  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user || userRole !== 'student') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching student ID for user:", user.email);
        
        // Try to find student by email first
        let { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (studentError) {
          console.error("Error fetching student by email:", studentError);
          throw studentError;
        }

        // If not found by email, try by name if profile exists
        if (!studentData && profile?.first_name && profile?.last_name) {
          console.log("Trying to find student by name:", profile.first_name, profile.last_name);
          const { data: nameData, error: nameError } = await supabase
            .from('students')
            .select('id')
            .eq('first_name', profile.first_name)
            .eq('last_name', profile.last_name)
            .maybeSingle();

          if (nameError) {
            console.error("Error fetching student by name:", nameError);
            throw nameError;
          }

          studentData = nameData;
        }

        if (studentData) {
          console.log("Found student ID:", studentData.id);
          setStudentId(studentData.id);
        } else {
          const errorMsg = "No student record found for your account. Please contact your administrator.";
          console.error(errorMsg);
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error('Error fetching student information:', error);
        const errorMsg = "Failed to load student information. Please try again later.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentId();
  }, [user, userRole, profile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <PageTitle 
            title="Homework" 
            subtitle={userRole === 'tutor' 
              ? "Manage homework assignments and submissions" 
              : "View and submit your homework assignments"}
          />

          {isLoading ? (
            <div className="py-10 text-center">Loading...</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          ) : userRole === 'tutor' || userRole === 'admin' || userRole === 'owner' ? (
            <HomeworkManager />
          ) : userRole === 'student' && studentId ? (
            <StudentHomeworkView studentId={studentId} />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Error</AlertTitle>
              <AlertDescription>
                Unable to determine your role or student information. Please contact support.
              </AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    </div>
  );
};

export default Homework;
