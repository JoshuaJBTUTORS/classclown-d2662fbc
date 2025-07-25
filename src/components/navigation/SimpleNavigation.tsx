import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  FileText,
  TrendingUp,
  Building2,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface SimpleNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimpleNavigation: React.FC<SimpleNavigationProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isParent, isStudent } = useAuth();

  // Simple navigation items for parents and students
  const getNavigationItems = () => {
    const commonItems = [
      {
        icon: Calendar,
        label: 'Calendar',
        href: '/calendar',
      },
      {
        icon: FileText,
        label: 'Homework',
        href: '/homework',
      },
      {
        icon: Building2,
        label: 'Learning Hub',
        href: '/learning-hub',
      },
      {
        icon: TrendingUp,
        label: 'Progress',
        href: '/progress',
      },
    ];

    if (isParent) {
      return [
        ...commonItems.slice(0, 2), // Calendar, Homework
        {
          icon: Users,
          label: 'My Children',
          href: '/students',
        },
        ...commonItems.slice(2), // Learning Hub, Progress
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png" 
                alt="JB Tutors Logo" 
                className="h-8 w-8 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Classclown</span>
                <span className="text-xs text-gray-500">powered by JB Tutors</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Simple Navigation */}
          <SidebarContent className="flex-1 overflow-y-auto py-6">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link
                            to={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200"
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </div>
      </aside>
    </>
  );
};

export default SimpleNavigation;