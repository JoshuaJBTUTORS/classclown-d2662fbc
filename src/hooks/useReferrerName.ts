import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const cache = new Map<string, string | null>();

/**
 * Resolves the first name of the person who owns a referral code.
 * Returns null when there is no code, the code is unknown, or it is still loading.
 */
export function useReferrerName(code?: string | null) {
  const normalised = (code || '').trim().toUpperCase();
  const [name, setName] = useState<string | null>(
    normalised ? cache.get(normalised) ?? null : null
  );

  useEffect(() => {
    if (!normalised) {
      setName(null);
      return;
    }
    if (cache.has(normalised)) {
      setName(cache.get(normalised) ?? null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('resolve-referral-code', {
          body: { code: normalised },
        });
        if (error) throw error;
        const resolved = data?.found ? (data.firstName as string) : null;
        cache.set(normalised, resolved);
        if (!cancelled) setName(resolved);
      } catch (e) {
        console.error('Failed to resolve referral code', e);
        cache.set(normalised, null);
        if (!cancelled) setName(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalised]);

  return name;
}

export function getRefCodeFromUrl(): string {
  return new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase() || '';
}
