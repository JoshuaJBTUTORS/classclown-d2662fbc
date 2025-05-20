
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import HomeworkManager from '@/components/homework/HomeworkManager';
import StudentHomeworkView from '@/components/homework/StudentHomeworkView';
import { supabase } from '@/integrations/supabase/client';

const Homework: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<'tutor' | 'student' | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);

  useEffect(() => {
    // For demonstration purposes, we'll detect role based on the user's email
    // In a real app, this would be based on proper authentication
    const checkUserRole = async () => {
      // Check if user is a tutor
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('id')
        .limit(1);
      
      if (!tutorError && tutorData && tutorData.length > 0) {
        setUserRole('tutor');
        return;
      }

      // Check if user is a student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .limit(1);
      
      if (!studentError && studentData && studentData.length > 0) {
        setUserRole('student');
        setStudentId(studentData[0].id);
        return;
      }

      // Default to tutor role if no match is found
      setUserRole('tutor');
    };

    checkUserRole();
  }, []);

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
          </div>

          {userRole === 'tutor' ? (
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
