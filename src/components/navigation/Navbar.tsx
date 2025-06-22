
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
    <header className="bg-white/98 backdrop-blur-sm border-b border-gray-200">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Button variant="ghost" size="icon" className="mr-2 lg:hidden hover:bg-gray-50" onClick={toggleSidebar}>
          <Menu className="h-5 w-5 text-[hsl(210,40%,45%)]" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        
        {/* Logo - visible on all screen sizes with white background */}
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
            <img 
              src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
              alt="Class Clown Logo" 
              className="h-6 w-auto lg:hidden drop-shadow-sm" 
            />
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <form className="hidden md:flex relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(210,40%,45%)]" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] lg:w-[300px] pl-10 rounded-full border-gray-200 bg-white focus-visible:ring-[hsl(210,40%,45%)] focus-visible:border-[hsl(210,40%,45%)] transition-all duration-200"
            />
          </form>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-full text-[hsl(210,40%,45%)] hover:bg-gray-50 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-[hsl(153,30%,50%)] to-[hsl(153,25%,60%)] rounded-full shadow-sm"></span>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-gray-50 transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[hsl(210,40%,45%)] to-[hsl(210,35%,50%)] text-white flex items-center justify-center font-semibold shadow-sm">
                    {getUserInitials()}
                  </div>
                  <div className="hidden md:block text-start">
                    <div className="text-sm font-semibold text-[hsl(210,40%,45%)]">{getDisplayName()}</div>
                    <div className="text-xs flex items-center gap-1">
                      <span className="text-[hsl(210,40%,45%)]/70 font-medium">
                        {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}
                      </span>
                      {userRole && (
                        <Badge variant={getRoleBadgeVariant()} className="text-[10px] py-0 h-4 bg-gradient-to-r from-[hsl(153,30%,50%)] to-[hsl(153,25%,60%)] text-white border-none">
                          {userRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[hsl(210,40%,45%)] hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] bg-white/98 backdrop-blur-sm border border-gray-200 shadow-[var(--shadow-elevated)]">
                <DropdownMenuLabel className="font-playfair text-[hsl(210,40%,45%)] font-semibold">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <User className="h-4 w-4 mr-2 text-[hsl(210,40%,45%)]" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <Settings className="h-4 w-4 mr-2 text-[hsl(210,40%,45%)]" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <HelpCircle className="h-4 w-4 mr-2 text-[hsl(210,40%,45%)]" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive hover:bg-red-50 transition-colors duration-200">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild className="rounded-full border-[hsl(210,40%,45%)] text-[hsl(210,40%,45%)] hover:bg-[hsl(210,40%,45%)] hover:text-white">
              <a href="/auth">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
