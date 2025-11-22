import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { WritingBoxContent } from '@/types/lessonContent';

interface WritingBoxBlockProps {
  data: WritingBoxContent;
  onSubmit: (content: string) => void;
}

export const WritingBoxBlock: React.FC<WritingBoxBlockProps> = ({ data, onSubmit }) => {
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      setSubmitted(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cleo-content-card"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{data.prompt}</h3>
        {data.marks && (
          <span className="text-sm text-muted-foreground">({data.marks} marks)</span>
        )}
      </div>

      {data.sentenceStarters && data.sentenceStarters.length > 0 && (
        <div className="mb-4 p-4 bg-cream-light rounded-lg">
          <p className="text-sm font-medium mb-2">Sentence Starters:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            {data.sentenceStarters.map((starter, i) => (
              <li key={i}>{starter}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 p-4 bg-muted/30 rounded-lg">
        <p className="text-sm font-medium mb-1">Structure Guidance:</p>
        <p className="text-sm whitespace-pre-wrap">{data.guidance}</p>
      </div>

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[200px] text-base"
          disabled={submitted}
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {wordCount} words
            {data.wordTarget && ` (target: ${data.wordTarget})`}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || submitted}
            className="bg-cleo-green hover:bg-cleo-green/90"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Answer
          </Button>
        </div>
      </div>

      {submitted && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✓ Answer submitted! Cleo will give you feedback shortly.
          </p>
        </div>
      )}
    </motion.div>
  );
};
