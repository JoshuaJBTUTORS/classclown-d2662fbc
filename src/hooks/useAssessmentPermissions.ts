import { useAuth } from '@/contexts/AuthContext';
import { AIAssessment } from '@/services/aiAssessmentService';

export const useAssessmentPermissions = (assessment?: AIAssessment | null) => {
  const { user, isOwner } = useAuth();

  const canEdit = () => {
    if (!user || !assessment) return false;
    return isOwner || assessment.created_by === user.id;
  };

  const canView = () => {
    if (!user || !assessment) return false;
    
    // Owners and creators can always view
    if (isOwner || assessment.created_by === user.id) return true;
    
    // Others can only view published assessments
    return assessment.status === 'published';
  };

  const canTake = () => {
    if (!user || !assessment) return false;
    
    // Can't take archived assessments
    if (assessment.status === 'archived') return false;
    
    // Owners and creators can always take (for testing)
    if (isOwner || assessment.created_by === user.id) return true;
    
    // Others can only take published assessments
    return assessment.status === 'published';
  };

  const canPublish = () => {
    if (!user || !assessment) return false;
    return isOwner || assessment.created_by === user.id;
  };

  const canDelete = () => {
    if (!user || !assessment) return false;
    return isOwner || assessment.created_by === user.id;
  };

  return {
    canEdit: canEdit(),
    canView: canView(),
    canTake: canTake(),
    canPublish: canPublish(),
    canDelete: canDelete()
  };
};
