import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Blocks parents and students from using the app until they have completed
 * the welcome onboarding (details + platform tour).
 */
const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole, profile, loading } = useAuth();
  const location = useLocation();

  if (loading || (user && !userRole)) return <>{children}</>;

  const needsOnboarding =
    !!user &&
    (userRole === 'parent' || userRole === 'student') &&
    profile != null &&
    !profile.onboarding_completed;

  if (needsOnboarding && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGate;
