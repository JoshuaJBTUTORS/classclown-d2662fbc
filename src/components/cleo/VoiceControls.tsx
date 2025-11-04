import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceControlsProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isConnected,
  isListening,
  isSpeaking,
  onConnect,
  onDisconnect,
}) => {
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
    <div className="flex flex-col items-center gap-3">
      {/* Status Indicator */}
      {isConnected && (
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
      )}

      {/* Main Control Button */}
      {!isConnected ? (
        <Button
          onClick={onConnect}
          size="lg"
          className="gap-2 px-6 py-6 text-base font-semibold shadow-xl"
        >
          <Play className="w-5 h-5" />
          Start Learning
        </Button>
      ) : (
        <Button
          onClick={onDisconnect}
          size="lg"
          variant="destructive"
          className="gap-2 shadow-xl"
        >
          <Square className="w-4 h-4" />
          End Session
        </Button>
      )}
    </div>
  );
};
