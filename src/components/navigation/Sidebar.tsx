import React from 'react';
import {
  Calendar,
  BookOpen,
  Users,
  Settings,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
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
  roles?: string[];
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
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: Calendar,
      roles: ['admin', 'owner', 'tutor'],
    },
    {
      name: 'Lessons',
      path: '/lessons',
      icon: ListChecks,
      roles: ['admin', 'owner', 'tutor'],
    },
    {
      name: 'Homework',
      path: '/homework',
      icon: BookOpen,
      roles: ['admin', 'owner', 'tutor'],
    },
    {
      name: 'Learning Hub',
      path: '/learning-hub',
      icon: BookOpen,
    },
    {
      name: 'Messages',
      path: '/messages',
      icon: MessageSquare,
      roles: ['admin', 'owner', 'tutor'], // Restrict to admin, owner, and tutor roles
    },
    {
      name: 'Students',
      path: '/students',
      icon: Users,
      roles: ['admin', 'owner'],
    },
    {
      name: 'Tutors',
      path: '/tutors',
      icon: Users,
      roles: ['admin', 'owner', 'tutor'],
    },
    {
      name: 'Settings',
      path: '/organization/settings',
      icon: Settings,
      roles: ['admin', 'owner'],
    },
  ];

  // Instead of accessing profile.roles directly, use the userRole from the auth context
  // or the userRoles array that's computed from the AuthContext
  const userRoles = userRole ? [userRole] : [];

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return userRoles.some(role => item.roles?.includes(role));
  });

  if (!isOpen) {
    return null; // Don't render if sidebar is closed
  }

  return (
    <div className="flex flex-col h-full bg-background border-r w-64">
      <div className="flex items-center justify-center p-5 border-b border-gray-100">
        <img 
          src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
          alt="Class Clown Logo" 
          className="h-30 w-auto" 
        />
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-md transition-colors hover:bg-gray-50 ${
                    isActive ? 'bg-[#e94b7f]/10 text-foreground font-medium' : 'text-foreground'
                  }`
                }
              >
                <item.icon className={`w-5 h-5 mr-3 ${pathname === item.path ? 'text-[#e94b7f]' : 'text-gray-500'}`} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-[#e94b7f]/5 rounded-lg p-4">
          <h4 className="font-playfair font-medium mb-1">Need help?</h4>
          <p className="text-xs text-muted-foreground mb-3">Contact our support team for assistance.</p>
          <button 
            className="w-full bg-background border border-[#e94b7f]/30 text-foreground py-2 px-4 rounded-md text-sm font-medium hover:bg-[#e94b7f]/10 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
