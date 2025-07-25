import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';

const MainLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full relative">
        <Outlet />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;