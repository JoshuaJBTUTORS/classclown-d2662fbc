import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '' }) => {
  const renderContent = () => {
    if (!content) return null;

    try {
      // Split content using character-by-character parsing with balanced bracket tracking
      const parts: Array<{ type: 'text' | 'display' | 'inline'; content: string }> = [];
      let i = 0;
      
      // Helper function to find matching delimiter with balanced bracket tracking
      const findMatchingDelimiter = (startIndex: number, openChar: string, closeChar: string): number => {
        let depth = 1;
        let j = startIndex;
        
        while (j < content.length && depth > 0) {
          // Skip escaped characters
          if (content[j] === '\\' && j + 1 < content.length) {
            j += 2;
            continue;
          }
          
          if (content[j] === openChar) depth++;
          if (content[j] === closeChar) depth--;
          j++;
        }
        
        return depth === 0 ? j - 1 : -1;
      };
      
      while (i < content.length) {
        // Check for $$ (display math)
        if (i < content.length - 1 && content[i] === '$' && content[i + 1] === '$') {
          const endIndex = content.indexOf('$$', i + 2);
          if (endIndex !== -1) {
            parts.push({
              type: 'display',
              content: content.slice(i + 2, endIndex).trim()
            });
            i = endIndex + 2;
            continue;
          }
        }
        
        // Check for $ (inline math)
        if (content[i] === '$') {
          const endIndex = content.indexOf('$', i + 1);
          if (endIndex !== -1) {
            parts.push({
              type: 'inline',
              content: content.slice(i + 1, endIndex).trim()
            });
            i = endIndex + 1;
            continue;
          }
        }
        
        // Check for \[ (display math)
        if (i < content.length - 1 && content[i] === '\\' && content[i + 1] === '[') {
          const endIndex = content.indexOf('\\]', i + 2);
          if (endIndex !== -1) {
            parts.push({
              type: 'display',
              content: content.slice(i + 2, endIndex).trim()
            });
            i = endIndex + 2;
            continue;
          }
        }
        
        // Check for \( (inline math) with balanced parentheses
        if (i < content.length - 1 && content[i] === '\\' && content[i + 1] === '(') {
          // Find the matching \)
          let j = i + 2;
          let found = false;
          while (j < content.length - 1) {
            if (content[j] === '\\' && content[j + 1] === ')') {
              parts.push({
                type: 'inline',
                content: content.slice(i + 2, j).trim()
              });
              i = j + 2;
              found = true;
              break;
            }
            j++;
          }
          if (found) continue;
        }
        
        // Regular text - accumulate until next delimiter
        let textStart = i;
        while (i < content.length) {
          const char = content[i];
          const nextChar = i < content.length - 1 ? content[i + 1] : '';
          
          // Stop if we hit a delimiter
          if (char === '$' || (char === '\\' && (nextChar === '(' || nextChar === '['))) {
            break;
          }
          i++;
        }
        
        if (i > textStart) {
          parts.push({
            type: 'text',
            content: content.slice(textStart, i)
          });
        }
      }
      
      // If no math found, return plain text
      if (parts.length === 0) {
        return <span className={className}>{content}</span>;
      }
      
      // Render parts
      return (
        <span className={className}>
          {parts.map((part, index) => {
            if (part.type === 'text') {
              // Handle bold markdown (**text**)
              const textParts = part.content.split(/(\*\*.*?\*\*)/g);
              return textParts.map((textPart, textIndex) => {
                if (textPart.startsWith('**') && textPart.endsWith('**')) {
                  return (
                    <strong key={`${index}-${textIndex}`} className="font-semibold">
                      {textPart.slice(2, -2)}
                    </strong>
                  );
                }
                return <React.Fragment key={`${index}-${textIndex}`}>{textPart}</React.Fragment>;
              });
            } else if (part.type === 'display') {
              try {
                const html = katex.renderToString(part.content, {
                  displayMode: true,
                  throwOnError: false,
                  output: 'html'
                });
                return (
                  <span
                    key={index}
                    className="block my-4"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch (error) {
                console.error('KaTeX display error:', error);
                return <span key={index} className="text-destructive">{`$$${part.content}$$`}</span>;
              }
            } else if (part.type === 'inline') {
              try {
                const html = katex.renderToString(part.content, {
                  displayMode: false,
                  throwOnError: false,
                  output: 'html'
                });
                return (
                  <span
                    key={index}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch (error) {
                console.error('KaTeX inline error:', error);
                return <span key={index} className="text-destructive">{`$${part.content}$`}</span>;
              }
            }
            return null;
          })}
        </span>
      );
    } catch (error) {
      console.error('LatexRenderer error:', error);
      return <span className={className}>{content}</span>;
    }
  };

  return <>{renderContent()}</>;
};
