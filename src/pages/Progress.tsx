
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
}

const Progress: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState<ProgressFilters>({
    dateRange: { from: null, to: null },
    selectedStudents: [],
    selectedSubjects: []
  });

  const { userRole, user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFiltersChange = (newFilters: Partial<ProgressFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Check if user has access to progress tracking
  if (userRole !== 'student' && userRole !== 'owner') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex flex-col flex-1 lg:pl-64">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <PageTitle 
            title="Progress Tracking" 
            subtitle={userRole === 'owner' 
              ? "Track student progress and performance analytics" 
              : "View your homework and attendance progress"}
          />

          <div className="space-y-6">
            <ProgressFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              userRole={userRole}
            />

            <ProgressSummary 
              filters={filters}
              userRole={userRole}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
