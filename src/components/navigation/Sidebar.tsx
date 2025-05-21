import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, ListChecks, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { isAdmin, isTutor } = useAuth();

  const sidebarClass = isOpen ? 'w-64' : 'w-20';
  const linkClass =
    'flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors';
  const activeLinkClass = 'bg-gray-100 text-primary';

  const isActive = (pathname: string) => {
    return location.pathname === pathname;
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white border-r shadow-sm transition-width duration-300 ease-in-out z-50 ${sidebarClass}`}
    >
      <div className="h-full px-3 py-4 overflow-y-auto bg-white">
        <ul className="space-y-2 font-medium">
          <li>
            <Link
              to="/"
              className={`${linkClass} ${isActive('/') ? activeLinkClass : ''}`}
            >
              <Home className="h-5 w-5 mr-2" />
              <span>Dashboard</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link
                to="/students"
                className={`${linkClass} ${isActive('/students') ? activeLinkClass : ''}`}
              >
                <Users className="h-5 w-5 mr-2" />
                <span>Students</span>
              </Link>
            </li>
          )}
          {(isAdmin || isTutor) && (
            <>
              <li>
                <Link
                  to="/tutors"
                  className={`${linkClass} ${isActive('/tutors') ? activeLinkClass : ''}`}
                >
                  <Users className="h-5 w-5 mr-2" />
                  <span>Tutors</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/calendar"
                  className={`${linkClass} ${isActive('/calendar') ? activeLinkClass : ''}`}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Calendar</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/lessons"
                  className={`${linkClass} ${isActive('/lessons') ? activeLinkClass : ''}`}
                >
                  <ListChecks className="h-5 w-5 mr-2" />
                  <span>Lessons</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/homework"
                  className={`${linkClass} ${isActive('/homework') ? activeLinkClass : ''}`}
                >
                  <ListChecks className="h-5 w-5 mr-2" />
                  <span>Homework</span>
                </Link>
              </li>
            </>
          )}
          {isAdmin && (
            <li>
              <Link
                to="/organization/settings"
                className={`${linkClass} ${isActive('/organization/settings') ? activeLinkClass : ''}`}
              >
                <Settings className="h-5 w-5" />
                <span>Organization Settings</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
