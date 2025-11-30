import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Target, Award } from 'lucide-react';

interface AssessmentTimeScreenProps {
  onBeginAssessment: () => void;
  moduleTitle: string;
}

const AssessmentTimeScreen: React.FC<AssessmentTimeScreenProps> = ({
  onBeginAssessment,
  moduleTitle
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8 space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Assessment Time!</h3>
            <p className="text-muted-foreground">
              You've completed all lessons in <span className="font-medium">{moduleTitle}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Take your time and do your best</span>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Complete to unlock the next module</span>
            </div>
          </div>

          <Button 
            onClick={onBeginAssessment}
            size="lg"
            className="w-full"
          >
            Begin Assessment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentTimeScreen;