import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import classclownWordmark from '@/assets/classclown-wordmark.png.asset.json';
import SidebarProfile from '@/components/navigation/SidebarProfile';



import { heyCleoRedirectService } from '@/services/heyCleoRedirectService';

/** Simple rounded dot used as the sidebar menu icon for all items except HeyCleo. */
const Dot: React.FC<{ className?: string }> = ({ className }) => (
  <span className={cn('block h-1.5 w-1.5 rounded-full bg-current', className)} />
);

const GROUP_TONES = [
  { bg: 'bg-pastel-mint', text: 'text-pastel-mint-foreground', soft: 'hover:bg-pastel-mint/50' },
  { bg: 'bg-pastel-lilac', text: 'text-pastel-lilac-foreground', soft: 'hover:bg-pastel-lilac/50' },
  { bg: 'bg-pastel-butter', text: 'text-pastel-butter-foreground', soft: 'hover:bg-pastel-butter/50' },
  { bg: 'bg-pastel-sky', text: 'text-pastel-sky-foreground', soft: 'hover:bg-pastel-sky/50' },
  { bg: 'bg-pastel-blush', text: 'text-pastel-blush-foreground', soft: 'hover:bg-pastel-blush/50' },
  { bg: 'bg-pastel-sand', text: 'text-pastel-sand-foreground', soft: 'hover:bg-pastel-sand/50' },
];


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin, isOwner, isTutor, isParent, isStudent, isLearningHubOnly, hasCleoHubAccess } = useAuth();
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const menuGroups = [
    {
      label: 'Core Operations',
      items: [
  {
    icon: () => <span className="text-xl">👋</span>,
    label: 'HeyCleo',
    href: '#',
    roles: ['admin', 'owner', 'tutor', 'parent', 'student'],
    onClick: () => heyCleoRedirectService.redirectToHeyCleo(),
  },
        {
          icon: Calendar,
          label: 'Cleo Calendar',
          href: '/calendar',
          roles: ['admin', 'owner', 'tutor', 'parent', 'student'],
        },
        {
          icon: GraduationCap,
          label: 'Cleo Lesson Plans',
          href: '/lesson-plans',
          roles: ['admin', 'owner', 'tutor', 'parent', 'student', 'learning_hub_only'],
        },
        {
          icon: FileText,
          label: 'Homework',
          href: '/homework',
          roles: ['admin', 'owner'],
        },
        {
          icon: ClipboardCheck,
          label: 'Cleo Assessment Center',
          href: '/assessment-center',
          roles: ['admin', 'owner', 'tutor', 'parent', 'student'],
        },
        {
          icon: Video,
          label: 'Cleo Lesson Summaries',
          href: '/lesson-summaries',
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
          icon: GraduationCap,
          label: 'Students',
          href: '/students-list',
          roles: ['admin', 'owner'],
        },
        {
          icon: UserCheck,
          label: 'Tutors',
          href: '/tutors',
          roles: ['admin', 'owner'],
        },
        {
          icon: UserPlus,
          label: 'Staff',
          href: '/staff',
          roles: ['owner'],
        },
        {
          icon: ClipboardList,
          label: 'Time Off Requests',
          href: '/time-off-requests',
          roles: ['admin', 'owner'],
        },
        {
          icon: MessageSquare,
          label: 'Topic Requests',
          href: '/topic-requests',
          roles: ['admin', 'owner'],
        },
        {
          icon: Clock,
          label: 'Time Off',
          href: '/time-off',
          roles: ['tutor'],
        },
      ]
    },
    {
      label: 'Business Development',
      items: [
        {
          icon: Video,
          label: 'Trial Bookings',
          href: '/trial-bookings',
          roles: ['admin', 'owner'],
        },
        {
          icon: Users,
          label: 'Referrals',
          href: '/referrals',
          roles: ['admin', 'owner'],
        },

        {
          icon: FileSignature,
          label: 'Lesson Proposals',
          href: '/admin/proposals',
          roles: ['admin', 'owner'],
        },
        {
          icon: Film,
          label: 'Content Creation',
          href: '/tutor-content',
          roles: ['tutor'],
        },
      ]
    },
    {
      label: 'Analytics & Insights',
      items: [
        {
          icon: LayoutDashboard,
          label: 'Admin Dashboard',
          href: '/admin-dashboard',
          roles: ['admin', 'owner'],
        },
        {
          icon: Target,
          label: 'Goals',
          href: '/goals',
          roles: ['admin', 'owner'],
        },
        {
          icon: Radio,
          label: 'Live Sessions',
          href: '/admin/live-sessions',
          roles: ['admin', 'owner'],
        },
        {
          icon: BookOpen,
          label: 'HeyCleo Data',
          href: '/admin/heycleo-data',
          roles: ['admin', 'owner'],
        },

        {
          icon: DollarSign,
          label: 'Earnings',
          href: '/earnings',
          roles: ['tutor'],
        },
        {
          icon: TrendingUp,
          label: 'Admin Earnings',
          href: '/admin-earnings',
          roles: ['admin', 'owner'],
        },
        {
          icon: TrendingUp,
          label: 'Progress',
          href: '/progress',
          roles: ['admin', 'owner', 'parent', 'student'],
        },
        {
          icon: BookOpen,
          label: 'School Progress',
          href: '/school-progress',
          roles: ['admin', 'owner', 'parent', 'student'],
        },
        {
          icon: BarChart3,
          label: 'Reports',
          href: '/reports',
          roles: ['admin', 'owner'],
        },
        {
          icon: ClipboardList,
          label: 'Assessment Assignments',
          href: '/assessment-assignments',
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
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-background border-r border-border/40 transform transition-transform duration-300 ease-in-out z-50',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-3">
          {/* Brand header */}
          <div className="relative px-2 pt-3 pb-5 mb-1">
            <ScribbleStroke className="pointer-events-none absolute -right-4 -top-2 h-20 w-32 text-primary opacity-[0.06]" />
            <div className="relative flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <img
                  src={classclownWordmark.url}
                  alt="ClassClown"
                  className="h-9 w-auto object-contain object-left"
                />
                
              </div>
              <button
                onClick={onClose}
                className="lg:hidden rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-4 space-y-5">
            {filteredMenuGroups.map((group, groupIndex) => {
              const isExpanded = expandedGroups[group.label] ?? getGroupHasActiveRoute(group);
              const tone = GROUP_TONES[groupIndex % GROUP_TONES.length];

              return (
                <div key={group.label}>
                  <div>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-4 py-1.5 rounded-full transition-colors duration-200',
                        'font-heading text-[11px] font-bold uppercase tracking-[0.12em]',
                        'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="truncate text-left">
                        {getGroupLabelByRole(group.label, currentUserRole)}
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-1.5 space-y-1 px-1">
                        {group.items.map((item) => {
                          const isActive = location.pathname === item.href;
                          const rowClass = cn(
                            'w-full flex items-center gap-3 pl-2 pr-4 py-2 rounded-full text-sm transition-all duration-200',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                              ? cn(tone.bg, tone.text, 'font-semibold')
                              : cn('text-foreground/80', tone.soft)
                          );
                          const iconWrap = cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                            isActive ? 'bg-background/70' : 'bg-muted/50'
                          );

                          const content = (
                            <>
                              <span className={iconWrap}>
                                <item.icon className="h-4 w-4" />
                              </span>
                              <span className="truncate">{item.label}</span>
                            </>
                          );

                          return (
                            <div key={item.href}>
                              {item.href === '#' ? (
                                <button
                                  onClick={() => {
                                    (item as { onClick?: () => void }).onClick?.();
                                    onClose();
                                  }}
                                  className={rowClass}
                                >
                                  {content}
                                </button>
                              ) : (
                                <Link to={item.href} onClick={onClose} className={rowClass}>
                                  {content}
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto border-t border-border/40 pt-3 px-1">
            <SidebarProfile />
          </div>

        </div>

      </aside>

    </>
  );
};


export default Sidebar;
