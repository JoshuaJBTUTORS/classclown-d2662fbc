
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const Index = () => {
  // Responsive sidebar state - start closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return false;
  });

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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 w-full",
        "lg:ml-0",
        sidebarOpen && "lg:ml-64"
      )}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div>
            <PageTitle 
              title="Dashboard" 
              subtitle="Welcome to Class Clown - Your premium tuition service management platform."
            />
          </div>
          <div className="space-y-8">
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
              <Card className="card-hover border-gray-200 shadow-[var(--shadow-card)]">
                <CardHeader className="pb-4 bg-gradient-to-r from-[hsl(var(--medium-green))]/10 to-[hsl(var(--bright-green))]/10">
                  <CardTitle className="font-playfair text-2xl text-[hsl(var(--medium-green))]">Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gradient-to-br from-[hsl(var(--light-green))]/5 to-[hsl(var(--deep-purple-blue))]/5 rounded-lg border border-gray-100">
                  <p className="text-[hsl(var(--medium-green))] text-sm font-medium">Upcoming sessions will be shown here</p>
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
