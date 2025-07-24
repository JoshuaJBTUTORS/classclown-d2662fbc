import React from 'react';
import { PathWaypoint } from '@/types/learningPath';

interface PathMinimapProps {
  waypoints: PathWaypoint[];
  currentPosition: { x: number; y: number };
  onNavigate: (position: { x: number; y: number }) => void;
  pathBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

const PathMinimap: React.FC<PathMinimapProps> = ({
  waypoints,
  currentPosition,
  onNavigate,
  pathBounds
}) => {
  const minimapSize = 120;
  const pathWidth = pathBounds.maxX - pathBounds.minX;
  const pathHeight = pathBounds.maxY - pathBounds.minY;
  
  // Calculate scale to fit path in minimap
  const scale = Math.min(
    (minimapSize - 20) / pathWidth,
    (minimapSize - 20) / pathHeight
  );
  
  const translateToMinimap = (x: number, y: number) => {
    const scaledX = (x - pathBounds.minX) * scale + 10;
    const scaledY = (y - pathBounds.minY) * scale + 10;
    return { x: scaledX, y: scaledY };
  };
  
  const translateFromMinimap = (x: number, y: number) => {
    const worldX = (x - 10) / scale + pathBounds.minX;
    const worldY = (y - 10) / scale + pathBounds.minY;
    return { x: worldX, y: worldY };
  };
  
  const handleMinimapClick = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const worldPos = translateFromMinimap(x, y);
    onNavigate(worldPos);
  };
  
  return (
    <div className="absolute bottom-4 right-4 z-20">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-medium text-gray-700">Map</span>
        </div>
        
        <svg
          width={minimapSize}
          height={minimapSize}
          className="border border-gray-200 rounded-lg cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50"
          onClick={handleMinimapClick}
        >
          {/* Path line */}
          {waypoints.length > 1 && (
            <path
              d={waypoints
                .map((waypoint, index) => {
                  const pos = translateToMinimap(waypoint.position.x, waypoint.position.y);
                  return `${index === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`;
                })
                .join(' ')}
              stroke="#94A3B8"
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
          )}
          
          {/* Waypoints */}
          {waypoints.map((waypoint, index) => {
            const pos = translateToMinimap(waypoint.position.x, waypoint.position.y);
            
            const getWaypointColor = () => {
              switch (waypoint.status) {
                case 'completed': return '#10B981';
                case 'in_progress': return '#3B82F6';
                case 'available': return '#F59E0B';
                case 'locked': return '#9CA3AF';
                default: return '#9CA3AF';
              }
            };
            
            return (
              <circle
                key={waypoint.id}
                cx={pos.x}
                cy={pos.y}
                r="3"
                fill={getWaypointColor()}
                stroke="white"
                strokeWidth="1"
                className="cursor-pointer hover:r-4 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate({ x: waypoint.position.x, y: waypoint.position.y });
                }}
              />
            );
          })}
          
          {/* Current viewport indicator */}
          <rect
            x={translateToMinimap(currentPosition.x - 200, currentPosition.y - 150).x}
            y={translateToMinimap(currentPosition.x - 200, currentPosition.y - 150).y}
            width={400 * scale}
            height={300 * scale}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.7"
          />
        </svg>
      </div>
    </div>
  );
};

export default PathMinimap;