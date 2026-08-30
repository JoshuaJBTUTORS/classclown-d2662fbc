import React from 'react';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { cn } from '@/lib/utils';

interface SubjectSelectionStepProps {
  selectedSubject: {
    id: string;
    name: string;
  } | null;
  onSubjectChange: (subject: {
    id: string;
    name: string;
  }) => void;
  error?: string;
}

const CATEGORY_LABELS = {
  'primary': 'Primary Education (KS1 & KS2)',
  'secondary': 'Secondary Education (KS3)',
  'gcse': 'GCSE & Year 11',
  'a_level': 'A-Level'
};

const CATEGORY_TONES: Record<string, string> = {
  primary: 'bg-pastel-mint',
  secondary: 'bg-pastel-sky',
  gcse: 'bg-pastel-butter',
  a_level: 'bg-pastel-lilac'
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full max-w-2xl mx-auto">
    <div className="flex items-center gap-3 mb-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-foreground/80 bg-pastel-mint">
        <BookOpen className="h-5 w-5 text-foreground" />
      </span>
      <h2 className="font-heading text-lg font-bold text-foreground">Subject Selection</h2>
    </div>
    {children}
  </div>
);

const SubjectSelectionStep: React.FC<SubjectSelectionStepProps> = ({
  selectedSubject,
  onSubjectChange,
  error
}) => {
  const {
    subjects,
    isLoading,
    error: subjectsError
  } = useSubjects();

  if (isLoading) {
    return (
      <Shell>
        <div className="text-center py-10 rounded-2xl border border-border bg-muted/30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading subjects...</p>
        </div>
      </Shell>
    );
  }

  if (subjectsError) {
    return (
      <Shell>
        <div className="text-center py-10 rounded-2xl border border-destructive/40 bg-destructive/5">
          <p className="text-sm text-destructive">Error loading subjects: {subjectsError}</p>
        </div>
      </Shell>
    );
  }

  // Group subjects by category
  const subjectsByCategory = subjects.reduce((acc, subject) => {
    if (!acc[subject.category]) {
      acc[subject.category] = [];
    }
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, typeof subjects>);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <Label htmlFor="subject" className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            Choose Subject *
          </Label>
          {error && (
            <p className="mt-2 inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="mt-3 space-y-4">
            {Object.entries(subjectsByCategory).map(([category, categorySubjects]) => (
              <div key={category} className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('h-3 w-3 rounded-full border border-foreground/60', CATEGORY_TONES[category] || 'bg-pastel-sand')} />
                  <h4 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categorySubjects.map(subject => {
                    const isSelected = selectedSubject?.id === subject.id;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => onSubjectChange({ id: subject.id, name: subject.name })}
                        className={cn(
                          'rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all',
                          isSelected
                            ? 'border-foreground bg-foreground text-background shadow-[0_3px_0_0_hsl(var(--foreground)/0.25)]'
                            : 'border-border bg-card text-foreground hover:border-foreground/70 hover:-translate-y-0.5'
                        )}
                      >
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-foreground/80 bg-pastel-sky p-4">
          <h4 className="font-heading font-bold text-foreground mb-2">What to expect:</h4>
          <ul className="text-sm text-foreground/80 space-y-1">
            <li>• 45-minute trial lesson with a qualified tutor</li>
            <li>• Assessment of your child's current level</li>
            <li>• Personalized learning recommendations</li>
            <li>• No commitment required</li>
          </ul>
        </div>
      </div>
    </Shell>
  );
};

export default SubjectSelectionStep;
