import React from 'react';
import { motion } from 'framer-motion';

interface EnhancedPathBackgroundProps {
  className?: string;
}

const EnhancedPathBackground: React.FC<EnhancedPathBackgroundProps> = ({ className = '' }) => {
  // Generate floating particles
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      const delay = Math.random() * 4;
      const duration = 8 + Math.random() * 4;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const scale = 0.3 + Math.random() * 0.7;
      
      particles.push(
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary/10 rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, scale, 0],
            y: [-20, -100],
            x: [0, Math.random() * 40 - 20],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      );
    }
    return particles;
  };

  // Generate geometric decorations
  const generateDecorations = () => {
    const decorations = [];
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.5;
      const x = (i % 4) * 25 + 10;
      const y = Math.floor(i / 4) * 50 + 20;
      
      decorations.push(
        <motion.div
          key={`decoration-${i}`}
          className="absolute"
          style={{
            left: `${x}%`,
            top: `${y}%`,
          }}
          initial={{ opacity: 0, rotate: 0 }}
          animate={{
            opacity: [0, 0.1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 12,
            delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {i % 3 === 0 ? (
            // Hexagon
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary/20">
              <polygon 
                points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
              />
            </svg>
          ) : i % 3 === 1 ? (
            // Triangle
            <svg width="20" height="20" viewBox="0 0 20 20" className="text-primary/15">
              <polygon 
                points="10,2 18,16 2,16" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
              />
            </svg>
          ) : (
            // Circle
            <svg width="16" height="16" viewBox="0 0 16 16" className="text-primary/10">
              <circle 
                cx="8" 
                cy="8" 
                r="6" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
              />
            </svg>
          )}
        </motion.div>
      );
    }
    return decorations;
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />
      
      {/* Animated Mesh Gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        initial={{ scale: 1, rotate: 0 }}
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `
            radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, hsl(var(--primary) / 0.06) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {generateParticles()}
      </div>
      
      {/* Geometric Decorations */}
      <div className="absolute inset-0">
        {generateDecorations()}
      </div>
      
      {/* Subtle Noise Texture */}
      <motion.div
        className="absolute inset-0 opacity-[0.015]"
        initial={{ x: 0, y: 0 }}
        animate={{ 
          x: [0, 10, 0],
          y: [0, 8, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Edge Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />
    </div>
  );
};

export default EnhancedPathBackground;