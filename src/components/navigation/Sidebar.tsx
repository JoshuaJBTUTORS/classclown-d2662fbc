import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  GraduationCap, 
  Home, 
  BookMarked,
  TrendingUp,
  Library,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Clock,
  UserPlus,
  LayoutDashboard,
  CalendarX,
  BookOpen,
  Book,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { userRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'owner', 'tutor']
    },
    {
      title: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      allowedRoles: ['admin', 'owner', 'tutor', 'student', 'parent']
    },
    {
      title: 'Students',
      href: '/students',
      icon: Users,
      allowedRoles: ['admin', 'owner', 'tutor']
    },
    {
      title: 'Tutors',
      href: '/tutors',
      icon: GraduationCap,
      allowedRoles: ['admin', 'owner']
    },
    {
      title: 'Homework',
      href: '/homework',
      icon: BookOpen,
      allowedRoles: ['admin', 'owner', 'tutor', 'student', 'parent']
    },
    {
      title: 'Progress',
      href: '/progress',
      icon: TrendingUp,
      allowedRoles: ['student', 'owner', 'parent']
    },
    {
      title: 'Learning Hub',
      href: '/learning-hub',
      icon: Book,
      allowedRoles: ['admin', 'owner', 'tutor', 'student', 'parent']
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: BarChart3,
      allowedRoles: ['owner']
    },
    {
      title: 'Time Off',
      href: '/time-off',
      icon: CalendarX,
      allowedRoles: ['tutor']
    },
    {
      title: 'Time Off Requests',
      href: '/time-off-requests',
      icon: Clock,
      allowedRoles: ['admin', 'owner']
    },
    {
      title: 'Trial Bookings',
      href: '/trial-bookings',
      icon: Calendar,
      allowedRoles: ['admin', 'owner']
    }
  ];

  const getNavigation = () => {
    // For students, start with Progress and exclude Dashboard
    if (userRole === 'student') {
      return [
        { name: 'Progress', href: '/progress', icon: TrendingUp },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Homework', href: '/homework', icon: BookMarked },
        { name: 'Learning Hub', href: '/learning-hub', icon: Library },
      ];
    }

    // For parents, start with Progress and exclude Dashboard
    if (userRole === 'parent') {
      return [
        { name: 'Progress', href: '/progress', icon: TrendingUp },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Homework', href: '/homework', icon: BookMarked },
        { name: 'Learning Hub', href: '/learning-hub', icon: Library },
      ];
    }

    // For tutors, include time off requests
    if (userRole === 'tutor') {
      return [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Homework', href: '/homework', icon: BookMarked },
        { name: 'Time Off', href: '/time-off', icon: Clock },
        { name: 'Learning Hub', href: '/learning-hub', icon: Library },
      ];
    }

    // For all other roles, keep the original navigation with Dashboard first
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
    ];

    // Add role-specific navigation items
    if (userRole === 'admin' || userRole === 'owner') {
      baseNavigation.push({ name: 'Students', href: '/students', icon: Users });
      baseNavigation.push({ name: 'Tutors', href: '/tutors', icon: GraduationCap });
    }

    baseNavigation.push({ name: 'Homework', href: '/homework', icon: BookMarked });

    // Add time off requests for admins and owners
    if (userRole === 'admin' || userRole === 'owner') {
      baseNavigation.push({ name: 'Time Off Requests', href: '/time-off-requests', icon: Clock });
      baseNavigation.push({ name: 'Trial Bookings', href: '/trial-bookings', icon: UserPlus });
    }

    if (userRole === 'owner') {
      baseNavigation.push({ name: 'Progress', href: '/progress', icon: TrendingUp });
      baseNavigation.push({ name: 'Reports', href: '/reports', icon: FileBarChart });
    }

    baseNavigation.push({ name: 'Learning Hub', href: '/learning-hub', icon: Library });

    return baseNavigation;
  };

  const navigation = getNavigation();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-[hsl(210,20%,98%)] to-white border-r border-gray-200 shadow-[var(--shadow-card)] transition-all duration-200 ease-in-out lg:translate-x-0 font-sidebar",
      isOpen ? "translate-x-0" : "-translate-x-full",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Header with Logo - White Background */}
        <div className={cn(
          "flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4",
          isCollapsed && "px-2"
        )}>
          {!isCollapsed && (
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
                alt="Class Clown Logo" 
                className="h-10 w-auto drop-shadow-sm" 
              />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className={cn(
              "h-8 w-8 text-[hsl(210,45%,45%)] hover:bg-gray-100 hover:text-[hsl(210,45%,45%)] transition-all duration-200",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "bg-[hsl(35,25%,85%)] text-[hsl(210,45%,45%)] shadow-[var(--shadow-subtle)] sidebar-item-active"
                    : "text-[hsl(210,45%,45%)] hover:bg-[hsl(210,20%,96%)] hover:text-[hsl(210,35%,35%)]",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-all duration-200",
                    isActive ? "text-[hsl(210,45%,45%)]" : "text-[hsl(210,45%,45%)] group-hover:text-[hsl(210,35%,35%)]",
                    !isCollapsed && "mr-3"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate font-medium tracking-wide">{item.name}</span>
                )}
                {isActive && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-[hsl(210,45%,45%)] rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-4 bg-[hsl(210,20%,98%)]">
            <div className="text-xs text-gray-600 text-center">
              <p className="font-playfair text-[hsl(210,45%,45%)] font-semibold text-sm">Class Clown Tutoring</p>
              <p className="mt-1 font-medium">Excellence in Education</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
