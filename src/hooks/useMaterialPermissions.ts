import { useAuth } from '@/contexts/AuthContext';

export const useMaterialPermissions = () => {
  const { user, isOwner, isAdmin, isTutor } = useAuth();

  const canUpload = () => {
    if (!user) return false;
    // Tutors, admins, and owners can upload materials
    return isTutor || isAdmin || isOwner;
  };

  const canDelete = () => {
    if (!user) return false;
    // Only admins and owners can delete materials
    return isAdmin || isOwner;
  };

  const canEdit = (materialCreatedBy?: string) => {
    if (!user) return false;
    // Users can edit their own materials, admins/owners can edit all
    return isAdmin || isOwner || (materialCreatedBy === user.id);
  };

  const canView = () => {
    if (!user) return false;
    // All authenticated users can view materials
    return true;
  };

  return {
    canUpload: canUpload(),
    canDelete: canDelete(),
    canEdit,
    canView: canView()
  };
};