import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Volume2, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { VoiceSessionIndicator } from '@/components/voice/VoiceSessionIndicator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface VoiceControlsProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  conversationId?: string;
  onToggleMute?: () => void;
  isMuted?: boolean;
  isConnecting?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isConnected,
  isListening,
  isSpeaking,
  onConnect,
  onDisconnect,
  conversationId,
  onToggleMute,
  isMuted,
  isConnecting,
}) => {
  const [sessionsRemaining, setSessionsRemaining] = useState<number | null>(null);
  const [hasQuota, setHasQuota] = useState(false);
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
        .select('sessions_remaining, bonus_sessions, minutes_remaining, bonus_minutes')
        .eq('user_id', user.id)
        .lte('period_start', now)
        .gte('period_end', now)
        .single();

      if (error) {
        console.error('Error fetching quota:', error);
        return;
      }

      const totalSessions = (data?.sessions_remaining || 0) + (data?.bonus_sessions || 0);
      const totalMinutes = (data?.minutes_remaining || 0) + (data?.bonus_minutes || 0);
      
      setSessionsRemaining(totalSessions);
      // User has quota if they have either sessions OR minutes available
      setHasQuota(totalSessions > 0 || totalMinutes > 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!hasQuota) {
      toast({
        title: "No quota available",
        description: "You've used all your voice time. Subscribe or purchase more to continue learning!",
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

      {!isConnected ? (
        /* Connect Button or Loading State */
        <div className="flex flex-col items-center gap-3">
          {isConnecting ? (
            /* Loading State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  🧑🏻‍🔬
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Connecting to Cleo...</p>
                <p className="text-xs text-muted-foreground mt-1">This will only take a moment</p>
              </div>
            </motion.div>
          ) : (
            /* Connect Button */
            <>
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
              
              {!hasQuota && !loading && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No quota remaining</p>
                  <Link to="/pricing">
                    <Button variant="outline" size="sm">
                      Get More Time
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Status Indicator & Stop Button */
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
            {onToggleMute && (
              <Button
                onClick={onToggleMute}
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
                className={`${
                  isMuted 
                    ? 'bg-destructive text-destructive-foreground' 
                    : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Mute
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={onDisconnect}
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
