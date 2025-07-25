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
  ChevronDown,
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin, isOwner, isTutor, isParent, isStudent, isLearningHubOnly } = useAuth();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

  const getGroupLabelByRole = (defaultLabel: string, userRole: string | null): string => {
    // Keep original labels for admins and owners
    if (userRole === 'admin' || userRole === 'owner') {
      return defaultLabel;
    }
    
    // Use new labels for tutors, parents, and students
    switch (defaultLabel) {
      case 'Core Operations':
        return 'Lesson Management';
      case 'People Management':
        return 'Admin Support';
      case 'Business Development':
        return 'Extra Support';
      default:
        return defaultLabel;
    }
  };

  const currentUserRole = getCurrentUserRole();
  
  const filteredMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      currentUserRole && item.roles.includes(currentUserRole)
    )
  })).filter(group => group.items.length > 0);

  // Check if current route is in a group to keep it expanded
  const getGroupHasActiveRoute = (group: typeof filteredMenuGroups[0]) => {
    return group.items.some(item => location.pathname === item.href);
  };

  // Initialize expanded state for groups with active routes
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    filteredMenuGroups.forEach(group => {
      const hasActiveRoute = getGroupHasActiveRoute(group);
      if (hasActiveRoute && expandedGroups[group.label] === undefined) {
        initialExpanded[group.label] = true;
      }
    });
    
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedGroups(prev => ({ ...prev, ...initialExpanded }));
    }
  }, [location.pathname, filteredMenuGroups]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

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

          <SidebarContent className="flex-1 overflow-y-auto py-4">
            {filteredMenuGroups.map((group, groupIndex) => {
              const isExpanded = expandedGroups[group.label] ?? getGroupHasActiveRoute(group);
              
              return (
                <div key={group.label}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.label)}>
                    <SidebarGroup>
                      <CollapsibleTrigger asChild>
                        <button className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-200 ease-in-out group",
                          "hover:bg-primary/10 hover:text-primary hover:scale-[1.02] hover:shadow-sm",
                          "active:scale-[0.98] active:bg-primary/20",
                          isExpanded 
                            ? "bg-primary/10 text-primary shadow-sm" 
                            : "text-muted-foreground"
                        )}>
                           <span className="transition-all duration-200 group-hover:tracking-wide">
                             {getGroupLabelByRole(group.label, currentUserRole)}
                           </span>
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:scale-110" />
                          ) : (
                            <ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:scale-110" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="overflow-hidden transition-all duration-200 ease-out data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <div className="space-y-1 pb-2">
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
                        </div>
                      </CollapsibleContent>
                    </SidebarGroup>
                  </Collapsible>
                  
                  {groupIndex < filteredMenuGroups.length - 1 && isExpanded && 
                    filteredMenuGroups.slice(groupIndex + 1).some((nextGroup) => 
                      expandedGroups[nextGroup.label] ?? getGroupHasActiveRoute(nextGroup)
                    ) && (
                    <SidebarSeparator className="mx-3 my-4" />
                  )}
                </div>
              );
            })}
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
