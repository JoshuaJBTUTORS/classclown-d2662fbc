
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';

const AuthRedirect = () => {
  const { user, userRole, hasCleoHubAccess, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If user is authenticated, apply routing logic
  if (user) {
    // learning_hub_only users ALWAYS go to learning hub (they're restricted)
    if (userRole === 'learning_hub_only') {
      return <Navigate to="/learning-hub" replace />;
    }
    
    // Other authenticated users: check feature flag
    if (hasCleoHubAccess) {
      return <Navigate to="/learning-hub" replace />;
    } else {
      // Users without Cleo hub access go to Calendar
      return <Navigate to="/calendar" replace />;
    }
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
};

export default AuthRedirect;
