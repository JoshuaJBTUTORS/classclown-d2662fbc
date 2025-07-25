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
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin, isOwner, isTutor, isParent, isStudent, isLearningHubOnly } = useAuth();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const menuGroups = [
    {
      label: 'Core Operations',
      items: [
        {
          icon: Calendar,
          label: 'Calendar',
          href: '/calendar',
          roles: ['admin', 'owner', 'tutor', 'parent', 'student'],
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
      ]
    },
    {
      label: 'People Management',
      items: [
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
          icon: ClipboardList,
          label: 'Time Off Requests',
          href: '/time-off-requests',
          roles: ['admin', 'owner'],
        },
        {
          icon: Clock,
          label: 'Time Off',
          href: '/time-off',
          roles: ['tutor'],
        },
        {
          icon: MessageSquare,
          label: 'Team Chat',
          href: '#',
          roles: ['admin', 'owner', 'tutor'],
          onClick: () => setIsChatModalOpen(true),
        },
      ]
    },
    {
      label: 'Business Development',
      items: [
        {
          icon: Building2,
          label: 'Learning Hub',
          href: '/learning-hub',
          roles: ['admin', 'owner', 'tutor', 'parent', 'student', 'learning_hub_only'],
        },
        {
          icon: Video,
          label: 'Trial Bookings',
          href: '/trial-bookings',
          roles: ['admin', 'owner'],
        },
      ]
    },
    {
      label: 'Analytics & Insights',
      items: [
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
      ]
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
  
  const filteredMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      currentUserRole && item.roles.includes(currentUserRole)
    )
  })).filter(group => group.items.length > 0);

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

          <SidebarContent className="flex-1 overflow-y-auto py-4">
            {filteredMenuGroups.map((group, groupIndex) => (
              <div key={group.label}>
                <SidebarGroup>
                  <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              {item.href === '#' ? (
                                <button
                                  onClick={() => {
                                    item.onClick?.();
                                    onClose();
                                  }}
                                  className="w-full flex items-center gap-3 text-left"
                                >
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </button>
                              ) : (
                                <Link
                                  to={item.href}
                                  onClick={onClose}
                                  className="flex items-center gap-3"
                                >
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.label}</span>
                                </Link>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                {groupIndex < filteredMenuGroups.length - 1 && (
                  <SidebarSeparator className="mx-3 my-4" />
                )}
              </div>
            ))}
          </SidebarContent>
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
