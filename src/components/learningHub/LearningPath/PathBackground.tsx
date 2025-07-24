import React from 'react';
import { motion } from 'framer-motion';

interface PathBackgroundProps {
  theme: 'desert' | 'forest' | 'space' | 'ocean';
  width: number;
  height: number;
}

const PathBackground: React.FC<PathBackgroundProps> = ({ theme, width, height }) => {
  const getBackgroundGradient = () => {
    const gradients = {
      desert: 'from-yellow-100 via-orange-50 to-red-100',
      forest: 'from-green-100 via-emerald-50 to-teal-100',
      space: 'from-purple-900 via-blue-900 to-black',
      ocean: 'from-blue-100 via-cyan-50 to-teal-100'
    };
    
    return gradients[theme];
  };
  
  const generateDecorations = () => {
    const decorations = [];
    const decorationCount = Math.floor((width * height) / 50000); // Density based on area
    
    for (let i = 0; i < decorationCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const scale = 0.5 + Math.random() * 0.5;
      const opacity = 0.1 + Math.random() * 0.3;
      
      decorations.push(
        <motion.g
          key={i}
          transform={`translate(${x}, ${y}) scale(${scale})`}
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          transition={{ duration: 2, delay: Math.random() * 2 }}
        >
          {renderThemeDecoration(theme, i)}
        </motion.g>
      );
    }
    
    return decorations;
  };
  
  const renderThemeDecoration = (theme: string, index: number) => {
    const decorationType = index % 3;
    
    switch (theme) {
      case 'desert':
        if (decorationType === 0) {
          // Cactus
          return (
            <g fill="#10B981">
              <ellipse cx="0" cy="15" rx="3" ry="15" />
              <ellipse cx="-8" cy="5" rx="2" ry="8" />
              <ellipse cx="8" cy="8" rx="2" ry="6" />
            </g>
          );
        } else if (decorationType === 1) {
          // Rock
          return (
            <ellipse cx="0" cy="0" rx="8" ry="5" fill="#92400E" />
          );
        } else {
          // Sand dune
          return (
            <path d="M -10,0 Q 0,-5 10,0 Q 15,2 20,0" fill="#F59E0B" opacity="0.3" />
          );
        }
        
      case 'forest':
        if (decorationType === 0) {
          // Tree
          return (
            <g>
              <rect x="-1" y="10" width="2" height="8" fill="#92400E" />
              <circle cx="0" cy="5" r="8" fill="#10B981" />
            </g>
          );
        } else if (decorationType === 1) {
          // Bush
          return (
            <ellipse cx="0" cy="10" rx="6" ry="4" fill="#059669" />
          );
        } else {
          // Flower
          return (
            <g>
              <circle cx="0" cy="0" r="2" fill="#F59E0B" />
              <circle cx="-3" cy="-2" r="1.5" fill="#EC4899" />
              <circle cx="3" cy="-2" r="1.5" fill="#EC4899" />
              <circle cx="-2" cy="3" r="1.5" fill="#EC4899" />
              <circle cx="2" cy="3" r="1.5" fill="#EC4899" />
            </g>
          );
        }
        
      case 'space':
        if (decorationType === 0) {
          // Star
          return (
            <path 
              d="M 0,-8 L 2,-2 L 8,-2 L 3,2 L 5,8 L 0,4 L -5,8 L -3,2 L -8,-2 L -2,-2 Z" 
              fill="#FCD34D" 
            />
          );
        } else if (decorationType === 1) {
          // Planet
          return (
            <circle cx="0" cy="0" r="6" fill="#8B5CF6" opacity="0.7" />
          );
        } else {
          // Nebula cloud
          return (
            <ellipse cx="0" cy="0" rx="12" ry="6" fill="#A855F7" opacity="0.2" />
          );
        }
        
      case 'ocean':
        if (decorationType === 0) {
          // Seaweed
          return (
            <path 
              d="M 0,15 Q -3,10 0,5 Q 3,0 0,-5" 
              stroke="#059669" 
              strokeWidth="2" 
              fill="none"
            />
          );
        } else if (decorationType === 1) {
          // Coral
          return (
            <g fill="#F97316">
              <circle cx="0" cy="0" r="3" />
              <circle cx="-4" cy="-2" r="2" />
              <circle cx="4" cy="-1" r="2" />
              <circle cx="0" cy="-5" r="1.5" />
            </g>
          );
        } else {
          // Wave
          return (
            <path 
              d="M -10,0 Q -5,-3 0,0 Q 5,3 10,0" 
              stroke="#0891B2" 
              strokeWidth="1" 
              fill="none"
              opacity="0.5"
            />
          );
        }
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()}`}>
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          {/* Add pattern definitions for texture */}
          <pattern id={`${theme}-texture`} patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="transparent" />
            {theme === 'space' && (
              <>
                <circle cx="20" cy="20" r="1" fill="white" opacity="0.6" />
                <circle cx="80" cy="40" r="0.5" fill="white" opacity="0.4" />
                <circle cx="60" cy="80" r="1.5" fill="white" opacity="0.5" />
                <circle cx="30" cy="70" r="0.8" fill="white" opacity="0.3" />
              </>
            )}
          </pattern>
        </defs>
        
        {/* Background texture */}
        <rect width={width} height={height} fill={`url(#${theme}-texture)`} />
        
        {/* Decorative elements */}
        {generateDecorations()}
      </svg>
    </div>
  );
};

export default PathBackground;