
import React from 'react';

interface VideoEmbedProps {
  src: string;
  title?: string;
  className?: string;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ 
  src, 
  title = 'Video content', 
  className = ''
}) => {
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

  return (
    <div className={`aspect-video w-full ${className}`}>
      <iframe
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

export default VideoEmbed;
