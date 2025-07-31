import { 
  Calculator, 
  BookOpen, 
  Microscope, 
  Globe, 
  Palette, 
  Music, 
  Dumbbell, 
  Languages,
  Compass,
  Computer,
  Trophy,
  GraduationCap
} from 'lucide-react';

interface SubjectIconProps {
  subject: string;
  className?: string;
}

const getSubjectIcon = (subject: string) => {
  const normalizedSubject = subject.toLowerCase();
  
  if (normalizedSubject.includes('math') || normalizedSubject.includes('arithmetic')) {
    return Calculator;
  }
  if (normalizedSubject.includes('english') || normalizedSubject.includes('literacy')) {
    return BookOpen;
  }
  if (normalizedSubject.includes('science') || normalizedSubject.includes('biology') || 
      normalizedSubject.includes('chemistry') || normalizedSubject.includes('physics')) {
    return Microscope;
  }
  if (normalizedSubject.includes('geography') || normalizedSubject.includes('world')) {
    return Globe;
  }
  if (normalizedSubject.includes('art') || normalizedSubject.includes('design')) {
    return Palette;
  }
  if (normalizedSubject.includes('music')) {
    return Music;
  }
  if (normalizedSubject.includes('pe') || normalizedSubject.includes('physical') || 
      normalizedSubject.includes('sport')) {
    return Dumbbell;
  }
  if (normalizedSubject.includes('language') || normalizedSubject.includes('french') || 
      normalizedSubject.includes('spanish') || normalizedSubject.includes('german')) {
    return Languages;
  }
  if (normalizedSubject.includes('history') || normalizedSubject.includes('humanities')) {
    return Compass;
  }
  if (normalizedSubject.includes('computer') || normalizedSubject.includes('ict') || 
      normalizedSubject.includes('technology')) {
    return Computer;
  }
  if (normalizedSubject.includes('11+') || normalizedSubject.includes('entrance')) {
    return Trophy;
  }
  
  return GraduationCap; // Default icon
};

export const SubjectIcon: React.FC<SubjectIconProps> = ({ subject, className = "h-6 w-6" }) => {
  const IconComponent = getSubjectIcon(subject);
  return <IconComponent className={className} />;
};