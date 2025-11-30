import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAppVersion = () => {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial version
    const fetchVersion = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_version')
        .single();

      if (error) {
        console.error('Error fetching app version:', error);
        return;
      }

      const serverVersion = data?.value;
      const storedVersion = localStorage.getItem('app_version');

      console.log('🚀 App version:', serverVersion);

      // If no stored version, this is first load
      if (!storedVersion) {
        localStorage.setItem('app_version', serverVersion);
        setCurrentVersion(serverVersion);
        return;
      }

      // Check for version mismatch
      if (storedVersion !== serverVersion) {
        console.log('⚠️ Version mismatch detected:', { stored: storedVersion, server: serverVersion });
        toast({
          title: "Updating app...",
          description: "New version detected. Refreshing in 2 seconds...",
        });

        // Wait 2 seconds then reload
        setTimeout(() => {
          localStorage.setItem('app_version', serverVersion);
          window.location.reload();
        }, 2000);
      } else {
        setCurrentVersion(serverVersion);
      }
    };

    fetchVersion();

    // Subscribe to version changes via Supabase realtime
    const channel = supabase
      .channel('app-version-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.app_version'
        },
        (payload) => {
          console.log('🔄 App version updated:', payload);
          const newVersion = payload.new.value;
          const storedVersion = localStorage.getItem('app_version');

          if (storedVersion !== newVersion) {
            toast({
              title: "App update available",
              description: "Refreshing in 2 seconds...",
            });

            setTimeout(() => {
              localStorage.setItem('app_version', newVersion);
              window.location.reload();
            }, 2000);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Version subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { currentVersion };
};
