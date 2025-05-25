
import React, { useRef, useEffect } from 'react';

interface VideoEmbedProps {
  src: string;
  title?: string;
  className?: string;
  onProgress?: (percentage: number) => void;
  onComplete?: () => void;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ 
  src, 
  title = 'Video content', 
  className = '',
  onProgress,
  onComplete
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract Vimeo ID from URL if full URL is provided
  const getVimeoId = (url: string) => {
    if (!url) return null;
    
    // Handle different Vimeo URL formats
    const patterns = [
      /vimeo\.com\/(\d+)/, // vimeo.com/123456789
      /vimeo\.com\/channels\/[^/]+\/(\d+)/, // vimeo.com/channels/channel/123456789
      /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/, // vimeo.com/groups/group/videos/123456789
      /player\.vimeo\.com\/video\/(\d+)/, // player.vimeo.com/video/123456789
      /(\d+)/ // Just the ID itself
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return url; // Return original if no pattern matches
  };
  
  const vimeoId = getVimeoId(src);
  const embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : src;

  useEffect(() => {
    // Set up Vimeo player API for progress tracking
    if (vimeoId && (onProgress || onComplete)) {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = () => {
        if (window.Vimeo && iframeRef.current) {
          const player = new window.Vimeo.Player(iframeRef.current);
          
          // Track progress every second
          player.on('timeupdate', (data: any) => {
            const percentage = (data.seconds / data.duration) * 100;
            onProgress?.(percentage);
            
            // Mark as complete when 90% watched
            if (percentage >= 90) {
              onComplete?.();
            }
          });
        }
      };
      
      if (!document.querySelector(`script[src="${script.src}"]`)) {
        document.head.appendChild(script);
      }
    }
  }, [vimeoId, onProgress, onComplete]);

  return (
    <div className={`aspect-video w-full ${className}`}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        className="w-full h-full rounded-md"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

// Extend window object for Vimeo Player
declare global {
  interface Window {
    Vimeo: any;
  }
}

export default VideoEmbed;
