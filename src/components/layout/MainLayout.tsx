import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import SimpleNavigation from '@/components/navigation/SimpleNavigation';

const MainLayout: React.FC = () => {
  const { isParent, isStudent } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Use simple navigation for parents and students
  const useSimpleNavigation = isParent || isStudent;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full relative">
        {/* Navigation Bar */}
        <Navbar 
          toggleSidebar={() => setIsSidebarOpen(true)} 
        />
        
        {/* Conditional Sidebar */}
        {useSimpleNavigation ? (
          <SimpleNavigation 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        ) : (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;