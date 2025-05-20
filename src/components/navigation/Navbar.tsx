
import React from 'react';
import { Bell, ChevronDown, LogOut, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'CU'; // Default to ClassClown User
    
    const email = user.email || '';
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    
    return 'CU';
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
            src="/tutorhub-logo.svg"
            alt="ClassClown Logo"
            className="h-8 w-8"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=CC' }}
          />
          <span className="font-bold text-lg text-primary">ClassClown</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <form className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] lg:w-[300px] pl-8"
            />
          </form>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                    {getUserInitials()}
                  </div>
                  <div className="hidden md:block text-start">
                    <div className="text-sm font-medium">{user.email}</div>
                    <div className="text-xs text-muted-foreground">User</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Help</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <a href="/auth">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
