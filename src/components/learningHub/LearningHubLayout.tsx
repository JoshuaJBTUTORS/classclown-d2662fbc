
import React from 'react';
import { Outlet } from 'react-router-dom';
import LearningHubSidebar from './LearningHubSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const LearningHubLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full relative">
        <LearningHubSidebar />
        <main className="flex-1 overflow-auto relative z-0">
          {/* Hamburger menu trigger for mobile */}
          <div className="fixed top-4 left-4 z-30 block md:hidden">
            <SidebarTrigger />
          </div>
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default LearningHubLayout;
