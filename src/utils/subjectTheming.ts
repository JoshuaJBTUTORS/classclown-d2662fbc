export const getSubjectTheme = (topic: string, yearGroup: string) => {
  const text = `${topic} ${yearGroup}`.toLowerCase();
  
  // Science subjects
  if (text.includes('chemistry') || text.includes('chemical') || text.includes('periodic')) {
    return { emoji: '🧪', color: 'purple', pastel: 'bg-purple-50 border-purple-200' };
  }
  if (text.includes('biology') || text.includes('cell') || text.includes('organ')) {
    return { emoji: '🧬', color: 'green', pastel: 'bg-green-50 border-green-200' };
  }
  if (text.includes('physics') || text.includes('force') || text.includes('energy') || text.includes('vector')) {
    return { emoji: '⚡', color: 'blue', pastel: 'bg-blue-50 border-blue-200' };
  }
  if (text.includes('science')) {
    return { emoji: '🔬', color: 'teal', pastel: 'bg-teal-50 border-teal-200' };
  }
  
  // Math subjects
  if (text.includes('math') || text.includes('algebra') || text.includes('geometry')) {
    return { emoji: '📐', color: 'orange', pastel: 'bg-orange-50 border-orange-200' };
  }
  
  // Language subjects
  if (text.includes('english') || text.includes('literature')) {
    return { emoji: '📚', color: 'rose', pastel: 'bg-rose-50 border-rose-200' };
  }
  if (text.includes('language') || text.includes('french') || text.includes('spanish')) {
    return { emoji: '🗣️', color: 'pink', pastel: 'bg-pink-50 border-pink-200' };
  }
  
  // Geography & History
  if (text.includes('geography') || text.includes('earth')) {
    return { emoji: '🌍', color: 'cyan', pastel: 'bg-cyan-50 border-cyan-200' };
  }
  if (text.includes('history')) {
    return { emoji: '📜', color: 'amber', pastel: 'bg-amber-50 border-amber-200' };
  }
  
  // Arts
  if (text.includes('art') || text.includes('design')) {
    return { emoji: '🎨', color: 'fuchsia', pastel: 'bg-fuchsia-50 border-fuchsia-200' };
  }
  if (text.includes('music')) {
    return { emoji: '🎵', color: 'violet', pastel: 'bg-violet-50 border-violet-200' };
  }
  
  // Computer Science
  if (text.includes('computer') || text.includes('coding') || text.includes('programming')) {
    return { emoji: '💻', color: 'slate', pastel: 'bg-slate-50 border-slate-200' };
  }
  
  // Default
  return { emoji: '📖', color: 'indigo', pastel: 'bg-indigo-50 border-indigo-200' };
};
