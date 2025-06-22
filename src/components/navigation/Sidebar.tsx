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

  // Color mapping for different navigation items
  const getItemColors = (itemName: string, isActive: boolean) => {
    const colorMap = {
      'Dashboard': isActive 
        ? 'bg-[hsl(270,20%,90%)] text-[hsl(270,35%,35%)]' 
        : 'text-[hsl(270,35%,35%)] hover:bg-[hsl(270,15%,95%)] hover:text-[hsl(270,25%,25%)]',
      'Calendar': isActive 
        ? 'bg-[hsl(200,20%,90%)] text-[hsl(200,35%,35%)]' 
        : 'text-[hsl(200,35%,35%)] hover:bg-[hsl(200,15%,95%)] hover:text-[hsl(200,25%,25%)]',
      'Students': isActive 
        ? 'bg-[hsl(120,20%,90%)] text-[hsl(120,35%,35%)]' 
        : 'text-[hsl(120,35%,35%)] hover:bg-[hsl(120,15%,95%)] hover:text-[hsl(120,25%,25%)]',
      'Tutors': isActive 
        ? 'bg-[hsl(340,20%,90%)] text-[hsl(340,35%,35%)]' 
        : 'text-[hsl(340,35%,35%)] hover:bg-[hsl(340,15%,95%)] hover:text-[hsl(340,25%,25%)]',
      'Homework': isActive 
        ? 'bg-[hsl(20,25%,90%)] text-[hsl(20,45%,35%)]' 
        : 'text-[hsl(20,45%,35%)] hover:bg-[hsl(20,15%,95%)] hover:text-[hsl(20,35%,25%)]',
      'Progress': isActive 
        ? 'bg-[hsl(15,25%,90%)] text-[hsl(15,45%,35%)]'  
        : 'text-[hsl(15,45%,35%)] hover:bg-[hsl(15,15%,95%)] hover:text-[hsl(15,35%,25%)]',
      'Learning Hub': isActive 
        ? 'bg-[hsl(60,20%,90%)] text-[hsl(60,45%,35%)]' 
        : 'text-[hsl(60,45%,35%)] hover:bg-[hsl(60,15%,95%)] hover:text-[hsl(60,35%,25%)]',
    };
    
    return colorMap[itemName] || (isActive 
      ? 'bg-[hsl(270,20%,90%)] text-[hsl(270,35%,35%)]' 
      : 'text-[hsl(270,35%,35%)] hover:bg-[hsl(270,15%,95%)] hover:text-[hsl(270,25%,25%)]');
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-[hsl(270,15%,98%)] to-white border-r border-gray-200 shadow-[var(--shadow-card)] transition-all duration-200 ease-in-out lg:translate-x-0 font-sidebar",
      isOpen ? "translate-x-0" : "-translate-x-full",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Header with Logo - Soft Lavender Background */}
        <div className={cn(
          "flex h-16 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[hsl(270,25%,95%)] to-[hsl(340,20%,95%)] px-4",
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
              "h-8 w-8 text-[hsl(270,35%,35%)] hover:bg-[hsl(270,15%,90%)] hover:text-[hsl(270,25%,25%)] transition-all duration-200",
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
                  getItemColors(item.name, isActive),
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-all duration-200",
                    !isCollapsed && "mr-3"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate font-medium tracking-wide">{item.name}</span>
                )}
                {isActive && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-[hsl(15,45%,75%)] to-[hsl(340,25%,75%)] rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-[hsl(120,15%,95%)] to-[hsl(200,15%,95%)]">
            <div className="text-xs text-gray-600 text-center">
              <p className="font-playfair text-[hsl(270,35%,35%)] font-semibold text-sm">Class Clown Tutoring</p>
              <p className="mt-1 font-medium">Excellence in Education</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
