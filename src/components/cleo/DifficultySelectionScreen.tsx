import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, BookOpen, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DifficultyTier {
  id: 'foundation' | 'intermediate' | 'higher';
  name: string;
  gradeRange: string;
  emoji: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  color: string;
}

interface DifficultySelectionScreenProps {
  topic: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  yearGroup: string;
  isCompleted: boolean;
  subjectName?: string;
  userYearGroup?: string;
}

export const DifficultySelectionScreen = ({
  topic,
  courseId,
  moduleId,
  lessonId,
  yearGroup,
  isCompleted,
  subjectName = 'general',
  userYearGroup
}: DifficultySelectionScreenProps) => {
  const navigate = useNavigate();

  // Subject-specific descriptions
  const getFeatures = (tier: 'foundation' | 'intermediate' | 'higher', subject: string): string[] => {
    const isMaths = subject.toLowerCase().includes('math');
    const isEnglishLit = subject.toLowerCase().includes('english') && subject.toLowerCase().includes('literature');
    const isScience = subject.toLowerCase().includes('science') || subject.toLowerCase().includes('biology') || 
                      subject.toLowerCase().includes('chemistry') || subject.toLowerCase().includes('physics');

    if (isMaths) {
      if (tier === 'foundation') {
        return [
          'Very simple, highly scaffolded examples',
          'Strong hints and step-by-step guidance',
          'Basic single-step calculations',
          'Perfect for building confidence'
        ];
      } else if (tier === 'intermediate') {
        return [
          'Multi-step problems with moderate scaffolding',
          'Light hints to guide your thinking',
          'Exam-style questions to practice',
          'Ideal for GCSE preparation'
        ];
      } else {
        return [
          'Advanced algebra-heavy problems',
          'Minimal scaffolding - you lead the way',
          'Higher-tier 6+ mark exam questions',
          'Challenge yourself with complex reasoning'
        ];
      }
    } else if (isEnglishLit) {
      if (tier === 'foundation') {
        return [
          'Plot understanding & basic character analysis',
          'Simple quote interpretation',
          'Short scaffolded paragraphs',
          'Build your analytical foundation'
        ];
      } else if (tier === 'intermediate') {
        return [
          'Extract-based analysis with writer\'s methods',
          'PEEL/PEAZL paragraph structures',
          'Exam-style extract questions',
          'Develop strong essay skills'
        ];
      } else {
        return [
          'Deep interpretation & alternative readings',
          'Grade 8-9 conceptual arguments',
          'Context, symbolism & thematic analysis',
          'Master sophisticated literary critique'
        ];
      }
    } else if (isScience) {
      if (tier === 'foundation') {
        return [
          'Basic concepts with simple diagrams',
          'Scaffolded recall questions',
          'One-step calculations',
          'Foundation-tier curriculum focus'
        ];
      } else if (tier === 'intermediate') {
        return [
          'Standard multi-step explanations',
          'Application questions with light hints',
          'Exam-style practice questions',
          'Core curriculum coverage'
        ];
      } else {
        return [
          'Complex reasoning & multi-concept problems',
          'Minimal support - think independently',
          'Higher-tier exam questions',
          'Advanced scientific analysis'
        ];
      }
    }

    // Default generic features
    if (tier === 'foundation') {
      return ['Simplified concepts', 'Strong scaffolding', 'Basic practice', 'Confidence building'];
    } else if (tier === 'intermediate') {
      return ['Balanced approach', 'Moderate challenge', 'Exam practice', 'Core curriculum'];
    } else {
      return ['Advanced concepts', 'Minimal support', 'Higher-tier questions', 'Maximum challenge'];
    }
  };

  const difficultyTiers: DifficultyTier[] = [
    {
      id: 'foundation',
      name: 'Foundation Level',
      gradeRange: 'Grades 1–4',
      emoji: '🌱',
      icon: <Sparkles className="w-6 h-6" />,
      description: 'Perfect for building strong foundations with lots of support',
      features: getFeatures('foundation', subjectName),
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      id: 'intermediate',
      name: 'Intermediate Level',
      gradeRange: 'Grades 4–6',
      emoji: '📚',
      icon: <BookOpen className="w-6 h-6" />,
      description: 'Balanced challenge for core GCSE content',
      features: getFeatures('intermediate', subjectName),
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'higher',
      name: 'Higher Level',
      gradeRange: 'Grades 6–9',
      emoji: '🚀',
      icon: <Rocket className="w-6 h-6" />,
      description: 'Maximum challenge for top grades with minimal scaffolding',
      features: getFeatures('higher', subjectName),
      color: 'from-purple-500/20 to-pink-500/20'
    }
  ];

  // Recommend tier based on user's year group
  const getRecommendedTier = (): string | null => {
    if (!userYearGroup) return null;
    const year = userYearGroup.toLowerCase();
    
    if (year.includes('year 7') || year.includes('year 8') || year.includes('year 9')) {
      return 'foundation';
    } else if (year.includes('year 10') || year.includes('gcse')) {
      return 'intermediate';
    } else if (year.includes('year 11') || year.includes('a-level')) {
      return 'higher';
    }
    return null;
  };

  const recommendedTier = getRecommendedTier();

  const handleTierSelect = (tierId: 'foundation' | 'intermediate' | 'higher') => {
    navigate(
      `/lesson-planning?topic=${encodeURIComponent(topic)}&yearGroup=${encodeURIComponent(yearGroup)}&moduleId=${moduleId}&courseId=${courseId}&lessonId=${lessonId}&isCompleted=${isCompleted}&difficultyTier=${tierId}`
    );
  };

  return (
    <div className="cleo-lesson-container">
      <button
        onClick={() => navigate(`/course/${courseId}/module/${moduleId}`)}
        className="cleo-back-btn"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Module
      </button>

      <div className="cleo-logo">Cleo</div>
      
      <div className="cleo-avatar">🦊</div>

      <h1 className="cleo-heading">
        Choose Your Challenge Level
      </h1>

      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        Select the difficulty that matches your current level for <span className="font-semibold text-foreground">"{topic}"</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {difficultyTiers.map((tier) => {
          const isRecommended = tier.id === recommendedTier;
          
          return (
            <Card
              key={tier.id}
              className={`relative p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
                isRecommended 
                  ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleTierSelect(tier.id)}
            >
              {isRecommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  ⭐ Recommended for you
                </Badge>
              )}

              <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${tier.color} opacity-50`} />

              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-5xl">{tier.emoji}</div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2">
                  {tier.name}
                </h2>

                <p className="text-center text-sm font-semibold text-primary mb-3">
                  {tier.gradeRange}
                </p>

                <p className="text-center text-sm text-muted-foreground mb-6">
                  {tier.description}
                </p>

                <div className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm text-foreground/80">{feature}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                    {tier.icon}
                    <span>Select {tier.name}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
        Don't worry—you can always try a different level next time! Choose what feels right for you today.
      </p>
    </div>
  );
};