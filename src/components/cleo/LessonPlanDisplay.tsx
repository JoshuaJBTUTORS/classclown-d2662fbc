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
  courseId?: string;
}

export const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({
  lessonPlan,
  contentCounts,
  onStartLesson,
  moduleId,
  courseId
}) => {
  const navigate = useNavigate();

  const handleBackToModule = () => {
    if (courseId && moduleId) {
      navigate(`/course/${courseId}/module/${moduleId}`);
    } else if (moduleId) {
      navigate(`/module/${moduleId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-screen bg-white p-8">
      <div className="max-w-[1120px] mx-auto">
        {/* Cleo Logo */}
        <div className="text-3xl font-bold mb-6" style={{ color: 'hsl(var(--cleo-green))' }}>
          Cleo
        </div>

        {/* Header with Avatar and Audio Selectors */}
        <div className="flex justify-between items-center mb-8">
          <div className="cleo-avatar-large">
            <span>🧑🏻‍🔬</span>
          </div>
          
          <div className="flex gap-2">
            <button className="cleo-btn-outline">
              <span className="text-lg">🔈</span>
              <span>Select speaker</span>
            </button>
            <button className="cleo-btn-outline">
              <span className="text-lg">🎙️</span>
              <span>Select microphone</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-8" style={{ letterSpacing: '-0.02em' }}>
          Here's your lesson plan, {lessonPlan.year_group} 🦊
        </h1>

        {/* Lesson Plan Card */}
        <div className="cleo-card">
          <h2 className="text-2xl font-semibold text-center mb-3">
            {lessonPlan.topic}
          </h2>
          <h3 className="text-lg text-center mb-4" style={{ color: 'hsl(var(--cleo-text-muted))' }}>
            Learning Objectives
          </h3>
          
          <ul className="mb-6 space-y-2 text-[15px]" style={{ color: 'hsl(var(--cleo-text-main))', lineHeight: '1.5' }}>
            {lessonPlan.learning_objectives.map((objective, index) => (
              <li key={index}>• {objective}</li>
            ))}
          </ul>

          {/* Teaching Sequence as Pills */}
          <div className="flex gap-3 flex-wrap mt-6 mb-6">
            {lessonPlan.teaching_sequence.map((step, index) => (
              <div key={step.id} className="cleo-step-pill">
                <div className="cleo-step-number">{index + 1}</div>
                <div>{step.title}</div>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <button onClick={onStartLesson} className="cleo-btn-primary w-full mt-5">
            <span className="text-lg">▶️</span>
            Start Lesson with Cleo
          </button>
        </div>
      </div>
    </div>
  );
};
