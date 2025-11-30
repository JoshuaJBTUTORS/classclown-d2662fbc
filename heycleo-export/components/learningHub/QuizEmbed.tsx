
import React from 'react';

interface QuizEmbedProps {
  src: string;
  title?: string;
  className?: string;
}

const QuizEmbed: React.FC<QuizEmbedProps> = ({ src, title = 'Quiz content', className = '' }) => {
  // Check if the source is a full embed code or just a URL
  const isFullEmbed = src.includes('<iframe');
  
  // Extract the URL from the embed code if necessary
  const extractSrc = (embedCode: string): string => {
    const srcMatch = embedCode.match(/src=["'](.*?)["']/);
    return srcMatch ? srcMatch[1] : embedCode;
  };
  
  const quizUrl = isFullEmbed ? extractSrc(src) : src;
  
  return (
    <div className={`aspect-video w-full ${className}`}>
      <iframe
        src={quizUrl}
        title={title}
        className="w-full h-full rounded-md"
        frameBorder="0"
        allow="fullscreen"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default QuizEmbed;
