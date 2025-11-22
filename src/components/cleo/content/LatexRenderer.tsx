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
      // Split content by display math ($$...$$) and inline math ($...$)
      const parts: Array<{ type: 'text' | 'display' | 'inline'; content: string }> = [];
      let currentIndex = 0;
      
      // Regex to match display math ($$...$$ or \[...\]) or inline math ($...$ or \(...\))
      const mathRegex = /\$\$([^$]+?)\$\$|\$([^$]+?)\$|\\[\s]*([^\]]+?)\\]|\\\\?\(([^)]+?)\\\\?\)/g;
      let match;
      
      while ((match = mathRegex.exec(content)) !== null) {
        // Add text before the math
        if (match.index > currentIndex) {
          parts.push({
            type: 'text',
            content: content.slice(currentIndex, match.index)
          });
        }
        
        // Add the math expression
        if (match[1] || match[3]) {
          // Display math ($$...$$ or \[...\])
          parts.push({
            type: 'display',
            content: (match[1] || match[3]).trim()
          });
        } else if (match[2] || match[4]) {
          // Inline math ($...$ or \(...\))
          parts.push({
            type: 'inline',
            content: (match[2] || match[4]).trim()
          });
        }
        
        currentIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (currentIndex < content.length) {
        parts.push({
          type: 'text',
          content: content.slice(currentIndex)
        });
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
