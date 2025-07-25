import { personalizedLearningPathService } from '@/services/personalizedLearningPathService';

/**
 * Utility to reset all user data including localStorage cache
 */
export const resetUserLearningData = async (userId: string) => {
  try {
    // Clear all personalized learning path cache for the user
    await personalizedLearningPathService.clearAllUserCache(userId);
    
    // Clear any other relevant localStorage items
    const keys = Object.keys(localStorage);
    const userKeys = keys.filter(key => 
      key.includes(userId) || 
      key.startsWith('course_progress_') ||
      key.startsWith('assessment_cache_')
    );
    
    userKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Reset complete: Cleared ${userKeys.length} cache entries for user ${userId}`);
    
    // Force page reload to ensure fresh state
    window.location.reload();
  } catch (error) {
    console.error('Error resetting user learning data:', error);
  }
};

/**
 * Clear cache for specific course
 */
export const clearCourseCache = async (userId: string, courseId: string) => {
  try {
    await personalizedLearningPathService.clearCachedPersonalizedPath(userId, courseId);
    
    // Clear other course-specific cache
    const keys = Object.keys(localStorage);
    const courseKeys = keys.filter(key => 
      key.includes(courseId) || 
      key.includes(`${userId}_${courseId}`)
    );
    
    courseKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared course cache for user ${userId}, course ${courseId}`);
  } catch (error) {
    console.error('Error clearing course cache:', error);
  }
};