
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NetlessService } from '@/services/netlessService';
import { toast } from 'sonner';

interface NetlessCredentials {
  roomUuid: string;
  roomToken: string;
  appIdentifier: string;
}

// The correct Netless App Identifier - always use this
const CORRECT_NETLESS_APP_IDENTIFIER = 'TORbYEt7EfCzGuPZ97oCJA/9M23Doi-qTMNAg';

export const useNetlessCredentials = (lessonId: string, userRole: 'tutor' | 'student') => {
  const [credentials, setCredentials] = useState<NetlessCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) {
      console.log('useNetlessCredentials: No lesson ID provided');
      setIsLoading(false);
      return;
    }
    loadCredentials();
  }, [lessonId, userRole]);

  const loadCredentials = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('useNetlessCredentials: Loading credentials for lesson:', lessonId, 'role:', userRole);

      // Since netless columns were removed, we need to generate new credentials
      // This hook is now deprecated and should return an error
      console.log('useNetlessCredentials: Netless whiteboard is no longer supported - only Flexible Classroom is available');
      setError('Netless whiteboard is no longer supported. Please use Agora Flexible Classroom.');
      
    } catch (err) {
      console.error('useNetlessCredentials: Error loading credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to load whiteboard configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateToken = async () => {
    console.log('useNetlessCredentials: Regenerate token not supported - Netless is deprecated');
    setError('Netless whiteboard is no longer supported. Please use Agora Flexible Classroom.');
  };

  return {
    credentials: null,
    isLoading: false,
    error: 'Netless whiteboard is no longer supported. Please use Agora Flexible Classroom.',
    regenerateToken
  };
};
