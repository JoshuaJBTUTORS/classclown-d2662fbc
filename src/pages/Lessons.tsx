
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Plus, 
  Calendar as CalendarIcon,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Lessons = () => {
  const { userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const [isAddingLesson, setIsAddingLesson] = useState(false);

  // Check if user is a student
  const isStudent = userRole === 'student';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleAddLessonSuccess = () => {
    toast.success('Lesson added successfully!');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 w-full",
        "lg:ml-0",
        sidebarOpen && "lg:ml-64"
      )}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Lessons" 
              subtitle="Manage tuition sessions via calendar"
              className="mb-4 md:mb-0"
            />
            {/* Only show action buttons for non-students */}
            {!isStudent && (
              <div className="flex items-center gap-2">
                <Button className="flex items-center gap-2" onClick={() => setIsAddingLesson(true)}>
                  <Plus className="h-4 w-4" />
                  New Lesson
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Calendar View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage all lessons in a calendar format
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/calendar'}
                >
                  Open Calendar
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Lesson Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Access structured lesson plans and teaching materials
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/lesson-plans'}
                >
                  View Plans
                </Button>
              </CardContent>
            </Card>

            {!isStudent && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create new lessons and manage schedules
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => setIsAddingLesson(true)}
                  >
                    Add New Lesson
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Only show Add Lesson Dialog for non-students */}
      {!isStudent && (
        <AddLessonForm 
          isOpen={isAddingLesson} 
          onClose={() => setIsAddingLesson(false)}
          onSuccess={handleAddLessonSuccess}
        />
      )}
    </div>
  );
};

export default Lessons;
