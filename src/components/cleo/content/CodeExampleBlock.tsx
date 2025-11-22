import React from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { CodeExampleContent } from '@/types/lessonContent';

interface CodeExampleBlockProps {
  data: CodeExampleContent;
}

export const CodeExampleBlock: React.FC<CodeExampleBlockProps> = ({ data }) => {
  const monacoLanguage = data.language === 'pseudocode' ? 'plaintext' : data.language;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cleo-content-card"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Code Example</h3>
        <p className="text-sm text-muted-foreground">{data.explanation}</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Editor
          height="200px"
          language={monacoLanguage}
          value={data.code}
          theme="vs-light"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontSize: 14,
          }}
        />
      </div>

      {data.lineHighlights && data.lineHighlights.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          💡 Focus on line{data.lineHighlights.length > 1 ? 's' : ''}: {data.lineHighlights.join(', ')}
        </div>
      )}
    </motion.div>
  );
};
