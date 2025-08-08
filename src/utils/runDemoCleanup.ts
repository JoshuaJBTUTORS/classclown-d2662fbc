import { supabase } from '@/integrations/supabase/client';

/**
 * Runs the cleanup-demo-data edge function once per browser (guarded by localStorage)
 * to remove all demo lessons and related demo entities from Supabase.
 */
export const runDemoCleanupOnce = async () => {
  if (typeof window === 'undefined') return;

  const FLAG_KEY = 'demoCleanupRan';
  if (localStorage.getItem(FLAG_KEY) === 'true') {
    console.log('🧹 Demo cleanup already executed in this browser. Skipping.');
    return;
  }

  try {
    console.log('🧹 Invoking cleanup-demo-data edge function to remove demo lessons...');
    const { data, error } = await supabase.functions.invoke('cleanup-demo-data');

    if (error) {
      console.error('❌ Cleanup failed:', error);
      return;
    }

    console.log('✅ Cleanup completed:', data);
    localStorage.setItem(FLAG_KEY, 'true');
  } catch (e) {
    console.error('❌ Unexpected error during demo cleanup:', e);
  }
};

// Auto-run on import (one-time guarded)
runDemoCleanupOnce();
