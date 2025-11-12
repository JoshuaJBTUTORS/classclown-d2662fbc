import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Lightbulb, ListChecks } from 'lucide-react';

interface ContentActionButtonsProps {
  contentId: string;
  contentTitle: string;
  onActionClick: (action: string, message: string) => void;
}

export const ContentActionButtons: React.FC<ContentActionButtonsProps> = ({
  contentId,
  contentTitle,
  onActionClick,
}) => {
  const handleTestMe = () => {
    onActionClick('test', `Please test me on "${contentTitle}" with a question.`);
  };

  const handleExplainSimple = () => {
    onActionClick('explain', `Please explain "${contentTitle}" in the simplest way possible, like I'm 5 years old.`);
  };

  const handleGiveExample = () => {
    onActionClick('example', `Please give me a concrete, real-world example of "${contentTitle}".`);
  };

  return (
    <div className="cleo-lesson-actions">
      <button
        onClick={handleTestMe}
        className="cleo-pill-btn"
      >
        <ListChecks className="w-3.5 h-3.5" />
        <span>Test me</span>
      </button>
      <button
        onClick={handleExplainSimple}
        className="cleo-pill-btn"
      >
        <Brain className="w-3.5 h-3.5" />
        <span>Explain like I'm a potato</span>
      </button>
      <button
        onClick={handleGiveExample}
        className="cleo-pill-btn"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        <span>Give an example</span>
      </button>
    </div>
  );
};
