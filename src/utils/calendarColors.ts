
// Utility functions for mapping subjects and lesson types to CSS classes

export const getSubjectClass = (subject: string, lessonType?: string): string => {
  // Handle trial lessons first
  if (lessonType === 'trial') {
    return 'trial-event';
  }

  if (!subject) {
    return 'default-event';
  }

  const subjectLower = subject.toLowerCase();

  // Handle 11 Plus subjects
  if (subjectLower.includes('11 plus') || subjectLower.includes('11plus') || subjectLower.includes('eleven plus')) {
    return 'eleven-plus-event';
  }

  // Map subjects to their appropriate year group classes
  // Based on the CSS classes defined in index.css
  
  // KS2 subjects (typically primary school level)
  if (subjectLower.includes('ks2') || 
      subjectLower.includes('primary') ||
      subjectLower.includes('year 3') ||
      subjectLower.includes('year 4') ||
      subjectLower.includes('year 5') ||
      subjectLower.includes('year 6')) {
    return 'ks2-event';
  }

  // KS3 subjects (Key Stage 3 - typically years 7-9)
  if (subjectLower.includes('ks3')) {
    return 'ks3-event';
  }

  // GCSE subjects (typically secondary school level)
  if (subjectLower.includes('gcse') ||
      subjectLower.includes('year 7') ||
      subjectLower.includes('year 8') ||
      subjectLower.includes('year 9') ||
      subjectLower.includes('year 10') ||
      subjectLower.includes('year 11')) {
    return 'gcse-event';
  }

  // A-Level subjects (typically college/sixth form level)
  if (subjectLower.includes('a-level') ||
      subjectLower.includes('a level') ||
      subjectLower.includes('alevel') ||
      subjectLower.includes('year 12') ||
      subjectLower.includes('year 13') ||
      subjectLower.includes('as level') ||
      subjectLower.includes('as-level')) {
    return 'a-level-event';
  }

  // Subject-specific mappings (fallback to subject colors)
  if (subjectLower.includes('math') || subjectLower.includes('maths')) {
    return 'math-event';
  }
  
  if (subjectLower.includes('english')) {
    return 'english-event';
  }
  
  if (subjectLower.includes('science') || 
      subjectLower.includes('physics') || 
      subjectLower.includes('chemistry') || 
      subjectLower.includes('biology')) {
    return 'science-event';
  }
  
  if (subjectLower.includes('history')) {
    return 'history-event';
  }
  
  if (subjectLower.includes('geography')) {
    return 'geography-event';
  }
  
  if (subjectLower.includes('french') || 
      subjectLower.includes('spanish') || 
      subjectLower.includes('german') ||
      subjectLower.includes('language')) {
    return 'language-event';
  }

  // Default fallback
  return 'gcse-event'; // Use GCSE as default since it's most common
};

// Map subjects to calendar background colors
export const getCalendarColor = (subject: string): string => {
  if (!subject) return '#3b82f6'; // Default blue

  const subjectLower = subject.toLowerCase();

  if (subjectLower.includes('math') || subjectLower.includes('maths')) {
    return '#ef4444'; // Red
  }
  
  if (subjectLower.includes('english')) {
    return '#10b981'; // Green
  }
  
  if (subjectLower.includes('science') || 
      subjectLower.includes('physics') || 
      subjectLower.includes('chemistry') || 
      subjectLower.includes('biology')) {
    return '#8b5cf6'; // Purple
  }
  
  if (subjectLower.includes('history')) {
    return '#f59e0b'; // Orange
  }
  
  if (subjectLower.includes('geography')) {
    return '#06b6d4'; // Cyan
  }
  
  if (subjectLower.includes('french') || 
      subjectLower.includes('spanish') || 
      subjectLower.includes('german') ||
      subjectLower.includes('language')) {
    return '#ec4899'; // Pink
  }

  // Year group based colors
  if (subjectLower.includes('ks2') || subjectLower.includes('primary')) {
    return '#84cc16'; // Light green
  }

  if (subjectLower.includes('ks3')) {
    return '#f97316'; // Orange
  }

  if (subjectLower.includes('gcse')) {
    return '#3b82f6'; // Blue
  }

  if (subjectLower.includes('a-level') || subjectLower.includes('a level')) {
    return '#7c3aed'; // Purple
  }

  return '#3b82f6'; // Default blue
};

// Map subjects to text colors for good contrast
export const getCalendarTextColor = (subject: string): string => {
  // Most backgrounds work well with white text
  return '#ffffff';
};
