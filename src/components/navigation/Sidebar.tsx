
import React from 'react';
import {
  Home,
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
    <div className="flex flex-col h-full bg-sidebar border-r w-64">
      <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="bg-primary h-8 w-8 rounded-md flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-playfair text-lg font-semibold text-primary">Class Clown</span>
            <p className="text-xs text-muted-foreground">Built by JB Tutors</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="w-8 h-8 border-2 border-primary/20">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">{profile?.first_name?.substring(0, 2) || '?'}</AvatarFallback>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-playfair">{profile?.first_name} {profile?.last_name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/organization/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-accent/50 rounded-lg p-4">
          <h4 className="font-playfair font-medium mb-1">Need help?</h4>
          <p className="text-xs text-muted-foreground mb-3">Contact our support team for assistance.</p>
          <button 
            className="w-full bg-primary text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
