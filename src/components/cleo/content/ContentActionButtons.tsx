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
    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
      <Button
        onClick={handleTestMe}
        variant="outline"
        size="sm"
        className="text-xs gap-1.5"
      >
        <ListChecks className="w-3.5 h-3.5" />
        Test me
      </Button>
      <Button
        onClick={handleExplainSimple}
        variant="outline"
        size="sm"
        className="text-xs gap-1.5"
      >
        <Brain className="w-3.5 h-3.5" />
        Explain like I'm a potato
      </Button>
      <Button
        onClick={handleGiveExample}
        variant="outline"
        size="sm"
        className="text-xs gap-1.5"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        Give an example
      </Button>
    </div>
  );
};
