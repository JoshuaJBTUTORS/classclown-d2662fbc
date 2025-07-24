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
  
  // Check if course is unlocked (prerequisites met)
  if (isWaypointUnlocked(course, completedCourses, userProgress)) {
    return 'available';
  }
  
  return 'locked';
};

export const isWaypointUnlocked = (
  course: CourseWithPath,
  completedCourses: string[],
  userProgress: Record<string, number>
): boolean => {
  // Always unlock the first course
  if (course.path_position <= 100) {
    return true;
  }
  
  // Check prerequisite courses
  if (course.prerequisites && course.prerequisites.length > 0) {
    const prerequisitesMet = course.prerequisites.every(prereqId => 
      completedCourses.includes(prereqId)
    );
    if (!prerequisitesMet) {
      return false;
    }
  }
  
  // Check unlock requirements
  if (course.unlock_requirements) {
    const { minProgress, requiredCourses } = course.unlock_requirements;
    
    // Check minimum progress requirement
    if (minProgress && typeof minProgress === 'number') {
      const overallProgress = calculateOverallProgress(userProgress, completedCourses);
      if (overallProgress < minProgress) {
        return false;
      }
    }
    
    // Check required courses
    if (requiredCourses && requiredCourses.length > 0) {
      const requiredCoursesMet = requiredCourses.every(courseId => 
        completedCourses.includes(courseId)
      );
      if (!requiredCoursesMet) {
        return false;
      }
    }
  }
  
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