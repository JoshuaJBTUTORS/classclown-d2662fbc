import React from 'react';
import { Bell, ChevronDown, LogOut, Search, Menu, Settings, User, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, profile, userRole, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'CC';
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    
    return user?.email || 'User';
  };

  // Get role badge color
  const getRoleBadgeVariant = () => {
    switch(userRole) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'tutor': return 'outline';
      case 'student': return 'destructive';
      case 'parent': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex items-center gap-2 md:hidden">
          <img 
            src="/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png" 
            alt="Class Clown Logo" 
            className="h-16 w-auto"
          />
        </div>
        <div className="ml-auto flex items-center gap-4">
          <form className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] lg:w-[300px] pl-8 rounded-full border-gray-200 focus-visible:ring-[#9FE2BF]"
            />
          </form>
          <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#9FE2BF] rounded-full"></span>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full px-2 py-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#9FE2BF]/10 text-[#9FE2BF] flex items-center justify-center font-medium">
                    {getUserInitials()}
                  </div>
                  <div className="hidden md:block text-start">
                    <div className="text-sm font-medium">{getDisplayName()}</div>
                    <div className="text-xs flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}
                      </span>
                      {userRole && (
                        <Badge variant={getRoleBadgeVariant()} className="text-[10px] py-0 h-4">
                          {userRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel className="font-playfair">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <a href="/auth">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
