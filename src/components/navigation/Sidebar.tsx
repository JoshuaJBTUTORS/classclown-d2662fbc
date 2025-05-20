import React from 'react';
import {
  Home,
  Calendar,
  Users,
  User,
  Settings,
  Book,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const sidebarClass = isOpen ? 'w-64' : 'w-20';

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white border-r shadow-sm transition-width duration-300 ease-in-out ${sidebarClass} z-50`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h1 className={`text-2xl font-bold transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            Tutor App
          </h1>
        </div>

        <nav className="flex-1 px-2 py-4">
          <ul>
            <li className="mb-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
                }
              >
                <Home className="mr-2 h-4 w-4" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  Dashboard
                </span>
              </NavLink>
            </li>
            <li className="mb-1">
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  Calendar
                </span>
              </NavLink>
            </li>
            <li className="mb-1">
              <NavLink
                to="/lessons"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
                }
              >
                <Book className="mr-2 h-4 w-4" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  Lessons
                </span>
              </NavLink>
            </li>
            <li className="mb-1">
              <NavLink
                to="/homework"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
                }
              >
                <Book className="mr-2 h-4 w-4" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  Homework
                </span>
              </NavLink>
            </li>
            <li className="mb-1">
              <NavLink
                to="/students"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
                }
              >
                <Users className="mr-2 h-4 w-4" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  Students
                </span>
              </NavLink>
            </li>
            <li className="mb-1">
              <NavLink
                to="/tutors"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-md hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
                }
              >
                <User className="mr-2 h-4 w-4" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  Tutors
                </span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-4">
          <NavLink
            to="/settings"
            className={`flex items-center p-2 rounded-md hover:bg-gray-100`}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              Settings
            </span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
