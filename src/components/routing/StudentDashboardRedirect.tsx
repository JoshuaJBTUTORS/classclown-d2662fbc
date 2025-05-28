
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Index from '@/pages/Index';

const StudentDashboardRedirect = () => {
  const { userRole } = useAuth();
  
  // If user is a student, redirect to progress page
  if (userRole === 'student') {
    return <Navigate to="/progress" replace />;
  }
  
  // For all other roles, show the dashboard
  return <Index />;
};

export default StudentDashboardRedirect;
