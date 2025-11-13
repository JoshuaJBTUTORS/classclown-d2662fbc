import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceQuota {
  minutes_remaining: number;
  bonus_minutes: number;
  total_minutes_allowed: number;
}

export const VoiceSessionIndicator = () => {
  const [quota, setQuota] = useState<VoiceQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('voice_session_quotas')
        .select('*')
        .eq('user_id', user.id)
        .lte('period_start', now)
        .gte('period_end', now)
        .single();

      if (error) {
        console.error('Error fetching quota:', error);
        return;
      }

      setQuota(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quota) return null;

  const totalRemaining = (quota.minutes_remaining || 0) + (quota.bonus_minutes || 0);
  const percentRemaining = quota.total_minutes_allowed 
    ? (totalRemaining / quota.total_minutes_allowed) * 100 
    : 0;

  const getColorClass = () => {
    if (percentRemaining > 50) return 'bg-mint-50 text-mint-700 border-mint-200';
    if (percentRemaining > 20) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${getColorClass()}`}>
      <Zap className="h-4 w-4" />
      <span className="text-sm font-medium">
        {totalRemaining} min{totalRemaining !== 1 ? 's' : ''}
      </span>
    </div>
  );
};
