
import React from 'react';
import { Outlet } from 'react-router-dom';
import LearningHubSidebar from './LearningHubSidebar';

const LearningHubLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LearningHubSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default LearningHubLayout;
