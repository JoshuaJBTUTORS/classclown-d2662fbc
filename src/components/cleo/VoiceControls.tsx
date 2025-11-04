import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
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
    if (!isConnected) return 'Start Voice Session';
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Cleo is speaking...';
    return 'Connected';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status Indicator */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-full px-6 py-3 shadow-lg flex items-center gap-3"
        >
          <motion.div
            animate={{
              scale: isListening || isSpeaking ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: isListening || isSpeaking ? Infinity : 0,
            }}
            className={`w-3 h-3 rounded-full ${getStatusColor()}`}
          />
          <span className="text-base font-medium text-foreground">
            {getStatusText()}
          </span>
          {isSpeaking && <Volume2 className="w-5 h-5 text-green-500" />}
        </motion.div>
      )}

      {/* Main Control Button */}
      <Button
        onClick={isConnected ? onDisconnect : onConnect}
        size="lg"
        className={`
          min-w-[200px] px-8 py-6 text-lg font-semibold shadow-xl
          ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}
        `}
      >
        {isConnected ? (
          <>
            <MicOff className="w-6 h-6 mr-3" />
            End Lesson
          </>
        ) : (
          <>
            <Mic className="w-6 h-6 mr-3" />
            Start Lesson
          </>
        )}
      </Button>
    </div>
  );
};
