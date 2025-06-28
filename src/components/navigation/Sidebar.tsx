
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar,
  BookOpen,
  ClipboardList,
  BarChart3,
  FileText,
  Clock,
  UserPlus,
  Settings,
  Building,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { userRole, isAdmin, isOwner, isTutor, isStudent, isParent } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'owner', 'tutor', 'student', 'parent'] },
    { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['admin', 'owner', 'tutor', 'student', 'parent'] },
    { name: 'Lessons', href: '/lessons', icon: ClipboardList, roles: ['admin', 'owner', 'tutor', 'student', 'parent'] },
    { name: 'Lesson Plans', href: '/lesson-plans', icon: BookOpen, roles: ['admin', 'owner', 'tutor'] },
    { name: 'Students', href: '/students', icon: Users, roles: ['admin', 'owner', 'tutor', 'parent'] },
    { name: 'Tutors', href: '/tutors', icon: GraduationCap, roles: ['admin', 'owner'] },
    { name: 'Progress', href: '/progress', icon: BarChart3, roles: ['admin', 'owner', 'tutor', 'student', 'parent'] },
    { name: 'Homework', href: '/homework', icon: FileText, roles: ['admin', 'owner', 'tutor', 'student', 'parent'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'owner'] },
    { name: 'Time Off', href: '/time-off', icon: Clock, roles: ['tutor'] },
    { name: 'Time Off Requests', href: '/time-off-requests', icon: Clock, roles: ['admin', 'owner'] },
    { name: 'Trial Bookings', href: '/trial-bookings', icon: UserPlus, roles: ['admin', 'owner'] },
    { name: 'Learning Hub', href: '/learning-hub', icon: Building, roles: ['admin', 'owner', 'tutor', 'student', 'parent'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole || '')
  );

  const isActive = (href: string) => {
    if (href === '/lesson-plans') {
      return location.pathname === href || location.pathname.startsWith('/lesson-plans/');
    }
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-20',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EduPlatform</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {userRole?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {userRole} Account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
