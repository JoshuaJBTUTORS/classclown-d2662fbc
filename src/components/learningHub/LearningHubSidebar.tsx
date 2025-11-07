
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
    title: 'My Courses',
    href: '/learning-hub/my-courses',
    emoji: '📖'
  },
  {
    title: "Cleo's Corner",
    href: '/learning-hub/assessments',
    emoji: '✨'
  },
  {
    title: 'My Cleo ID',
    href: '/learning-hub/settings',
    emoji: '👨‍🎓'
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

  const isActive = (href: string) => {
    if (href === '/learning-hub/my-courses') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <Sidebar collapsible="offcanvas" className="cleo-sidebar">
        <SidebarContent className="bg-transparent border-none shadow-none">
          {/* Header */}
          <div className="cleo-sidebar-header">
            <div className="cleo-logo">Cleo</div>
            <div className="cleo-smiley">☺️</div>
          </div>

          {/* Navigation */}
          <nav className="cleo-nav">
            {navigationItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`cleo-nav-button ${isActive(item.href) ? 'is-active' : ''}`}
              >
                <span className="text-xl">{item.emoji}</span>
                <span>{item.title}</span>
              </Link>
            ))}

            {/* Live Tutoring Button */}
            {hasLiveTutoringAccess ? (
              <Link
                to="/calendar"
                className="cleo-nav-button"
              >
                <span className="text-xl">💬</span>
                <span>Live Tutoring</span>
              </Link>
            ) : (
              <button
                onClick={handleLiveTutoringClick}
                className="cleo-nav-button relative"
              >
                <span className="text-xl">💬</span>
                <span>Live Tutoring</span>
                <Lock className="h-4 w-4 ml-auto text-yellow-600" />
              </button>
            )}
          </nav>

          {/* Footer */}
          <div className="cleo-sidebar-footer">
            Cleo says: Small steps, every day 💚
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Upgrade Modal */}
      <LiveTutoringUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
};

export default LearningHubSidebar;
