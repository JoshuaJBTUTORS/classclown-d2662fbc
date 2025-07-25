import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import PageTitle from '@/components/ui/PageTitle';
import DashboardMetrics from './DashboardMetrics';
import UpcomingSessions from './UpcomingSessions';
import TrialBookingsWidget from './TrialBookingsWidget';
import TimeOffRequestsWidget from './TimeOffRequestsWidget';
import AdminStatsCards from './AdminStatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background to-muted/30">
      <div className={cn("flex-1 flex flex-col", sidebarOpen && "md:ml-0")}>
        <main className="flex-1 p-6 space-y-6">
          <PageTitle title="Admin Dashboard" subtitle="Welcome back! Here's what's happening today." />
          
          {/* Enhanced Admin Stats */}
          <AdminStatsCards />
          
          {/* Quick Access Widgets */}
          <div className="grid gap-6 md:grid-cols-2">
            <TrialBookingsWidget />
            <TimeOffRequestsWidget />
          </div>
          
          {/* Charts and Sessions */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Activity Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Student Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Distribution Chart</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming Sessions */}
          <UpcomingSessions />
        </main>
      </div>
    </div>
  );
}