import React from 'react';
import { motion } from 'framer-motion';
import { generateRoadSegments } from './utils/pathGeneration';
import { WaypointPosition } from '@/types/learningPath';

interface PathLineProps {
  pathData: string;
  positions: WaypointPosition[];
  theme: 'desert' | 'forest' | 'space' | 'ocean';
  progress: number; // 0-100, how much of the path is "completed"
}

const PathLine: React.FC<PathLineProps> = ({ pathData, positions, theme, progress }) => {
  const getThemeColors = () => {
    const themes = {
      desert: {
        roadBase: '#8B5A3C',
        roadEdge: '#654321',
        roadMarkings: '#F5DEB3',
        completed: '#059669',
        glow: '#FEF3C7',
        roadShadow: '#4A3B2A'
      },
      forest: {
        roadBase: '#556B2F',
        roadEdge: '#2F4F2F',
        roadMarkings: '#F5FFFA',
        completed: '#059669',
        glow: '#D1FAE5',
        roadShadow: '#1F2F1F'
      },
      space: {
        roadBase: '#4B0082',
        roadEdge: '#2E003E',
        roadMarkings: '#E6E6FA',
        completed: '#F59E0B',
        glow: '#EDE9FE',
        roadShadow: '#1A001A'
      },
      ocean: {
        roadBase: '#1E6091',
        roadEdge: '#1B4F72',
        roadMarkings: '#F0F8FF',
        completed: '#059669',
        glow: '#CFFAFE',
        roadShadow: '#0B2A3E'
      }
    };
    
    return themes[theme];
  };
  
  const colors = getThemeColors();
  const roadSegments = generateRoadSegments(positions);
  
  return (
    <g className="path-container">
      {/* Road shadows */}
      {roadSegments.map((segment, index) => (
        <motion.path
          key={`shadow-${index}`}
          d={segment.roadPath}
          fill={colors.roadShadow}
          opacity="0.3"
          transform="translate(2, 2)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      ))}
      
      {/* Road base */}
      {roadSegments.map((segment, index) => (
        <motion.path
          key={`road-${index}`}
          d={segment.roadPath}
          fill={colors.roadBase}
          stroke={colors.roadEdge}
          strokeWidth="2"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
          style={{ transformOrigin: "center" }}
        />
      ))}
      
      {/* Road markings */}
      {roadSegments.map((segment, index) => 
        segment.markings.map((marking, markIndex) => (
          <motion.path
            key={`marking-${index}-${markIndex}`}
            d={marking}
            stroke={colors.roadMarkings}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10 20"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ 
              duration: 1, 
              delay: index * 0.1 + markIndex * 0.05,
              ease: "easeOut" 
            }}
          />
        ))
      )}
      
      {/* Completed progress overlay */}
      {roadSegments.slice(0, Math.floor((roadSegments.length * progress) / 100)).map((segment, index) => (
        <motion.path
          key={`completed-${index}`}
          d={segment.roadPath}
          fill={colors.completed}
          opacity="0.4"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1, delay: 1 + index * 0.1, ease: "easeOut" }}
          style={{ transformOrigin: "center" }}
        />
      ))}
      
      {/* Animated progress indicator */}
      {progress > 0 && (
        <motion.circle
          r="8"
          fill={colors.completed}
          stroke={colors.roadMarkings}
          strokeWidth="2"
          opacity="0.9"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: `${progress}%` }}
          transition={{ 
            duration: 4, 
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
      
      {/* Road glow effect */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={colors.glow}
        strokeWidth="60"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.1"
        className="filter blur-lg"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </g>
  );
};

export default PathLine;