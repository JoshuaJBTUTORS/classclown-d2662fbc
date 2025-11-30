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
  const spacing = Math.max(config.spacing || 150, 100); // Increased minimum spacing
  
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
  const minSpacing = spacing * 1.5; // Increased minimum spacing
  const spiralTightness = 0.8; // Looser spiral
  
  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(count - 1, 1);
    const angle = i * curvature * 2 * Math.PI; // More dramatic curves
    const radius = minSpacing + spiralTightness * spacing * (i + 1); // Linear + spiral growth
    
    // Add some randomness for more organic feel
    const randomOffset = Math.sin(i * 1.618) * spacing * 0.2;
    
    const x = centerX + (radius + randomOffset) * Math.cos(angle);
    const y = centerY + (radius + randomOffset) * Math.sin(angle);
    
    // Calculate direction for road orientation
    const nextI = Math.min(i + 1, count - 1);
    const nextAngle = nextI * curvature * 2 * Math.PI;
    const nextRadius = minSpacing + spiralTightness * spacing * (nextI + 1);
    const nextX = centerX + nextRadius * Math.cos(nextAngle);
    const nextY = centerY + nextRadius * Math.sin(nextAngle);
    
    const waypointAngle = Math.atan2(nextY - y, nextX - x);
    
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
  const waveFrequency = 0.8;
  const waveAmplitude = spacing * curvature * 2;
  const minSpacing = spacing * 1.2;
  
  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(count - 1, 1);
    const yPos = centerY - (count * minSpacing * 0.5) + (i * minSpacing);
    
    // Create flowing S-curves
    const wave1 = Math.sin(progress * Math.PI * waveFrequency) * waveAmplitude;
    const wave2 = Math.cos(progress * Math.PI * waveFrequency * 0.7) * waveAmplitude * 0.5;
    const xPos = centerX + wave1 + wave2;
    
    // Calculate road direction
    const nextProgress = Math.min((i + 1) / Math.max(count - 1, 1), 1);
    const nextWave1 = Math.sin(nextProgress * Math.PI * waveFrequency) * waveAmplitude;
    const nextWave2 = Math.cos(nextProgress * Math.PI * waveFrequency * 0.7) * waveAmplitude * 0.5;
    const nextXPos = centerX + nextWave1 + nextWave2;
    const nextYPos = centerY - (count * minSpacing * 0.5) + ((i + 1) * minSpacing);
    
    const angle = Math.atan2(nextYPos - yPos, nextXPos - xPos);
    
    positions.push({
      x: xPos,
      y: yPos,
      angle
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
    
    // Create smoother curves with better control points
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      // Use road-like curve calculation
      const controlDistance = Math.min(distance * 0.4, 60);
      const control1X = prev.x + (dx * 0.3) + Math.cos(prev.angle) * controlDistance;
      const control1Y = prev.y + (dy * 0.3) + Math.sin(prev.angle) * controlDistance;
      const control2X = curr.x - (dx * 0.3) - Math.cos(curr.angle) * controlDistance;
      const control2Y = curr.y - (dy * 0.3) - Math.sin(curr.angle) * controlDistance;
      
      pathData += ` C ${control1X} ${control1Y} ${control2X} ${control2Y} ${curr.x} ${curr.y}`;
    } else {
      pathData += ` L ${curr.x} ${curr.y}`;
    }
  }
  
  return pathData;
};

export const generateRoadSegments = (positions: WaypointPosition[]): Array<{
  path: string;
  roadPath: string;
  markings: string[];
}> => {
  if (positions.length < 2) return [];
  
  const segments = [];
  
  for (let i = 0; i < positions.length - 1; i++) {
    const start = positions[i];
    const end = positions[i + 1];
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Road width
    const roadWidth = 40;
    const halfWidth = roadWidth / 2;
    
    // Calculate road edges
    const perpX = Math.cos(angle + Math.PI / 2) * halfWidth;
    const perpY = Math.sin(angle + Math.PI / 2) * halfWidth;
    
    const roadPath = `
      M ${start.x - perpX} ${start.y - perpY}
      L ${end.x - perpX} ${end.y - perpY}
      L ${end.x + perpX} ${end.y + perpY}
      L ${start.x + perpX} ${start.y + perpY}
      Z
    `;
    
    // Center line markings
    const markings = [];
    const segments_count = Math.floor(distance / 30);
    for (let j = 0; j < segments_count; j++) {
      const progress = (j + 0.5) / segments_count;
      const markX = start.x + dx * progress;
      const markY = start.y + dy * progress;
      const markLength = 15;
      
      markings.push(`
        M ${markX - Math.cos(angle) * markLength / 2} ${markY - Math.sin(angle) * markLength / 2}
        L ${markX + Math.cos(angle) * markLength / 2} ${markY + Math.sin(angle) * markLength / 2}
      `);
    }
    
    segments.push({
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      roadPath,
      markings
    });
  }
  
  return segments;
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