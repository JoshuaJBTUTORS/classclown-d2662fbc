
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { BookOpen } from 'lucide-react';

import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import HomeworkManager from '@/components/homework/HomeworkManager';
import StudentHomeworkView from '@/components/homework/StudentHomeworkView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Homework: React.FC = () => {
  const { isLearningHubOnly } = useAuth();
  const { openBookingModal } = useTrialBooking();

  // If user has learning_hub_only role, show locked feature
  if (isLearningHubOnly) {
    return (
      <LockedFeature
        featureName="Homework & Assignments"
        featureIcon={<BookOpen className="h-16 w-16 text-gray-300" />}
        description="Access homework assignments, submit work, and track your progress with personalized feedback from tutors."
      />
    );
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [students, setStudents] = useState<{id: number, first_name: string, last_name: string}[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userRole, user, profile, parentProfile } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user || (!['student', 'parent'].includes(userRole || ''))) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching student ID for user:", user.email, "Role:", userRole);
        
        if (userRole === 'student') {
          // For students, find their student record
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
            setStudents([{id: studentData.id, first_name: '', last_name: ''}]);
            setSelectedStudentId(studentData.id);
          } else {
            const errorMsg = "No student record found for your account. Please contact your administrator.";
            console.error(errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
          }
        } else if (userRole === 'parent') {
          // For parents, find all their associated students
          if (!parentProfile?.id) {
            const errorMsg = "Parent profile not found. Please contact your administrator.";
            console.error(errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
            return;
          }

          console.log("Looking for students associated with parent:", parentProfile.id);
          const { data: studentsData, error: studentError } = await supabase
            .from('students')
            .select('id, first_name, last_name')
            .eq('parent_id', parentProfile.id)
            .order('first_name');

          if (studentError) {
            console.error("Error fetching students for parent:", studentError);
            throw studentError;
          }

          if (studentsData && studentsData.length > 0) {
            console.log("Found students for parent:", studentsData);
            setStudents(studentsData);
            setSelectedStudentId(studentsData[0].id); // Default to first student
          } else {
            const errorMsg = "No students found associated with your parent account. Please contact your administrator.";
            console.error(errorMsg);
            setError(errorMsg);
            toast.error(errorMsg);
          }
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
  }, [user, userRole, profile, parentProfile]);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <PageTitle 
            title="Homework" 
            subtitle={userRole === 'tutor' || userRole === 'admin' || userRole === 'owner'
              ? "Manage homework assignments and submissions" 
              : userRole === 'parent'
                ? "View your child's homework assignments"
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
          ) : (userRole === 'student' || userRole === 'parent') && selectedStudentId ? (
            <>
              {userRole === 'parent' && students.length > 1 && (
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Select Child:</label>
                  <select 
                    value={selectedStudentId} 
                    onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                    className="w-full max-w-xs p-2 border border-input bg-background rounded-md"
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <StudentHomeworkView studentId={selectedStudentId} />
            </>
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
    </>
  );
};

export default Homework;
