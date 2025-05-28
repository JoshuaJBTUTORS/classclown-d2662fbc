
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Home, 
  BookMarked,
  TrendingUp,
  Library,
  ChevronLeft,
  ChevronRight,
  FileBarChart
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

  const getNavigation = () => {
    // For students, start with Progress and exclude Dashboard
    if (userRole === 'student') {
      return [
        { name: 'Progress', href: '/progress', icon: TrendingUp },
        { name: 'Calendar', href: '/calendar', icon: Calendar },
        { name: 'Lessons', href: '/lessons', icon: BookOpen },
        { name: 'Homework', href: '/homework', icon: BookMarked },
        { name: 'Learning Hub', href: '/learning-hub', icon: Library },
      ];
    }

    // For all other roles, keep the original navigation with Dashboard first
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Lessons', href: '/lessons', icon: BookOpen },
    ];

    // Add role-specific navigation items
    if (userRole === 'admin' || userRole === 'owner' || userRole === 'tutor') {
      baseNavigation.push({ name: 'Students', href: '/students', icon: Users });
    }

    if (userRole === 'admin' || userRole === 'owner') {
      baseNavigation.push({ name: 'Tutors', href: '/tutors', icon: GraduationCap });
    }

    baseNavigation.push({ name: 'Homework', href: '/homework', icon: BookMarked });

    if (userRole === 'owner') {
      baseNavigation.push({ name: 'Progress', href: '/progress', icon: TrendingUp });
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
      "fixed left-0 top-0 z-40 h-screen bg-white shadow-xl border-r border-gray-200/50 transition-all duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Header with Logo */}
        <div className={cn(
          "flex h-16 items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-[#e94b7f]/5 to-[#e94b7f]/10 px-4",
          isCollapsed && "px-2"
        )}>
          {!isCollapsed && (
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
                alt="Class Clown Logo" 
                className="h-10 w-auto" 
              />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className={cn(
              "h-8 w-8 text-[#e94b7f] hover:bg-[#e94b7f]/10 hover:text-[#e94b7f]",
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
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#e94b7f] to-[#e94b7f]/90 text-white shadow-md"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-[#e94b7f]/10 hover:to-[#e94b7f]/5 hover:text-[#e94b7f]",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-[#e94b7f]",
                    !isCollapsed && "mr-3"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-gray-200/50 p-4">
            <div className="text-xs text-gray-500 text-center">
              <p className="font-playfair">Class Clown Tutoring</p>
              <p className="mt-1">Excellence in Education</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
