interface LessonPlan {
  teaching_sequence?: any[];
  learning_objectives?: string[];
  topic: string;
  year_group: string;
}

export const lessonDurationEstimator = {
  estimateDuration: (lessonPlan: LessonPlan): number => {
    let totalMinutes = 0;
    
    // Base time for intro + objectives (2 min)
    totalMinutes += 2;
    
    // If no teaching sequence, estimate based on objectives
    if (!lessonPlan.teaching_sequence || lessonPlan.teaching_sequence.length === 0) {
      const objectiveCount = lessonPlan.learning_objectives?.length || 3;
      totalMinutes += objectiveCount * 4; // 4 minutes per objective
      return Math.ceil(totalMinutes * 1.2); // Add 20% buffer
    }
    
    // Estimate per step based on content blocks
    lessonPlan.teaching_sequence.forEach((step: any) => {
      if (!step.content_blocks || step.content_blocks.length === 0) {
        // Default step time if no content blocks
        totalMinutes += 3;
        return;
      }

      step.content_blocks.forEach((block: any) => {
        switch (block.type) {
          case 'text':
          case 'explanation':
            // Reading/explanation time based on word count estimate
            totalMinutes += 2;
            break;
            
          case 'table':
            // Time to review table
            totalMinutes += 1.5;
            break;
            
          case 'definition':
            // Time for definition
            totalMinutes += 1;
            break;
            
          case 'question':
            // Time per question (includes thinking + answering)
            const questionCount = Array.isArray(block.data?.questions) 
              ? block.data.questions.length 
              : 1;
            totalMinutes += questionCount * 2;
            break;
            
          case 'worked_example':
          case 'diagram':
            // Time for worked examples and diagrams
            totalMinutes += 3;
            break;
            
          default:
            // Default for unknown block types
            totalMinutes += 2;
        }
      });
    });
    
    // Add buffer for student questions/clarifications (20%)
    totalMinutes = Math.ceil(totalMinutes * 1.2);
    
    // Apply difficulty multiplier based on year group
    const difficultyMultiplier = lessonDurationEstimator.getDifficultyMultiplier(
      lessonPlan.year_group
    );
    totalMinutes = Math.ceil(totalMinutes * difficultyMultiplier);
    
    return totalMinutes;
  },
  
  getDifficultyMultiplier: (yearGroup: string): number => {
    // 11 Plus: 0.9x (simpler explanations)
    // GCSE Years 9-10: 1.0x (baseline)
    // GCSE Year 11: 1.2x (more complex)
    const yearGroupLower = yearGroup.toLowerCase();
    
    if (yearGroupLower.includes('11 plus') || yearGroupLower.includes('11+')) {
      return 0.9;
    }
    
    if (yearGroupLower.includes('year 11') || yearGroupLower.includes('11')) {
      return 1.2;
    }
    
    return 1.0;
  }
};
