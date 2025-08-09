
import React from 'react';
import LearningHubAccessControl from './LearningHubAccessControl';

interface CourseAccessControlProps {
  courseId?: string;
  children: React.ReactNode;
}

// This component now acts as a wrapper for the new LearningHubAccessControl
const CourseAccessControl: React.FC<CourseAccessControlProps> = ({ children }) => {
  return <LearningHubAccessControl>{children}</LearningHubAccessControl>;
};

export default CourseAccessControl;
