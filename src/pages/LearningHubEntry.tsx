
import React from 'react';
import { Navigate } from 'react-router-dom';

// This component redirects the old /learning-hub route to the new dashboard
const LearningHubEntry = () => {
  return <Navigate to="/heycleo" replace />;
};

export default LearningHubEntry;
