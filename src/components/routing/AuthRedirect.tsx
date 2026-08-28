import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AuthRedirect = () => {
  const { user, userRole, loading } = useAuth();

  // Wait for role resolution as well as session resolution. Previously the
  // root route briefly saw an authenticated user with no role and redirected
  // permanently to Calendar before the role query completed.
  if (loading || (user && !userRole)) {
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
      return <Navigate to="/heycleo" replace />;
    }

    // Admins and owners land on Agent Cleo
    if (userRole === 'admin' || userRole === 'owner') {
      return <Navigate to="/agent-cleo" replace />;
    }

    // All other authenticated users (parents, students, tutors) go to Calendar
    return <Navigate to="/calendar" replace />;
  }

  // If user is not authenticated, go straight to the sign-in page
  return <Navigate to="/auth" replace />;
};

export default AuthRedirect;
