
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TutorDashboard from '@/components/dashboard/TutorDashboard';
import StudentParentDashboard from '@/components/dashboard/StudentParentDashboard';

const Dashboard = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect learning hub users to learning hub
  if (userRole === 'learning_hub_only') {
    return <Navigate to="/learning-hub" replace />;
  }

  // Show role-specific dashboards
  switch (userRole) {
    case 'admin':
    case 'owner':
      return <AdminDashboard />;
    
    case 'tutor':
      return <TutorDashboard />;
    
    case 'student':
    case 'parent':
      return <StudentParentDashboard />;
    
    default:
      return <AdminDashboard />;
  }
};

export default Dashboard;
