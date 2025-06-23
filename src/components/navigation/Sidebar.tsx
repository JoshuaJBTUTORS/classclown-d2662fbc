import React, { useState, useEffect } from 'react';
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
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { userRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (onClose && isOpen) {
      // Check if we're on mobile/tablet (< 1024px)
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        onClose();
      }
    }
  }, [location.pathname, onClose, isOpen]);

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

  // Color mapping for different navigation items using blue-green gradient
  const getItemColors = (itemName: string, isActive: boolean) => {
    const colorMap = {
      'Dashboard': isActive 
        ? 'bg-[hsl(var(--deep-purple-blue))]/20 text-[hsl(var(--deep-purple-blue))]' 
        : 'text-[hsl(var(--deep-purple-blue))] hover:bg-[hsl(var(--deep-purple-blue))]/10 hover:text-[hsl(var(--deep-purple-blue))]',
      'Calendar': isActive 
        ? 'bg-[hsl(var(--medium-blue))]/20 text-[hsl(var(--medium-blue))]' 
        : 'text-[hsl(var(--medium-blue))] hover:bg-[hsl(var(--medium-blue))]/10 hover:text-[hsl(var(--medium-blue))]',
      'Students': isActive 
        ? 'bg-[hsl(var(--cyan-blue))]/20 text-[hsl(var(--cyan-blue))]' 
        : 'text-[hsl(var(--cyan-blue))] hover:bg-[hsl(var(--cyan-blue))]/10 hover:text-[hsl(var(--cyan-blue))]',
      'Tutors': isActive 
        ? 'bg-[hsl(var(--light-green))]/20 text-[hsl(var(--medium-green))]' 
        : 'text-[hsl(var(--light-green))] hover:bg-[hsl(var(--light-green))]/10 hover:text-[hsl(var(--medium-green))]',
      'Homework': isActive 
        ? 'bg-[hsl(var(--medium-green))]/20 text-[hsl(var(--medium-green))]' 
        : 'text-[hsl(var(--medium-green))] hover:bg-[hsl(var(--medium-green))]/10 hover:text-[hsl(var(--medium-green))]',
      'Progress': isActive 
        ? 'bg-[hsl(var(--bright-green))]/20 text-[hsl(var(--bright-green))]'  
        : 'text-[hsl(var(--bright-green))] hover:bg-[hsl(var(--bright-green))]/10 hover:text-[hsl(var(--bright-green))]',
      'Learning Hub': isActive 
        ? 'bg-[hsl(var(--cyan-blue))]/20 text-[hsl(var(--cyan-blue))]' 
        : 'text-[hsl(var(--cyan-blue))] hover:bg-[hsl(var(--cyan-blue))]/10 hover:text-[hsl(var(--cyan-blue))]',
    };
    
    return colorMap[itemName] || (isActive 
      ? 'bg-[hsl(var(--deep-purple-blue))]/20 text-[hsl(var(--deep-purple-blue))]' 
      : 'text-[hsl(var(--deep-purple-blue))] hover:bg-[hsl(var(--deep-purple-blue))]/10 hover:text-[hsl(var(--deep-purple-blue))]');
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 shadow-[var(--shadow-card)] transition-all duration-300 ease-in-out font-sidebar",
        // Mobile/Tablet: Modal overlay behavior
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: Fixed sidebar with collapse
        "lg:z-40",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        // Mobile: Always full width when open
        "w-64"
      )}>
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div className={cn(
            "flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4",
            isCollapsed && "lg:px-2"
          )}>
            {(!isCollapsed || window.innerWidth < 1024) && (
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
                  alt="Class Clown Logo" 
                  className="h-10 w-auto drop-shadow-sm" 
                />
              </div>
            )}
            
            {/* Collapse button - only show on desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className={cn(
                "hidden lg:flex h-8 w-8 text-[hsl(var(--deep-purple-blue))] hover:bg-[hsl(var(--cyan-blue))]/10 hover:text-[hsl(var(--cyan-blue))] transition-all duration-200",
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
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto bg-white">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden",
                    getItemColors(item.name, isActive),
                    isCollapsed && window.innerWidth >= 1024 && "justify-center px-2"
                  )}
                  title={isCollapsed && window.innerWidth >= 1024 ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-200",
                      (!isCollapsed || window.innerWidth < 1024) && "mr-3"
                    )}
                  />
                  {(!isCollapsed || window.innerWidth < 1024) && (
                    <span className="truncate font-medium tracking-wide">{item.name}</span>
                  )}
                  {isActive && (
                    <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-[hsl(var(--medium-green))] to-[hsl(var(--bright-green))] rounded-l-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {(!isCollapsed || window.innerWidth < 1024) && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="text-xs text-gray-600 text-center">
                <p className="font-playfair text-[hsl(var(--deep-purple-blue))] font-semibold text-sm">Class Clown Tutoring</p>
                <p className="mt-1 font-medium text-[hsl(var(--medium-blue))]">Excellence in Education</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
