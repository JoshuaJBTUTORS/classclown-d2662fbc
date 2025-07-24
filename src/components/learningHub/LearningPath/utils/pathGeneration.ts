import { PathWaypoint, WaypointPosition, CourseWithPath, PathConfig } from '@/types/learningPath';

export const generateWaypointPositions = (
  courses: CourseWithPath[],
  config: PathConfig,
  containerWidth: number = 1200,
  containerHeight: number = 800
): WaypointPosition[] => {
  const sortedCourses = [...courses].sort((a, b) => a.path_position - b.path_position);
  const positions: WaypointPosition[] = [];
  
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const spacing = config.spacing || 120;
  
  switch (config.pathType) {
    case 'spiral':
      return generateSpiralPath(sortedCourses.length, centerX, centerY, spacing, config.curvature || 0.3);
    
    case 'zigzag':
      return generateZigzagPath(sortedCourses.length, centerX, centerY, spacing);
    
    case 'linear':
      return generateLinearPath(sortedCourses.length, centerX, centerY, spacing);
    
    case 'organic':
      return generateOrganicPath(sortedCourses.length, centerX, centerY, spacing, config.curvature || 0.5);
    
    default:
      return generateSpiralPath(sortedCourses.length, centerX, centerY, spacing, config.curvature || 0.3);
  }
};

const generateSpiralPath = (
  count: number,
  centerX: number,
  centerY: number,
  spacing: number,
  curvature: number
): WaypointPosition[] => {
  const positions: WaypointPosition[] = [];
  const spiralTightness = 0.5;
  
  for (let i = 0; i < count; i++) {
    const angle = i * curvature * Math.PI;
    const radius = spiralTightness * spacing * Math.sqrt(i + 1);
    
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    // Calculate the angle for the waypoint orientation
    const nextAngle = (i + 1) * curvature * Math.PI;
    const waypointAngle = angle + Math.PI / 2;
    
    positions.push({
      x,
      y,
      angle: waypointAngle
    });
  }
  
  return positions;
};

const generateZigzagPath = (
  count: number,
  centerX: number,
  centerY: number,
  spacing: number
): WaypointPosition[] => {
  const positions: WaypointPosition[] = [];
  const amplitude = spacing * 0.8;
  const frequency = 0.5;
  
  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(count - 1, 1);
    const y = centerY - (count * spacing * 0.5) + (i * spacing);
    const x = centerX + amplitude * Math.sin(i * frequency * Math.PI);
    
    positions.push({
      x,
      y,
      angle: 0
    });
  }
  
  return positions;
};

const generateLinearPath = (
  count: number,
  centerX: number,
  centerY: number,
  spacing: number
): WaypointPosition[] => {
  const positions: WaypointPosition[] = [];
  const totalHeight = (count - 1) * spacing;
  const startY = centerY - totalHeight / 2;
  
  for (let i = 0; i < count; i++) {
    positions.push({
      x: centerX,
      y: startY + i * spacing,
      angle: 0
    });
  }
  
  return positions;
};

const generateOrganicPath = (
  count: number,
  centerX: number,
  centerY: number,
  spacing: number,
  curvature: number
): WaypointPosition[] => {
  const positions: WaypointPosition[] = [];
  const curves = Math.floor(count / 4) + 1;
  
  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(count - 1, 1);
    const curvePhase = progress * curves * 2 * Math.PI;
    
    const x = centerX + spacing * curvature * Math.cos(curvePhase) * (1 + progress * 0.5);
    const y = centerY - (count * spacing * 0.5) + (i * spacing) + 
             spacing * 0.3 * Math.sin(curvePhase * 2);
    
    positions.push({
      x,
      y,
      angle: Math.atan2(
        Math.sin(curvePhase * 2) * 0.3,
        1 + curvature * Math.cos(curvePhase)
      )
    });
  }
  
  return positions;
};

export const generatePathLines = (positions: WaypointPosition[]): string => {
  if (positions.length < 2) return '';
  
  let pathData = `M ${positions[0].x} ${positions[0].y}`;
  
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    
    // Add smooth curves between waypoints
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    
    // Create control points for smooth curves
    const controlOffset = 20;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const perpX = -dy / distance * controlOffset;
      const perpY = dx / distance * controlOffset;
      
      pathData += ` Q ${midX + perpX} ${midY + perpY} ${curr.x} ${curr.y}`;
    } else {
      pathData += ` L ${curr.x} ${curr.y}`;
    }
  }
  
  return pathData;
};

export const calculateViewport = (
  positions: WaypointPosition[],
  containerWidth: number,
  containerHeight: number,
  padding: number = 100
) => {
  if (positions.length === 0) {
    return {
      centerX: containerWidth / 2,
      centerY: containerHeight / 2,
      zoom: 1,
      width: containerWidth,
      height: containerHeight
    };
  }
  
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  
  const pathWidth = maxX - minX + padding * 2;
  const pathHeight = maxY - minY + padding * 2;
  
  const scaleX = containerWidth / pathWidth;
  const scaleY = containerHeight / pathHeight;
  const zoom = Math.min(scaleX, scaleY, 1);
  
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    zoom,
    width: pathWidth,
    height: pathHeight
  };
};