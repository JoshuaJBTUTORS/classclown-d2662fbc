
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  GraduationCap, 
  UserCheck,
  Clock,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

interface SidebarLinkProps {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  isActive: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, isActive }) => (
  <Link
    to={to}
    className={cn(
      "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 hover:text-gray-900 transition-colors",
      isActive ? "bg-gray-100 text-gray-900" : "text-gray-700"
    )}
  >
    <Icon className="mr-2.5 h-4 w-4 opacity-75 group-hover:opacity-100" />
    <span className={cn("transition-opacity", !isOpen && "lg:opacity-0 lg:w-0 lg:overflow-hidden")}>
      {label}
    </span>
  </Link>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { userRole } = useAuth();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-white shadow-lg transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header with branding */}
      <div className="flex h-16 shrink-0 items-center justify-center px-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
            alt="JB Tutors Logo" 
            className="h-8 w-auto" 
          />
          <span className={cn(
            "font-bold text-xl text-gray-900 transition-opacity duration-300",
            !isOpen && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
          )}>
            JB Tutors
          </span>
        </Link>
      </div>

      {/* Navigation content */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3">
          <h2 className={cn(
            "mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-300",
            !isOpen && "lg:opacity-0"
          )}>
            Main Menu
          </h2>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {/* Calendar - available to all authenticated users */}
            <SidebarLink 
              to="/calendar" 
              icon={Calendar} 
              label="Calendar" 
              isActive={location.pathname === '/calendar'}
            />

            {/* Students - only for admin, owner, tutor */}
            {(userRole === 'admin' || userRole === 'owner' || userRole === 'tutor') && (
              <SidebarLink 
                to="/students" 
                icon={Users} 
                label="Students" 
                isActive={location.pathname === '/students'}
              />
            )}

            {/* Lessons - available to all authenticated users */}
            <SidebarLink 
              to="/lessons" 
              icon={BookOpen} 
              label="Lessons" 
              isActive={location.pathname === '/lessons'}
            />

            {/* Tutors - only for admin and owner */}
            {(userRole === 'admin' || userRole === 'owner') && (
              <SidebarLink 
                to="/tutors" 
                icon={GraduationCap} 
                label="Tutors" 
                isActive={location.pathname === '/tutors'}
              />
            )}

            {/* Booked Trial Lessons - only for admin and owner */}
            {(userRole === 'admin' || userRole === 'owner') && (
              <SidebarLink 
                to="/booked-trial-lessons" 
                icon={UserCheck} 
                label="Trial Bookings" 
                isActive={location.pathname === '/booked-trial-lessons'}
              />
            )}

            {/* Time Off - only for tutors */}
            {userRole === 'tutor' && (
              <SidebarLink 
                to="/time-off" 
                icon={Clock} 
                label="Time Off" 
                isActive={location.pathname === '/time-off'}
              />
            )}

            {/* Time Off Requests - only for admin and owner */}
            {(userRole === 'admin' || userRole === 'owner') && (
              <SidebarLink 
                to="/time-off-requests" 
                icon={ClipboardList} 
                label="Time Off Requests" 
                isActive={location.pathname === '/time-off-requests'}
              />
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
