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
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const { organization } = useOrganization();
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
      icon: BookOpen, // Changed to BookOpen
      roles: ['admin', 'owner', 'tutor'],
    },
    {
      name: 'Learning Hub',
      path: '/learning-hub',
      icon: BookOpen,
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

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return profile?.roles?.some(role => item.roles?.includes(role.role));
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r w-60">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {organization?.logo_url ? (
            <Avatar className="w-8 h-8">
              <AvatarImage src={organization.logo_url} alt={organization.name} />
              <AvatarFallback>{organization.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
          ) : (
            <Home className="w-6 h-6" />
          )}
          <span className="font-bold">{organization?.name || 'JB Tutors'}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="w-8 h-8">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
              ) : (
                <AvatarFallback>{profile?.first_name?.substring(0, 2) || '?'}</AvatarFallback>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{profile?.first_name} {profile?.last_name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/organization/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              Logout
              <LogOut className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md hover:bg-gray-100 ${
                    isActive ? 'bg-gray-100 font-medium' : ''
                  }`
                }
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
