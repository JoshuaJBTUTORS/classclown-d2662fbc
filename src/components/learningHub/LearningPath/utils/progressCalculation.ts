import { CourseWithPath, WaypointStatus } from '@/types/learningPath';

export const calculateWaypointStatus = (
  course: CourseWithPath,
  userProgress: Record<string, number>,
  completedCourses: string[]
): WaypointStatus => {
  const courseProgress = userProgress[course.id] || 0;
  
  // Check if course is completed
  if (completedCourses.includes(course.id) || courseProgress >= 100) {
    return 'completed';
  }
  
  // Check if course is in progress
  if (courseProgress > 0) {
    return 'in_progress';
  }
  
  // All courses are always available
  return 'available';
};

export const isWaypointUnlocked = (
  course: CourseWithPath,
  completedCourses: string[],
  userProgress: Record<string, number>
): boolean => {
  // All courses are always unlocked
  return true;
};

export const calculateOverallProgress = (
  userProgress: Record<string, number>,
  completedCourses: string[]
): number => {
  const progressValues = Object.values(userProgress);
  if (progressValues.length === 0) return 0;
  
  const totalProgress = progressValues.reduce((sum, progress) => sum + progress, 0);
  return Math.round(totalProgress / progressValues.length);
};

export const getNextAvailableCourse = (
  courses: CourseWithPath[],
  userProgress: Record<string, number>,
  completedCourses: string[]
): CourseWithPath | null => {
  const sortedCourses = [...courses].sort((a, b) => a.path_position - b.path_position);
  
  for (const course of sortedCourses) {
    const status = calculateWaypointStatus(course, userProgress, completedCourses);
    if (status === 'available' || status === 'in_progress') {
      return course;
    }
  }
  
  return null;
};

export const calculatePathCompletion = (
  courses: CourseWithPath[],
  completedCourses: string[]
): number => {
  if (courses.length === 0) return 0;
  
  const completedCount = courses.filter(course => 
    completedCourses.includes(course.id)
  ).length;
  
  return Math.round((completedCount / courses.length) * 100);
};