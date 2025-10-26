
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';

const AuthRedirect = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If user is authenticated, redirect ALL users to learning hub dashboard
  if (user) {
    return <Navigate to="/learning-hub" replace />;
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
};

export default AuthRedirect;
