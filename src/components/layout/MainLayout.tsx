import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DomainSEO } from '@/components/seo/DomainSEO';
import { LessonStartPopup } from '@/components/lessons/LessonStartPopup';

const MainLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <DomainSEO />
      <div className="min-h-screen bg-background flex w-full relative">
        <Outlet />
      </div>
      <LessonStartPopup />
    </SidebarProvider>
  );
};

export default MainLayout;