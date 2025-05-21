
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: AppRole[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If specific roles are required, check if user has one of them
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    // User is authenticated but doesn't have the required role
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // If user is already logged in and tries to access auth page, redirect to home
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  // If there are children, render them, otherwise render the outlet
  return <>{children || <Outlet />}</>;
}
