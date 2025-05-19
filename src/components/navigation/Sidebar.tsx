
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
}

function SidebarItem({ icon: Icon, label, href, isActive }: SidebarItemProps) {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive ? "sidebar-item-active" : "hover:bg-accent"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <img
            src="/tutorhub-logo.svg"
            alt="TutorHub Logo"
            className="h-8 w-8"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=TH' }}
          />
          <span className="font-bold text-lg text-primary">TutorHub</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          <SidebarItem 
            icon={BarChart3} 
            label="Dashboard" 
            href="/" 
            isActive={currentPath === "/"} 
          />
          <SidebarItem 
            icon={Users} 
            label="Students" 
            href="/students" 
            isActive={currentPath === "/students"} 
          />
          <SidebarItem 
            icon={Users} 
            label="Tutors" 
            href="/tutors" 
            isActive={currentPath === "/tutors"} 
          />
          <SidebarItem 
            icon={Calendar} 
            label="Calendar" 
            href="/calendar" 
            isActive={currentPath === "/calendar"} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label="Courses" 
            href="/courses" 
            isActive={currentPath === "/courses"} 
          />
          <SidebarItem 
            icon={MessageSquare} 
            label="Messages" 
            href="/messages" 
            isActive={currentPath === "/messages"} 
          />
          <SidebarItem 
            icon={CreditCard} 
            label="Billing" 
            href="/billing" 
            isActive={currentPath === "/billing"} 
          />
        </nav>
      </div>
      <div className="border-t p-4">
        <nav className="grid gap-1">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            href="/settings" 
            isActive={currentPath === "/settings"} 
          />
          <SidebarItem 
            icon={HelpCircle} 
            label="Help & Support" 
            href="/support" 
            isActive={currentPath === "/support"} 
          />
        </nav>
      </div>
    </div>
  );
}
