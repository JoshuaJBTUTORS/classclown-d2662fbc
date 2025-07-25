import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Users,
  UserCheck,
  GraduationCap,
  FileText,
  TrendingUp,
  BarChart3,
  Clock,
  ClipboardList,
  Video,
  X,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatModal from '@/components/chat/ChatModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin, isOwner, isTutor, isParent, isStudent, isLearningHubOnly } = useAuth();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const menuItems = [
    {
      icon: Calendar,
      label: 'Calendar',
      href: '/calendar',
      roles: ['admin', 'owner', 'tutor', 'parent', 'student'],
    },
    {
      icon: Users,
      label: isParent ? 'My Children' : 'Clients',
      href: '/students',
      roles: ['admin', 'owner', 'parent'],
    },
    {
      icon: UserCheck,
      label: 'Tutors',
      href: '/tutors',
      roles: ['admin', 'owner'],
    },
    {
      icon: GraduationCap,
      label: 'Lesson Plans',
      href: '/lesson-plans',
      roles: ['admin', 'owner', 'tutor'],
    },
    {
      icon: FileText,
      label: 'Homework',
      href: '/homework',
      roles: ['admin', 'owner', 'tutor', 'parent', 'student'],
    },
    {
      icon: TrendingUp,
      label: 'Progress',
      href: '/progress',
      roles: ['admin', 'owner', 'parent', 'student'],
    },
    {
      icon: BarChart3,
      label: 'Reports',
      href: '/reports',
      roles: ['admin', 'owner'],
    },
    {
      icon: Clock,
      label: 'Time Off',
      href: '/time-off',
      roles: ['tutor'],
    },
    {
      icon: ClipboardList,
      label: 'Time Off Requests',
      href: '/time-off-requests',
      roles: ['admin', 'owner'],
    },
    {
      icon: Video,
      label: 'Trial Bookings',
      href: '/trial-bookings',
      roles: ['admin', 'owner'],
    },
    {
      icon: Building2,
      label: 'Learning Hub',
      href: '/learning-hub',
      roles: ['admin', 'owner', 'tutor', 'parent', 'student', 'learning_hub_only'],
    },
    {
      icon: MessageSquare,
      label: 'Team Chat',
      href: '#',
      roles: ['admin', 'owner', 'tutor'],
      onClick: () => setIsChatModalOpen(true),
    },
  ];

  const getCurrentUserRole = () => {
    if (isOwner) return 'owner';
    if (isAdmin) return 'admin';
    if (isTutor) return 'tutor';
    if (isParent) return 'parent';
    if (isStudent) return 'student';
    if (isLearningHubOnly) return 'learning_hub_only';
    return null;
  };

  const currentUserRole = getCurrentUserRole();
  const filteredMenuItems = menuItems.filter(item => 
    currentUserRole && item.roles.includes(currentUserRole)
  );

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
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
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

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-3">
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    {item.href === '#' ? (
                      <button
                        onClick={() => {
                          item.onClick?.();
                          onClose();
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                          'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
