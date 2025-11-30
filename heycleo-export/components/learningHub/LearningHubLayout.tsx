import React from 'react';
import { Outlet } from 'react-router-dom';
import LearningHubSidebar from './LearningHubSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DomainSEO } from '@/components/seo/DomainSEO';

const LearningHubLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <DomainSEO />
      <div className="min-h-screen flex w-full relative" style={{ backgroundColor: 'hsl(var(--background-cream))' }}>
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
