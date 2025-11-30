export interface LearningPath {
  id: string;
  name: string;
  description?: string;
  theme: 'desert' | 'forest' | 'space' | 'ocean';
  path_config: PathConfig;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PathConfig {
  pathType: 'spiral' | 'zigzag' | 'linear' | 'organic';
  spacing: number;
  curvature: number;
  backgroundElements?: PathBackgroundElement[];
}

export interface PathBackgroundElement {
  type: 'tree' | 'rock' | 'cloud' | 'star' | 'cactus';
  x: number;
  y: number;
  scale: number;
}

export interface PathWaypoint {
  id: string;
  course: CourseWithPath;
  position: WaypointPosition;
  status: WaypointStatus;
  isUnlocked: boolean;
  progress: number;
}

export interface WaypointPosition {
  x: number;
  y: number;
  angle: number;
}

export interface CourseWithPath {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  status: 'draft' | 'published' | 'archived';
  subject?: string;
  difficulty_level?: string;
  price?: number;
  path_position: number;
  prerequisites: string[];
  unlock_requirements: UnlockRequirements;
  created_at: string;
  updated_at: string;
}

export interface UnlockRequirements {
  minProgress?: number;
  requiredCourses?: string[];
  requiredAssessments?: string[];
}

export type WaypointStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface PathViewport {
  centerX: number;
  centerY: number;
  zoom: number;
  width: number;
  height: number;
}

export interface PathTheme {
  background: string;
  pathColor: string;
  waypointColors: {
    locked: string;
    available: string;
    inProgress: string;
    completed: string;
  };
  decorations: PathDecoration[];
}

export interface PathDecoration {
  id: string;
  type: string;
  color: string;
  size: number;
}