import { useQuery } from '@tanstack/react-query';
import {
  getAdminCleoStats,
  getCleoUsers,
  getCleoUserDetail,
  getConversationDetail,
} from '@/services/adminCleoTrackerService';
import { CleoUserFilters } from '@/types/adminCleoTracker';

export const useAdminCleoStats = () => {
  return useQuery({
    queryKey: ['admin-cleo-stats'],
    queryFn: getAdminCleoStats,
    staleTime: 30000, // 30 seconds
  });
};

export const useCleoUsers = (filters: CleoUserFilters = {}) => {
  return useQuery({
    queryKey: ['cleo-users', filters],
    queryFn: () => getCleoUsers(filters),
    staleTime: 30000,
  });
};

export const useCleoUserDetail = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['cleo-user-detail', userId],
    queryFn: () => userId ? getCleoUserDetail(userId) : null,
    enabled: !!userId,
  });
};

export const useConversationDetail = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: ['conversation-detail', conversationId],
    queryFn: () => conversationId ? getConversationDetail(conversationId) : null,
    enabled: !!conversationId,
  });
};
