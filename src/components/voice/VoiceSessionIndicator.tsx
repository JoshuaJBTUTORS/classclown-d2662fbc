import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
interface VoiceQuota {
  minutes_remaining?: number;
  bonus_minutes?: number;
  total_minutes_allowed?: number;
}
interface VoiceSessionIndicatorProps {
  showSubscriptionPrompt?: boolean;
}
export const VoiceSessionIndicator = ({
  showSubscriptionPrompt = false
}: VoiceSessionIndicatorProps) => {
  const [quota, setQuota] = useState<VoiceQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    fetchQuota();
  }, []);
  const fetchQuota = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date().toISOString();
      const {
        data,
        error
      } = await supabase.from('voice_session_quotas').select('minutes_remaining, bonus_minutes, total_minutes_allowed').eq('user_id', user.id).lte('period_start', now).gte('period_end', now).single();
      if (error) {
        console.error('Error fetching quota:', error);
        return;
      }

      // Type assertion needed until Supabase types are regenerated
      setQuota(data as unknown as VoiceQuota);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading || !quota) return null;
  const totalRemaining = (quota.minutes_remaining || 0) + (quota.bonus_minutes || 0);
  const percentRemaining = quota.total_minutes_allowed ? totalRemaining / quota.total_minutes_allowed * 100 : 0;
  const getColorClass = () => {
    if (percentRemaining > 50) return 'bg-mint-50 text-mint-700 border-mint-200';
    if (percentRemaining > 20) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  // Show subscription prompt if enabled and user has 0 minutes
  if (showSubscriptionPrompt && totalRemaining === 0) {
    return <div className="w-full">
        {/* Prominent subscription banner */}
        <div className="bg-gradient-to-r from-mint-50 to-mint-100 border-2 border-mint-300 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚡</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-mint-900 mb-2">
                You're out of learning time! 🦊
              </h3>
              <p className="text-sm text-mint-700 mb-4">
                Subscribe to continue learning with Cleo's AI voice lessons. Plans start from just £9.99/month.
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                
                <Button onClick={() => navigate('/heycleo/subscription')} variant="outline" className="rounded-full border-mint-300 text-mint-700 hover:bg-mint-50">
                  Manage Subscription
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Still show the minute indicator below */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${getColorClass()}`}>
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">
            0 mins
          </span>
        </div>
      </div>;
  }
  return <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${getColorClass()}`}>
      <Zap className="h-4 w-4" />
      <span className="text-sm font-medium">
        {totalRemaining} min{totalRemaining !== 1 ? 's' : ''}
      </span>
    </div>;
};