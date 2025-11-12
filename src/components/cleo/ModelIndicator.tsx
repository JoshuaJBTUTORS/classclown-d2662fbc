import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';

interface ModelIndicatorProps {
  currentModel: 'mini' | 'full';
  className?: string;
}

export const ModelIndicator: React.FC<ModelIndicatorProps> = ({ currentModel, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${className}`}
      style={{
        background: currentModel === 'full' 
          ? 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)'
          : 'hsl(var(--muted))',
        color: currentModel === 'full' ? 'white' : 'hsl(var(--muted-foreground))'
      }}
    >
      {currentModel === 'full' ? (
        <>
          <Brain className="w-3.5 h-3.5" />
          <span>Deep Mode</span>
        </>
      ) : (
        <>
          <Zap className="w-3.5 h-3.5" />
          <span>Efficient Mode</span>
        </>
      )}
    </motion.div>
  );
};
