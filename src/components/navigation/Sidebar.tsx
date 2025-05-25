
import React from 'react';
import {
  Calendar,
  BookOpen,
  Users,
  LayoutDashboard,
  ListChecks,
  LogOut,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SidebarProps {
  isOpen?: boolean;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  allowedRoles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const { pathname } = useLocation();
  const { user, profile, signOut, userRole } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      // Dashboard accessible to all roles
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: Calendar,
      // Calendar accessible to all roles
    },
    {
      name: 'Lessons',
      path: '/lessons',
      icon: ListChecks,
      allowedRoles: ['owner', 'admin', 'tutor'],
    },
    {
      name: 'Homework',
      path: '/homework',
      icon: BookOpen,
      // Homework accessible to all roles
    },
    {
      name: 'Learning Hub',
      path: '/learning-hub',
      icon: BookOpen,
      // Learning hub accessible to all roles
    },
    {
      name: 'Students',
      path: '/students',
      icon: Users,
      allowedRoles: ['owner', 'admin'],
    },
    {
      name: 'Tutors',
      path: '/tutors',
      icon: Users,
      allowedRoles: ['owner', 'admin'],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    // If no allowedRoles specified, show to all authenticated users
    if (!item.allowedRoles) return true;
    
    // Otherwise check if user role is allowed
    return item.allowedRoles.includes(userRole || '');
  });

  if (!isOpen) {
    return null; // Don't render if sidebar is closed
  }

  return (
    <div className="flex flex-col h-full bg-background border-r w-48">
      <div className="flex items-center justify-center p-3 border-b border-gray-100">
        <img 
          src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
          alt="Class Clown Logo" 
          className="h-16 w-auto" 
        />
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md transition-colors hover:bg-gray-50 ${
                    isActive ? 'bg-[#e94b7f]/10 text-foreground font-medium' : 'text-foreground'
                  }`
                }
              >
                <item.icon className={`w-4 h-4 mr-2 ${pathname === item.path ? 'text-[#e94b7f]' : 'text-gray-500'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="bg-[#e94b7f]/5 rounded-lg p-3">
          <h4 className="font-playfair font-medium mb-1 text-sm">Need help?</h4>
          <p className="text-xs text-muted-foreground mb-2">Contact our support team for assistance.</p>
          <button 
            className="w-full bg-background border border-[#e94b7f]/30 text-foreground py-1.5 px-3 rounded-md text-xs font-medium hover:bg-[#e94b7f]/10 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
