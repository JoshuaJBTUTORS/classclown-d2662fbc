import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DomainSEO } from '@/components/seo/DomainSEO';

const MainLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <DomainSEO />
      <div className="min-h-screen bg-gray-50 flex w-full relative">
        <Outlet />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;