
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { LESSON_SUBJECTS } from '@/constants/subjects';

interface SubjectSelectionStepProps {
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  error?: string;
}

const SubjectSelectionStep: React.FC<SubjectSelectionStepProps> = ({ 
  selectedSubject, 
  onSubjectChange, 
  error 
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Subject Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="subject">Choose Subject *</Label>
          <Select value={selectedSubject} onValueChange={onSubjectChange}>
            <SelectTrigger className={`w-full ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select a subject for the trial lesson" />
            </SelectTrigger>
            <SelectContent>
              {LESSON_SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
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
