import React from 'react';
import { motion } from 'framer-motion';

interface PathLineProps {
  pathData: string;
  theme: 'desert' | 'forest' | 'space' | 'ocean';
  progress: number; // 0-100, how much of the path is "completed"
}

const PathLine: React.FC<PathLineProps> = ({ pathData, theme, progress }) => {
  const getThemeColors = () => {
    const themes = {
      desert: {
        base: '#D97706',
        completed: '#059669',
        glow: '#FEF3C7'
      },
      forest: {
        base: '#065F46',
        completed: '#059669',
        glow: '#D1FAE5'
      },
      space: {
        base: '#7C3AED',
        completed: '#F59E0B',
        glow: '#EDE9FE'
      },
      ocean: {
        base: '#0891B2',
        completed: '#059669',
        glow: '#CFFAFE'
      }
    };
    
    return themes[theme];
  };
  
  const colors = getThemeColors();
  
  return (
    <g className="path-container">
      {/* Glow effect */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={colors.glow}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
        className="filter blur-sm"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* Base path */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={colors.base}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
      />
      
      {/* Completed progress path */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={colors.completed}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: progress / 100 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 1 }}
      />
      
      {/* Animated particles along the path */}
      {progress > 0 && (
        <motion.circle
          r="3"
          fill={colors.completed}
          opacity="0.8"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: `${progress}%` }}
          transition={{ 
            duration: 3, 
            ease: "easeInOut",
            delay: 1.5,
            repeat: Infinity,
            repeatType: "loop"
          }}
          style={{
            offsetPath: `path('${pathData}')`,
            offsetRotate: 'auto'
          }}
        />
      )}
    </g>
  );
};

export default PathLine;