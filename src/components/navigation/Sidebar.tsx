import React, { useState, useEffect, useRef } from 'react';
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
  BarChart3,
  MessageSquare,
  X,
  FileText,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ChatModal from '@/components/chat/ChatModal';

interface SidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  onClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { userRole, isAdmin, isOwner, isTutor, isParent, isStudent } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Only show admin/management features to admin and owner roles
  const showAdminFeatures = isAdmin || isOwner;
  const showTutorFeatures = isTutor || showAdminFeatures;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary">TutorCRM</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>

              <Link 
                to="/calendar" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/calendar') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </Link>

              {/* Admin/Owner Features */}
              {showAdminFeatures && (
                <>
                  <Link 
                    to="/students" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/students') 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Students
                  </Link>

                  <Link 
                    to="/tutors" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/tutors') 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Tutors
                  </Link>
                </>
              )}

              <Link 
                to="/lessons" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/lessons') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Lessons
              </Link>

              {/* Lesson Plans - Admin/Owner Only */}
              {showAdminFeatures && (
                <Link 
                  to="/lesson-plans" 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/lesson-plans') 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Lesson Plans
                </Link>
              )}

              <Link 
                to="/homework" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/homework') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Homework
              </Link>

              <Link 
                to="/progress" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/progress') 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Progress
              </Link>

              {/* Learning Hub for all authenticated users */}
              <Link 
                to="/learning-hub" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/learning-hub')
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Learning Hub
              </Link>

              {/* Admin/Owner Features */}
              {showAdminFeatures && (
                <>
                  <Link 
                    to="/reports" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/reports') 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Reports
                  </Link>

                  <Link 
                    to="/trial-bookings" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/trial-bookings') 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Trial Bookings
                  </Link>
                </>
              )}

              {/* Tutor Features */}
              {showTutorFeatures && (
                <>
                  <Link 
                    to="/time-off" 
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/time-off') 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Time Off
                  </Link>

                  {showAdminFeatures && (
                    <Link 
                      to="/time-off-requests" 
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/time-off-requests') 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      Time Off Requests
                    </Link>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
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
