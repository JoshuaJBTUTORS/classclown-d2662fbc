
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import ProgressChart from '@/components/progress/ProgressChart';
import AttendanceChart from '@/components/progress/AttendanceChart';
import ProgressSummary from '@/components/progress/ProgressSummary';
import ProgressFilters from '@/components/progress/ProgressFilters';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface ProgressFilters {
  dateRange: { from: Date | null; to: Date | null };
  selectedStudents: string[];
  selectedSubjects: string[];
  selectedChild: string; // Add selectedChild for parent filtering
}

const Progress: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState<ProgressFilters>({
    dateRange: { from: null, to: null },
    selectedStudents: [],
    selectedSubjects: [],
    selectedChild: 'all' // Default to all children
  });

  const { userRole, user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFiltersChange = (newFilters: Partial<ProgressFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Check if user has access to progress tracking - now includes parents
  if (userRole !== 'student' && userRole !== 'owner' && userRole !== 'parent') {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'}`}>
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
      </div>
    );
  }

  const getPageTitle = () => {
    if (userRole === 'parent') {
      return "Your Children's Progress";
    } else if (userRole === 'student') {
      return "Your Progress";
    } else {
      return "Progress Tracking";
    }
  };

  const getSubtitle = () => {
    if (userRole === 'parent') {
      return "Track your children's homework and attendance progress";
    } else if (userRole === 'student') {
      return "View your homework and attendance progress";
    } else {
      return "Track student progress and performance analytics";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'}`}>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProgressChart 
                filters={filters}
                userRole={userRole}
              />
              
              <AttendanceChart 
                filters={filters}
                userRole={userRole}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Progress;
