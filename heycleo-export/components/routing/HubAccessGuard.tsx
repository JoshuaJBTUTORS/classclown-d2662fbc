import { useAuth } from '@/contexts/AuthContext';
import ComingSoon from '@/pages/ComingSoon';
import { Loader2 } from 'lucide-react';

interface HubAccessGuardProps {
  children: React.ReactNode;
}

export const HubAccessGuard = ({ children }: HubAccessGuardProps) => {
  const { hasCleoHubAccess, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have hub access, show coming soon page
  if (!hasCleoHubAccess) {
    return <ComingSoon />;
  }

  // User has access, render the children
  return <>{children}</>;
};
