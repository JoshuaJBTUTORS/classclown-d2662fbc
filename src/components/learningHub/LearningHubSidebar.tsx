
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Library,
  GraduationCap,
  Home,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const LearningHubSidebar = () => {
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/learning-hub',
      icon: LayoutDashboard,
      exact: true
    },
    {
      title: 'My Courses',
      href: '/learning-hub/my-courses',
      icon: BookOpen
    },
    {
      title: 'Assessments',
      href: '/learning-hub/assessments',
      icon: Brain
    },
    {
      title: 'Revision Calendar',
      href: '/learning-hub/revision',
      icon: Calendar
    },
    {
      title: 'Progress',
      href: '/learning-hub/progress',
      icon: TrendingUp
    },
    {
      title: 'Course Library',
      href: '/learning-hub/library',
      icon: Library
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <div className="p-2 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Learning Hub</h2>
          <p className="text-sm text-gray-600">Your Education Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          asChild
        >
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Back to Main App
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default LearningHubSidebar;
