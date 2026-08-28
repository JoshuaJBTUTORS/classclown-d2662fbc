
import React, { useState } from 'react';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import ProgressChart from '@/components/progress/ProgressChart';

import AssessmentProgressChart from '@/components/progress/AssessmentProgressChart';
import ProgressSummary from '@/components/progress/ProgressSummary';
import ProgressFilters from '@/components/progress/ProgressFilters';
import ProgressHero from '@/components/progress/ProgressHero';

import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface ProgressFilters {
  dateRange: { from: Date | null; to: Date | null };
  selectedStudents: string[];
  selectedSubjects: string[];
}

const Progress: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [filters, setFilters] = useState<ProgressFilters>({
    dateRange: { from: null, to: null },
    selectedStudents: [],
    selectedSubjects: []
  });

  const { userRole, user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
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
          <MobileMenuButton toggleSidebar={toggleSidebar} />
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
      return "Track your homework and assessment progress";
    } else if (userRole === 'student') {
      return "View your homework and assessment progress";
    } else {
      return "Track student progress and performance analytics";
    }
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 w-full">
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            <ProgressHero title={getPageTitle()} subtitle={getSubtitle()}>
              <ProgressFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                userRole={userRole}
              />
            </ProgressHero>

            <ProgressSummary filters={filters} userRole={userRole} />

            <ProgressChart filters={filters} userRole={userRole} />

            <AssessmentProgressChart filters={filters} userRole={userRole} />
          </div>
        </main>
      </div>
    </>
  );
};

export default Progress;

