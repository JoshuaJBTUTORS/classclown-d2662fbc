
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Home, 
  BookMarked,
  TrendingUp,
  Library
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { userRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Lessons', href: '/lessons', icon: BookOpen },
    ...(userRole === 'admin' || userRole === 'owner' || userRole === 'tutor' ? [
      { name: 'Students', href: '/students', icon: Users }
    ] : []),
    ...(userRole === 'admin' || userRole === 'owner' ? [
      { name: 'Tutors', href: '/tutors', icon: GraduationCap }
    ] : []),
    { name: 'Homework', href: '/homework', icon: BookMarked },
    ...(userRole === 'student' || userRole === 'owner' ? [
      { name: 'Progress', href: '/progress', icon: TrendingUp }
    ] : []),
    { name: 'Learning Hub', href: '/learning-hub', icon: Library },
  ];

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-white shadow-lg border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full",
      "w-64"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Tutoring Platform</h1>
        </div>
        
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
