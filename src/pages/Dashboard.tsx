
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Index from './Index';

const Dashboard = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect students and parents to progress page
  if (userRole === 'student' || userRole === 'parent') {
    return <Navigate to="/progress" replace />;
  }

  // Show admin dashboard for other roles
  return <Index />;
};

export default Dashboard;
