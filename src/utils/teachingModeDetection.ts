export type TeachingMode = 'exam_practice' | 'continuous_teaching';

export function detectTeachingMode(subject: string, yearGroup?: string): TeachingMode {
  const subjectLower = subject.toLowerCase();
  const yearGroupLower = yearGroup?.toLowerCase() || '';
  
  // 11+ courses use exam practice mode
  if (subjectLower.includes('11 plus') || 
      subjectLower.includes('11plus') || 
      yearGroupLower.includes('11+') ||
      yearGroupLower.includes('11 plus')) {
    return 'exam_practice';
  }
  
  // All other courses use continuous teaching
  return 'continuous_teaching';
}

export function getTeachingModeConfig(mode: TeachingMode) {
  if (mode === 'exam_practice') {
    return {
      mode: 'exam_practice',
      exampleCount: 1,
      practiceQuestionsCount: 20,
      allowsHelpPerQuestion: true,
      sessionDuration: 30, // minutes
      focusOnQuestions: true
    };
  }
  
  return {
    mode: 'continuous_teaching',
    sessionDuration: 15, // minutes
    mixedContent: true,
    focusOnQuestions: false
  };
}
