
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import UpcomingSessions from '@/components/dashboard/UpcomingSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-0">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <PageTitle 
            title="Dashboard" 
            subtitle="Welcome to Class Clown - Built by JB Tutors. Your premium tuition service management platform."
          />
          <div className="space-y-6">
            <DashboardMetrics />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2 card-hover border border-border/40 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="font-playfair text-xl">Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted/10 rounded-md">
                  <p className="text-muted-foreground text-sm">Activity chart will be shown here</p>
                </CardContent>
              </Card>
              <Card className="card-hover border border-border/40 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="font-playfair text-xl">Student Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted/10 rounded-md">
                  <p className="text-muted-foreground text-sm">Distribution chart will be shown here</p>
                </CardContent>
              </Card>
              <UpcomingSessions />
              <Card className="lg:col-span-2 card-hover border border-border/40 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="font-playfair text-xl">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted/10 rounded-md">
                  <p className="text-muted-foreground text-sm">Activity log will be shown here</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
