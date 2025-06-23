
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import ReportFilters from '@/components/reports/ReportFilters';
import TutorHoursReport from '@/components/reports/TutorHoursReport';
import StudentAbsenceReport from '@/components/reports/StudentAbsenceReport';
import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
import PayrollSummaryReport from '@/components/reports/PayrollSummaryReport';
import { cn } from '@/lib/utils';

interface ReportFilters {
  dateRange: { from: Date | null; to: Date | null };
  selectedTutors: string[];
  selectedSubjects: string[];
}

const Reports: React.FC = () => {
  // Responsive sidebar state - start closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return false;
  });
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: { from: null, to: null },
    selectedTutors: [],
    selectedSubjects: []
  });

  const { userRole } = useAuth();

  // Handle window resize to adjust sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (!isDesktop && sidebarOpen) {
        setSidebarOpen(false); // Auto-close on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleFiltersChange = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Check if user has access to reports
  if (userRole !== 'owner') {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className={cn(
          "flex flex-col flex-1 transition-all duration-300 w-full",
          "lg:ml-0",
          sidebarOpen && "lg:ml-64"
        )}>
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You don't have permission to view reports.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 w-full",
        "lg:ml-0",
        sidebarOpen && "lg:ml-64"
      )}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-8">
          <PageTitle 
            title="Reports" 
            subtitle="Track tutor hours, student attendance analytics, and payroll calculations"
          />

          <div className="space-y-8">
            <ReportFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />

            <ReportSummaryCards filters={filters} />

            <Tabs defaultValue="tutor-hours" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tutor-hours">Tutor Hours</TabsTrigger>
                <TabsTrigger value="student-absence">Student Absences</TabsTrigger>
                <TabsTrigger value="payroll-summary">Payroll Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tutor-hours" className="mt-6">
                <TutorHoursReport filters={filters} />
              </TabsContent>
              
              <TabsContent value="student-absence" className="mt-6">
                <StudentAbsenceReport filters={filters} />
              </TabsContent>
              
              <TabsContent value="payroll-summary" className="mt-6">
                <PayrollSummaryReport filters={filters} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
