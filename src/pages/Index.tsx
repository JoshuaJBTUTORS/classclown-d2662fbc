
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
    <div className="flex min-h-screen bg-white">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-0">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div>
            <PageTitle 
              title="Dashboard" 
              subtitle="Welcome to Class Clown - Your premium tuition service management platform."
            />
          </div>
          <div className="space-y-8">
            <DashboardMetrics />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2 card-hover border-[hsl(150,45%,85%)] shadow-[var(--shadow-card)]">
                <CardHeader className="pb-4">
                  <CardTitle className="font-playfair text-2xl luxury-gradient-text">Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(150,45%,98%)] to-[hsl(150,45%,95%)] rounded-lg border border-[hsl(150,45%,90%)]">
                  <p className="text-[hsl(180,58%,40%)] text-sm font-medium">Activity chart will be shown here</p>
                </CardContent>
              </Card>
              <Card className="card-hover border-[hsl(150,45%,85%)] shadow-[var(--shadow-card)]">
                <CardHeader className="pb-4">
                  <CardTitle className="font-playfair text-2xl luxury-gradient-text">Student Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(150,45%,98%)] to-[hsl(150,45%,95%)] rounded-lg border border-[hsl(150,45%,90%)]">
                  <p className="text-[hsl(180,58%,40%)] text-sm font-medium">Distribution chart will be shown here</p>
                </CardContent>
              </Card>
              <UpcomingSessions />
              <Card className="lg:col-span-2 card-hover border-[hsl(150,45%,85%)] shadow-[var(--shadow-card)]">
                <CardHeader className="pb-4">
                  <CardTitle className="font-playfair text-2xl luxury-gradient-text">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(150,45%,98%)] to-[hsl(150,45%,95%)] rounded-lg border border-[hsl(150,45%,90%)]">
                  <p className="text-[hsl(180,58%,40%)] text-sm font-medium">Activity log will be shown here</p>
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
