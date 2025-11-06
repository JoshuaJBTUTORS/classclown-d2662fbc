import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, Clock, CheckCircle, ArrowLeft } from 'lucide-react';

interface LessonPlanDisplayProps {
  lessonPlan: {
    topic: string;
    year_group: string;
    learning_objectives: string[];
    teaching_sequence: Array<{
      id: string;
      title: string;
      duration_minutes?: number;
    }>;
  };
  contentCounts: {
    tables: number;
    questions: number;
    definitions: number;
  };
  onStartLesson: () => void;
  moduleId?: string;
}

export const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({
  lessonPlan,
  contentCounts,
  onStartLesson,
  moduleId
}) => {
  const navigate = useNavigate();

  const handleBackToModule = () => {
    if (moduleId) {
      navigate(`/module/${moduleId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-8">
      <Card className="max-w-3xl w-full p-8 shadow-xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToModule}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>
          
          <div className="flex items-center gap-2 text-primary mb-4">
            <BookOpen className="w-6 h-6" />
            <span className="text-sm font-medium">Lesson Plan Generated</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {lessonPlan.topic}
          </h1>
          <p className="text-muted-foreground">
            {lessonPlan.year_group}
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {/* Learning Objectives */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Learning Objectives</h2>
            </div>
            <ul className="space-y-2">
              {lessonPlan.learning_objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2 text-foreground">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Teaching Sequence */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Teaching Sequence</h2>
            </div>
            <div className="space-y-2">
              {lessonPlan.teaching_sequence.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                  <span className="text-foreground font-medium">{step.title}</span>
                  </div>
                  {step.duration_minutes && (
                    <span className="text-sm text-muted-foreground">
                      {step.duration_minutes} min
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Overview */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-foreground mb-2">Interactive Content</h3>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>{contentCounts.tables} Tables</span>
              <span>{contentCounts.questions} Questions</span>
              <span>{contentCounts.definitions} Definitions</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onStartLesson}
          size="lg"
          className="w-full text-base font-semibold py-6"
        >
          Start Lesson with Cleo
        </Button>
      </Card>
    </div>
  );
};
