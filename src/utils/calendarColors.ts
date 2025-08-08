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