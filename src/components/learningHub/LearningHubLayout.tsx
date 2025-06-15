
// Wrap everything in SidebarProvider
// Move SidebarTrigger into the layout (with mobile styles)
// Use a full-width flex container for layout

import React from 'react';
import { Outlet } from 'react-router-dom';
import LearningHubSidebar from './LearningHubSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const LearningHubLayout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <LearningHubSidebar />
        <main className="flex-1 overflow-auto">
          {/* Hamburger menu trigger for mobile */}
          {isMobile && (
            <div className="fixed top-4 left-4 z-50 block md:hidden">
              <SidebarTrigger />
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default LearningHubLayout;

