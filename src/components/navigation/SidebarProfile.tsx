import React from 'react';
import { ChevronsUpDown, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { resolveAvatarSrc } from '@/lib/cleoAvatars';


const SidebarProfile: React.FC = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const avatarSrc = resolveAvatarSrc(profile?.avatar_url);


  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'CC';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'User';
  };

  if (!user) {
    return (
      <button
        onClick={() => navigate('/auth')}
        className="w-full rounded-full bg-pastel-mint px-4 py-2.5 text-sm font-semibold text-pastel-mint-foreground transition-colors hover:opacity-90"
      >
        Log in
      </button>
    );
  }

  const menuItemClass = cn(
    'cursor-pointer rounded-full px-3 py-2 text-sm gap-2',
    'focus:bg-pastel-mint/50 focus:text-foreground'
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-3 rounded-full pl-1.5 pr-3 py-1.5',
            'bg-pastel-sand/50 hover:bg-pastel-sand transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left'
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background/80 font-heading text-xs font-bold text-foreground">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile icon"
                loading="lazy"
                width={512}
                height={512}
                className="h-full w-full object-cover"
              />
            ) : (
              getUserInitials()
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate font-heading text-sm font-semibold text-foreground">
              {getDisplayName()}
            </span>
            {userRole && (
              <span className="block truncate text-[11px] capitalize text-muted-foreground">
                {userRole}
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[15rem] rounded-3xl border-border/50 bg-background p-2 shadow-lg"
      >
        <DropdownMenuLabel className="px-3 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          My Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem className={menuItemClass} onClick={() => navigate('/settings')}>
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className={cn(menuItemClass, 'text-destructive focus:bg-destructive/10 focus:text-destructive')}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SidebarProfile;
