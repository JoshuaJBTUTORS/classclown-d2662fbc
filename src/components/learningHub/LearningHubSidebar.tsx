
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Video } from 'lucide-react';
import LiveTutoringUpgradeModal from './LiveTutoringUpgradeModal';
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

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/learning-hub',
    emoji: '📊',
    exact: true
  },
  {
    title: 'My Courses',
    href: '/learning-hub/my-courses',
    emoji: '📚'
  },
  {
    title: 'Browse Courses',
    href: '/learning-hub/courses',
    emoji: '🔍'
  },
  {
    title: 'My Cleo',
    href: '/learning-hub/assessments',
    emoji: '🤖'
  },
  {
    title: 'Settings',
    href: '/learning-hub/settings',
    emoji: '⚙️'
  }
];

const LearningHubSidebar = () => {
  const location = useLocation();
  const { userRole } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasLiveTutoringAccess = userRole === 'parent' || userRole === 'student' || userRole === 'admin' || userRole === 'owner' || userRole === 'tutor';

  const handleLiveTutoringClick = (e: React.MouseEvent) => {
    if (!hasLiveTutoringAccess) {
      e.preventDefault();
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-white border-r border-gray-200 shadow-lg z-20 min-h-screen md:min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <img 
            src="/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png" 
            alt="ClassClown Logo" 
            className="h-8 w-8 object-contain"
          />
          <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--cleo-green))' }}>Cleo</h2>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 p-4">
              {navigationItems.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href)}
                    className="py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Link to={item.href} className="flex items-center gap-3 text-base">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Live Tutoring Menu Item */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild={hasLiveTutoringAccess}
                  onClick={handleLiveTutoringClick}
                  className={`py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors ${!hasLiveTutoringAccess ? 'cursor-pointer' : ''}`}
                >
                  {hasLiveTutoringAccess ? (
                    <Link to="/calendar" className="flex items-center gap-3 text-base">
                      <span className="text-2xl">🎥</span>
                      <span className="font-medium">Live Tutoring</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 text-base">
                      <span className="text-2xl">🎥</span>
                      <span className="font-medium">Live Tutoring</span>
                      <Lock className="h-4 w-4 ml-auto text-yellow-600" />
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="my-2" />

        {/* Footer */}
      </SidebarContent>

      {/* Upgrade Modal */}
      <LiveTutoringUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </Sidebar>
    </>
  );
};

export default LearningHubSidebar;
