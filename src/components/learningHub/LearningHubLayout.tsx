// Wrap everything in SidebarProvider
// Move SidebarTrigger into the layout (with mobile styles)
// Use a full-width flex container for layout

import React from 'react';
import { Outlet } from 'react-router-dom';
import LearningHubSidebar from './LearningHubSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const LearningHubLayout: React.FC = () => {
  const isMobile = false; // Don't use useIsMobile anymore for trigger, let sidebar handle it via shadcn/ui

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full relative">
        {/* Make sure sidebar renders above main content for mobile */}
        <LearningHubSidebar />
        <main className="flex-1 overflow-auto relative z-0">
          {/* Hamburger menu trigger for mobile */}
          <div className="fixed top-4 left-4 z-30 block md:hidden">
            <SidebarTrigger />
          </div>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default LearningHubLayout;
