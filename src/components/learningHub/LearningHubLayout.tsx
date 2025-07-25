
import React from 'react';
import { Outlet } from 'react-router-dom';

const LearningHubLayout: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <Outlet />
    </div>
  );
};

export default LearningHubLayout;
