export interface TopicOption {
  id: string;
  name: string;
  icon: string;
}

const biologyTopics: TopicOption[] = [
  { id: 'plants', name: 'Plants', icon: '🍃' },
  { id: 'animals', name: 'Animals', icon: '🐕' },
  { id: 'cells', name: 'Cells', icon: '🧬' },
  { id: 'bones', name: 'Bones', icon: '🦴' },
  { id: 'ecosystems', name: 'Ecosystems', icon: '🌍' },
  { id: 'genetics', name: 'Genetics', icon: '🧬' },
];

const physicsTopics: TopicOption[] = [
  { id: 'motion', name: 'Motion', icon: '🚀' },
  { id: 'energy', name: 'Energy', icon: '⚡' },
  { id: 'forces', name: 'Forces', icon: '🏋️' },
  { id: 'waves', name: 'Waves', icon: '🌊' },
  { id: 'electricity', name: 'Electricity', icon: '💡' },
  { id: 'atoms', name: 'Atoms', icon: '⚛️' },
];

const chemistryTopics: TopicOption[] = [
  { id: 'reactions', name: 'Reactions', icon: '⚗️' },
  { id: 'acids', name: 'Acids & Bases', icon: '🧪' },
  { id: 'elements', name: 'Elements', icon: '🔬' },
  { id: 'bonding', name: 'Bonding', icon: '🔗' },
  { id: 'states', name: 'States of Matter', icon: '💧' },
  { id: 'metals', name: 'Metals', icon: '⚙️' },
];

const mathsTopics: TopicOption[] = [
  { id: 'algebra', name: 'Algebra', icon: '📐' },
  { id: 'geometry', name: 'Geometry', icon: '📏' },
  { id: 'statistics', name: 'Statistics', icon: '📊' },
  { id: 'calculus', name: 'Calculus', icon: '📈' },
  { id: 'trigonometry', name: 'Trigonometry', icon: '📐' },
  { id: 'probability', name: 'Probability', icon: '🎲' },
];

const defaultTopics: TopicOption[] = [
  { id: 'general', name: 'General Topics', icon: '📚' },
  { id: 'practice', name: 'Practice', icon: '📝' },
  { id: 'review', name: 'Review', icon: '🔄' },
  { id: 'advanced', name: 'Advanced', icon: '🎓' },
];

export const getTopicsForSubject = (subject: string): TopicOption[] => {
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('biology') || subjectLower.includes('bio')) {
    return biologyTopics;
  }
  
  if (subjectLower.includes('physics')) {
    return physicsTopics;
  }
  
  if (subjectLower.includes('chemistry') || subjectLower.includes('chem')) {
    return chemistryTopics;
  }
  
  if (subjectLower.includes('math') || subjectLower.includes('maths')) {
    return mathsTopics;
  }
  
  return defaultTopics;
};
