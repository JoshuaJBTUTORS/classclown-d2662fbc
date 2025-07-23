
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubjectSelectionStepProps {
  selectedSubject: { id: string; name: string } | null;
  onSubjectChange: (subject: { id: string; name: string }) => void;
  error?: string;
}

const CATEGORY_LABELS = {
  'entrance': '11 Plus / Entrance Exams',
  'primary': 'Primary Education (KS1 & KS2)',
  'secondary': 'Secondary Education (KS3)',
  'gcse': 'GCSE & Year 11'
};

const SubjectSelectionStep: React.FC<SubjectSelectionStepProps> = ({ 
  selectedSubject, 
  onSubjectChange, 
  error 
}) => {
  const { subjects, isLoading, error: subjectsError } = useSubjects();

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading subjects...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subjectsError) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>Error loading subjects: {subjectsError}</p>
          </div>
        </CardContent>
      </Card>
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Subject Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="subject">Choose Subject *</Label>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          
          <div className="mt-3 space-y-4">
            {Object.entries(subjectsByCategory).map(([category, categorySubjects]) => (
              <div key={category} className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categorySubjects.map((subject) => (
                    <Button
                      key={subject.id}
                      variant={selectedSubject?.id === subject.id ? "default" : "outline"}
                      className={cn(
                        "h-auto p-3 text-left justify-start",
                        selectedSubject?.id === subject.id && "bg-[#e94b7f] hover:bg-[#d63d6f]"
                      )}
                      onClick={() => onSubjectChange({ id: subject.id, name: subject.name })}
                    >
                      {subject.name}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What to expect:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 60-minute trial lesson with a qualified tutor</li>
            <li>• Assessment of your child's current level</li>
            <li>• Personalized learning recommendations</li>
            <li>• No commitment required</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectSelectionStep;
