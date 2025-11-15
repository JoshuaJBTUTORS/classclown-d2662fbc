import { Navigate, useLocation } from 'react-router-dom';
import { isCleoIO } from '@/utils/domainConfig';

interface DomainRouteGuardProps {
  children: React.ReactNode;
}

export const DomainRouteGuard = ({ children }: DomainRouteGuardProps) => {
  const location = useLocation();
  
  // If on heycleo.io and trying to access non-learning-hub routes, redirect
  if (isCleoIO() && !location.pathname.startsWith('/learning-hub') && location.pathname !== '/auth') {
    return <Navigate to="/learning-hub" replace />;
  }
  
  return <>{children}</>;
};
