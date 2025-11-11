import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Volume2, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { VoiceSessionIndicator } from '@/components/voice/VoiceSessionIndicator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface VoiceControlsProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPaused?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onPause?: () => void;
  onResume?: () => void;
  conversationId?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isConnected,
  isListening,
  isSpeaking,
  isPaused,
  onConnect,
  onDisconnect,
  onPause,
  onResume,
  conversationId,
}) => {
  const [sessionsRemaining, setSessionsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkQuota();
  }, []);

  const checkQuota = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('voice_session_quotas')
        .select('sessions_remaining, bonus_sessions')
        .eq('user_id', user.id)
        .lte('period_start', now)
        .gte('period_end', now)
        .single();

      if (error) {
        console.error('Error fetching quota:', error);
        return;
      }

      const total = (data?.sessions_remaining || 0) + (data?.bonus_sessions || 0);
      setSessionsRemaining(total);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (sessionsRemaining === 0) {
      toast({
        title: "No sessions available",
        description: "You've used all your voice sessions. Buy more to continue learning!",
        variant: "destructive",
      });
      return;
    }

    onConnect();
  };

  useEffect(() => {
    if (!isConnected && sessionsRemaining !== null) {
      checkQuota();
    }
  }, [isConnected]);
  const getStatusColor = () => {
    if (!isConnected) return 'bg-muted';
    if (isListening) return 'bg-blue-500';
    if (isSpeaking) return 'bg-green-500';
    return 'bg-primary';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Start Learning';
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Cleo is speaking...';
    return 'Connected';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Quota Indicator */}
      {!loading && sessionsRemaining !== null && (
        <VoiceSessionIndicator />
      )}

      {!isConnected && !isPaused ? (
        /* Connect Button */
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleConnect}
              disabled={sessionsRemaining === 0 || loading}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Learning
            </Button>
          </motion.div>
          
          {sessionsRemaining === 0 && !loading && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">No sessions left</p>
              <Link to="/learning-hub/subscription">
                <Button variant="outline" size="sm">
                  Buy More Sessions
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : isPaused ? (
        /* Paused State: Show Resume Button */
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border bg-amber-100 text-amber-700 border-amber-400 text-sm font-medium"
          >
            <span>⏸️</span>
            <span>Paused</span>
          </motion.div>

          <div className="flex gap-2">
            <Button
              onClick={onResume}
              className="rounded-full px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              size="sm"
            >
              <Play className="w-4 h-4 mr-1" />
              Resume Learning
            </Button>

            <Button
              onClick={onDisconnect}
              variant="outline"
              size="sm"
              className="rounded-full px-6 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      ) : (
        /* Connected State: Show Status, Pause & Stop Buttons */
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <motion.div
              animate={{
                scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: isListening || isSpeaking ? Infinity : 0,
              }}
              className={`w-2 h-2 rounded-full ${getStatusColor()}`}
            />
            <span className="text-sm font-medium text-foreground">
              {getStatusText()}
            </span>
            {isSpeaking && <Volume2 className="w-4 h-4 text-green-500" />}
          </motion.div>
          
          <div className="flex gap-2">
            <Button
              onClick={onPause}
              variant="outline"
              size="sm"
              className="rounded-full px-4 hover:border-amber-400 hover:text-amber-600"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>

            <Button
              onClick={onDisconnect}
              variant="outline"
              size="sm"
              className="rounded-full px-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
