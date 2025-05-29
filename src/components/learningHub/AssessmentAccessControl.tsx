
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AssessmentAccessControlProps {
  assessment: {
    id: string;
    status: 'draft' | 'published' | 'archived';
    created_by?: string;
  } | null | undefined;
  requiredAccess: 'view' | 'edit' | 'take';
  children: React.ReactNode;
}

const AssessmentAccessControl: React.FC<AssessmentAccessControlProps> = ({
  assessment,
  requiredAccess,
  children
}) => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="container py-8">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to access this assessment.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </div>
    );
  }

  // Handle loading state when assessment is undefined/null
  if (!assessment) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Check edit permissions
  if (requiredAccess === 'edit') {
    const canEdit = isOwner || assessment.created_by === user.id;
    if (!canEdit) {
      return (
        <div className="container py-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to edit this assessment. Only the assessment creator or owners can make changes.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => navigate('/learning-hub')}>
            Back to Learning Hub
          </Button>
        </div>
      );
    }
  }

  // Check view/take permissions for non-published assessments
  if ((requiredAccess === 'view' || requiredAccess === 'take') && assessment.status !== 'published') {
    const canAccess = isOwner || assessment.created_by === user.id;
    if (!canAccess) {
      return (
        <div className="container py-8">
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              This assessment is not published yet and cannot be accessed by students.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => navigate('/learning-hub')}>
            Back to Learning Hub
          </Button>
        </div>
      );
    }
  }

  // Check if assessment is archived
  if (assessment.status === 'archived' && requiredAccess === 'take') {
    return (
      <div className="container py-8">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This assessment has been archived and is no longer available for taking.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/learning-hub')}>
          Back to Learning Hub
        </Button>
      </div>
    );
  }

  // If all checks pass, render children
  return <>{children}</>;
};

export default AssessmentAccessControl;
