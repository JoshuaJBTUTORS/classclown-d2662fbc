import React from 'react';
import { motion } from 'framer-motion';

interface VoiceWaveformProps {
  isActive: boolean;
  type: 'listening' | 'speaking';
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ isActive, type }) => {
  const bars = 5;
  const color = type === 'listening' ? 'bg-primary' : 'bg-accent';

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${color}`}
          animate={
            isActive
              ? {
                  height: [16, 48, 16],
                  opacity: [0.5, 1, 0.5],
                }
              : {
                  height: 16,
                  opacity: 0.3,
                }
          }
          transition={{
            duration: 0.6,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
