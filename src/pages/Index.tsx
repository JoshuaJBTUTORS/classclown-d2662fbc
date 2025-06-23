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
              <Card className="lg:col-span-2 card-hover border-gray-200 shadow-[var(--shadow-card)]">
                <CardHeader className="pb-4 bg-gradient-to-r from-[hsl(var(--deep-purple-blue))]/10 to-[hsl(var(--medium-blue))]/10">
                  <CardTitle className="font-playfair text-2xl text-[hsl(var(--deep-purple-blue))]">Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(var(--light-green))]/5 to-[hsl(var(--cyan-blue))]/5 rounded-lg border border-gray-100">
                  <p className="text-[hsl(var(--deep-purple-blue))] text-sm font-medium">Activity chart will be shown here</p>
                </CardContent>
              </Card>
              <Card className="card-hover border-gray-200 shadow-[var(--shadow-card)]">
                <CardHeader className="pb-4 bg-gradient-to-r from-[hsl(var(--cyan-blue))]/10 to-[hsl(var(--light-green))]/10">
                  <CardTitle className="font-playfair text-2xl text-[hsl(var(--cyan-blue))]">Student Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(var(--medium-blue))]/5 to-[hsl(var(--medium-green))]/5 rounded-lg border border-gray-100">
                  <p className="text-[hsl(var(--cyan-blue))] text-sm font-medium">Distribution chart will be shown here</p>
                </CardContent>
              </Card>
              <UpcomingSessions />
              <Card className="lg:col-span-2 card-hover border-gray-200 shadow-[var(--shadow-card)]">
                <CardHeader className="pb-4 bg-gradient-to-r from-[hsl(var(--medium-green))]/10 to-[hsl(var(--bright-green))]/10">
                  <CardTitle className="font-playfair text-2xl text-[hsl(var(--medium-green))]">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(var(--light-green))]/5 to-[hsl(var(--deep-purple-blue))]/5 rounded-lg border border-gray-100">
                  <p className="text-[hsl(var(--medium-green))] text-sm font-medium">Activity log will be shown here</p>
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
