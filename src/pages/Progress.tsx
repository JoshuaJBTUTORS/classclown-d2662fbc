
import React, { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import ProgressChart from '@/components/progress/ProgressChart';
import AttendanceChart from '@/components/progress/AttendanceChart';
import AssessmentProgressChart from '@/components/progress/AssessmentProgressChart';
import ProgressSummary from '@/components/progress/ProgressSummary';
import ProgressFilters from '@/components/progress/ProgressFilters';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressFilters {
  dateRange: { from: Date | null; to: Date | null };
  selectedStudents: string[];
  selectedSubjects: string[];
}

const Progress: React.FC = () => {
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  
  const [filters, setFilters] = useState<ProgressFilters>({
    dateRange: { from: null, to: null },
    selectedStudents: [],
    selectedSubjects: []
  });

  const { userRole, user } = useAuth();

  const closeSidebar = () => {
    if (sidebarOpen) {
      toggleSidebar();
    }
  };

  const handleFiltersChange = (newFilters: Partial<ProgressFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Check if user has access to progress tracking
  if (userRole !== 'student' && userRole !== 'owner' && userRole !== 'parent') {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 w-full">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have permission to view progress tracking.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </>
    );
  }

  const getPageTitle = () => {
    if (userRole === 'parent') {
      return "Your Progress";
    } else if (userRole === 'student') {
      return "Your Progress";
    } else {
      return "Progress Tracking";
    }
  };

  const getSubtitle = () => {
    if (userRole === 'parent') {
      return "Track your homework, attendance, and assessment progress";
    } else if (userRole === 'student') {
      return "View your homework, attendance, and assessment progress";
    } else {
      return "Track student progress and performance analytics";
    }
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-8">
          <PageTitle 
            title={getPageTitle()}
            subtitle={getSubtitle()}
          />

          <div className="space-y-8">
            <ProgressFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              userRole={userRole}
            />

            <ProgressSummary 
              filters={filters}
              userRole={userRole}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <ProgressChart 
                filters={filters}
                userRole={userRole}
              />
              
              <AttendanceChart 
                filters={filters}
                userRole={userRole}
              />

              <AssessmentProgressChart 
                filters={filters}
                userRole={userRole}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Progress;
