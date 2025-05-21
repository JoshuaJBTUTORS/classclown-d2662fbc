
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <Shield className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          {userRole 
            ? `You don't have permission to access this page. Your current role (${userRole}) does not have the required permissions.`
            : "You don't have permission to access this page."}
        </p>
        <div className="flex flex-col gap-4">
          <Button onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
