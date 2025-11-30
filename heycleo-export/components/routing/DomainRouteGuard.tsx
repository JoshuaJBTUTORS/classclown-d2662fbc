import { Navigate, useLocation } from 'react-router-dom';

interface DomainRouteGuardProps {
  children: React.ReactNode;
}

export const DomainRouteGuard = ({ children }: DomainRouteGuardProps) => {
  // No domain restrictions for Class Beyond - allow all routes
  return <>{children}</>;
};
