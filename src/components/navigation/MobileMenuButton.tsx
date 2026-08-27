import React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuButtonProps {
  toggleSidebar: () => void;
  className?: string;
}

/** Mobile-only trigger to open the sidebar (replaces the old top navbar hamburger). */
const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ toggleSidebar, className }) => (
  <div className={cn('lg:hidden px-4 pt-4', className)}>
    <button
      onClick={toggleSidebar}
      aria-label="Open menu"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-pastel-mint/60 text-foreground shadow-sm transition-colors hover:bg-pastel-mint"
    >
      <Menu className="h-5 w-5" />
    </button>
  </div>
);

export default MobileMenuButton;
