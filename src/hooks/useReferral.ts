import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Referral {
  id: string;
  friend_name: string;
  friend_email: string | null;
  friend_phone: string | null;
  child_name: string | null;
  notes: string | null;
  status: string;
  source: string;
  created_at: string;
}

export interface NewReferralInput {
  friend_name: string;
  friend_email?: string;
  friend_phone?: string;
  child_name?: string;
  notes?: string;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomCode = (length = 6) =>
  Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

export const REFERRAL_BASE_URL = 'https://classclowncrm.com';

export const useReferral = () => {
  const { user, profile } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReferrals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('referrals')
      .select('id, friend_name, friend_email, friend_phone, child_name, notes, status, source, created_at')
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false });
    setReferrals((data as Referral[]) || []);
  }, [user]);

  const ensureCode = useCallback(async () => {
    if (!user) return null;

    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing?.code) {
      setCode(existing.code);
      return existing.code;
    }

    const prefix = (profile?.first_name || 'CBA').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CBA';

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `${prefix}${randomCode(4)}`;
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({ user_id: user.id, code: candidate })
        .select('code')
        .single();

      if (!error && data) {
        setCode(data.code);
        return data.code;
      }
      // Unique violation on user_id means a code was created concurrently
      if (error && error.code === '23505') {
        const { data: retry } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('user_id', user.id)
          .maybeSingle();
        if (retry?.code) {
          setCode(retry.code);
          return retry.code;
        }
      }
    }
    return null;
  }, [user, profile]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      await ensureCode();
      await loadReferrals();
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, ensureCode, loadReferrals]);

  const shareUrl = code ? `${REFERRAL_BASE_URL}/book-trial?ref=${code}` : '';

  const submitReferral = async (input: NewReferralInput) => {
    if (!user) return { success: false, error: 'You must be logged in' };

    const referralCode = code || (await ensureCode());

    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_user_id: user.id,
        referral_code: referralCode,
        friend_name: input.friend_name,
        friend_email: input.friend_email || null,
        friend_phone: input.friend_phone || null,
        child_name: input.child_name || null,
        notes: input.notes || null,
        source: 'form',
        status: 'invited',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating referral:', error);
      return { success: false, error: error.message };
    }

    try {
      await supabase.functions.invoke('send-referral-notification', {
        body: {
          referralId: data.id,
          referrerName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || user.email,
          referrerEmail: user.email,
          friendName: input.friend_name,
          friendEmail: input.friend_email || '',
          friendPhone: input.friend_phone || '',
          childName: input.child_name || '',
          notes: input.notes || '',
          referralCode,
        },
      });
    } catch (e) {
      console.error('Referral email failed (referral still saved):', e);
    }

    await loadReferrals();
    return { success: true };
  };

  return { code, shareUrl, referrals, isLoading, submitReferral, refresh: loadReferrals };
};
