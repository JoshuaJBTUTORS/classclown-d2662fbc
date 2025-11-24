import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ content }) => {
  if (!content) return null;

  const parseContent = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let position = 0;
    let key = 0;

    while (position < text.length) {
      // Try to find display math $$...$$
      if (text.substring(position).startsWith('$$')) {
        const endPos = text.indexOf('$$', position + 2);
        if (endPos !== -1) {
          const mathContent = text.substring(position + 2, endPos);
          elements.push(
            <BlockMath key={key++} math={mathContent} />
          );
          position = endPos + 2;
          continue;
        }
      }

      // Try to find display math \[...\] with balanced bracket tracking
      if (text.substring(position).startsWith('\\[')) {
        const mathContent = extractBalancedDelimiter(text, position + 2, '\\]');
        if (mathContent !== null) {
          elements.push(
            <BlockMath key={key++} math={mathContent.content} />
          );
          position = mathContent.endPos;
          continue;
        }
      }

      // Try to find inline math $...$
      if (text[position] === '$' && (position === 0 || text[position - 1] !== '$')) {
        const endPos = text.indexOf('$', position + 1);
        if (endPos !== -1 && (endPos === text.length - 1 || text[endPos + 1] !== '$')) {
          const mathContent = text.substring(position + 1, endPos);
          elements.push(
            <InlineMath key={key++} math={mathContent} />
          );
          position = endPos + 1;
          continue;
        }
      }

      // Try to find inline math \(...\) with balanced bracket tracking
      if (text.substring(position).startsWith('\\(')) {
        const mathContent = extractBalancedDelimiter(text, position + 2, '\\)');
        if (mathContent !== null) {
          elements.push(
            <InlineMath key={key++} math={mathContent.content} />
          );
          position = mathContent.endPos;
          continue;
        }
      }

      // No math delimiter found, advance to next potential delimiter or end
      let nextDelimiterPos = text.length;
      const potentialDelimiters = [
        text.indexOf('$$', position),
        text.indexOf('\\[', position),
        text.indexOf('$', position),
        text.indexOf('\\(', position),
      ].filter(pos => pos !== -1);

      if (potentialDelimiters.length > 0) {
        nextDelimiterPos = Math.min(...potentialDelimiters);
      }

      if (nextDelimiterPos > position) {
        const plainText = text.substring(position, nextDelimiterPos);
        elements.push(
          <span key={key++}>{plainText}</span>
        );
        position = nextDelimiterPos;
      } else {
        position++;
      }
    }

    return elements;
  };

  // Helper function to extract content between balanced delimiters
  const extractBalancedDelimiter = (
    text: string,
    startPos: number,
    closingDelimiter: string
  ): { content: string; endPos: number } | null => {
    let depth = 0;
    let pos = startPos;
    let escaped = false;

    while (pos < text.length) {
      if (escaped) {
        escaped = false;
        pos++;
        continue;
      }

      if (text[pos] === '\\') {
        // Check if this is the closing delimiter
        if (text.substring(pos).startsWith(closingDelimiter)) {
          if (depth === 0) {
            return {
              content: text.substring(startPos, pos),
              endPos: pos + closingDelimiter.length,
            };
          }
          depth--;
          pos += closingDelimiter.length;
          continue;
        }
        escaped = true;
        pos++;
        continue;
      }

      // Track opening brackets/parentheses for balance
      if (text[pos] === '(' || text[pos] === '[') {
        depth++;
      } else if (text[pos] === ')' || text[pos] === ']') {
        depth--;
      }

      pos++;
    }

    return null; // No closing delimiter found
  };

  return <>{parseContent(content)}</>;
};
