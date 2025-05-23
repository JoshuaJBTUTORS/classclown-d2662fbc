
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, ExternalLink, Clipboard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoConferenceLinkProps {
  link: string | null;
  provider: string | null;
  className?: string;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({ link, provider, className }) => {
  const [copied, setCopied] = React.useState(false);

  if (!link) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied to clipboard");
    
    setTimeout(() => setCopied(false), 2000);
  };

  const getProviderName = () => {
    switch (provider) {
      case 'lesson_space':
        return 'Lesson Space';
      case 'google_meet':
        return 'Google Meet';
      case 'zoom':
        return 'Zoom';
      default:
        return 'Video Conference';
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center">
          <Video className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-sm font-medium">{getProviderName()}</h3>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => window.open(link, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Join Lesson
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={copyToClipboard}
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoConferenceLink;
