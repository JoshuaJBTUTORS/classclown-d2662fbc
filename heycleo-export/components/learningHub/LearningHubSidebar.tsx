
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Video } from 'lucide-react';
import LiveTutoringUpgradeModal from './LiveTutoringUpgradeModal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import cleoLogo from '@/assets/cleo-logo.png';
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
    href: '/heycleo',
    emoji: '🏠'
  },
  {
    title: 'My Courses',
    href: '/heycleo/my-courses',
    emoji: '📖'
  },
  {
    title: "Cleo's Corner",
    href: '/heycleo/assessments',
    emoji: '✨'
  },
  {
    title: 'My Cleo ID',
    href: '/heycleo/cleo-id',
    emoji: '👨‍🎓'
  },
  {
    title: 'Subscription',
    href: '/heycleo/subscription',
    emoji: '💳'
  },
  {
    title: 'Settings',
    href: '/heycleo/settings',
    emoji: '⚙️'
  }
];

const LearningHubSidebar = () => {
  const location = useLocation();
  const { userRole } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasLiveTutoringAccess = userRole === 'parent' || userRole === 'student' || userRole === 'admin' || userRole === 'owner' || userRole === 'tutor';

  // Show all navigation items for Class Beyond
  const visibleNavigationItems = navigationItems;

  const handleLiveTutoringClick = (e: React.MouseEvent) => {
    if (!hasLiveTutoringAccess) {
      e.preventDefault();
      setShowUpgradeModal(true);
    }
  };

  const isActive = (href: string) => {
    if (href === '/heycleo') {
      return location.pathname === href;
    }
    if (href === '/heycleo/my-courses') {
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
            <img src={cleoLogo} alt="Cleo" className="h-12 w-auto" />
            <div className="cleo-smiley">☺️</div>
          </div>

          {/* Navigation */}
          <nav className="cleo-nav">
            {visibleNavigationItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`cleo-nav-button ${isActive(item.href) ? 'is-active' : ''}`}
              >
                <span className="text-xl">{item.emoji}</span>
                <span>{item.title}</span>
              </Link>
            ))}

            {/* Live Tutoring Button - Opens external booking */}
            <button
              onClick={handleLiveTutoringClick}
              className="cleo-nav-button relative"
            >
              <span className="text-xl">💬</span>
              <span>Live Tutoring</span>
              <Lock className="h-4 w-4 ml-auto text-yellow-600" />
            </button>
          </nav>

          {/* Footer */}
          <div className="cleo-sidebar-footer">
            Cleo says: Strategist mode is your superpower 🧠💚
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
