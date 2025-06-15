
import React from 'react';
import LearningHubSidebar from './LearningHubSidebar';

interface LearningHubLayoutProps {
  children: React.ReactNode;
}

const LearningHubLayout: React.FC<LearningHubLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LearningHubSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default LearningHubLayout;
