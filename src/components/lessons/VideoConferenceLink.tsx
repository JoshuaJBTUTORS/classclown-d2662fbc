
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, ExternalLink, Clipboard, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoConferenceLinkProps {
  link: string | null;
  provider: string | null;
  className?: string;
  userRole?: 'teacher' | 'student';
  isGroupLesson?: boolean;
  studentCount?: number;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({ 
  link, 
  provider, 
  className,
  userRole = 'teacher',
  isGroupLesson = false,
  studentCount = 0
}) => {
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

  const getJoinButtonText = () => {
    if (userRole === 'teacher') {
      return isGroupLesson ? 'Start Group Lesson' : 'Start Lesson';
    }
    return 'Join Lesson';
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Video className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium">{getProviderName()}</h3>
              {isGroupLesson && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3 mr-1" />
                  <span>Group lesson • {studentCount} participants</span>
                </div>
              )}
            </div>
          </div>
          {userRole === 'teacher' && (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              Leader
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => window.open(link, '_blank')}
            className="flex-1"
            variant={userRole === 'teacher' ? 'default' : 'outline'}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {getJoinButtonText()}
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

        {userRole === 'teacher' && provider === 'lesson_space' && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <strong>Teacher privileges:</strong> You can control participant audio/video, 
            enable leader mode, and manage the session.
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoConferenceLink;
