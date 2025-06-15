import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Library,
  GraduationCap,
  Home,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/learning-hub',
    icon: LayoutDashboard,
    exact: true
  },
  {
    title: 'My Courses',
    href: '/learning-hub/my-courses',
    icon: BookOpen
  },
  {
    title: 'Assessments',
    href: '/learning-hub/assessments',
    icon: Brain
  },
  {
    title: 'Revision Calendar',
    href: '/learning-hub/revision',
    icon: Calendar
  },
  {
    title: 'Progress',
    href: '/learning-hub/progress',
    icon: TrendingUp
  },
  {
    title: 'Course Library',
    href: '/learning-hub/library',
    icon: Library
  }
];

const LearningHubSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Learning Hub</h2>
            <p className="text-sm text-gray-600">Your Education Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href)}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="my-2" />

        {/* Footer */}
        <SidebarFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Main App
            </Link>
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
};

export default LearningHubSidebar;
