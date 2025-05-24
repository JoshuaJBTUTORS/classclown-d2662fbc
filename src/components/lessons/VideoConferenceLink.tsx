
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, ExternalLink, Clipboard, CheckCircle, Users, ChevronDown, ChevronUp, AlertTriangle, Link } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface VideoConferenceLinkProps {
  link: string | null;
  provider: string | null;
  className?: string;
  userRole?: 'tutor' | 'student' | 'admin' | 'owner';
  isGroupLesson?: boolean;
  studentCount?: number;
  lessonId?: string;
  hasLessonSpace?: boolean;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({ 
  link, 
  provider, 
  className,
  userRole = 'tutor',
  isGroupLesson = false,
  studentCount = 0,
  lessonId,
  hasLessonSpace = false
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isStudentLinksOpen, setIsStudentLinksOpen] = React.useState(false);

  // Don't render if no links are available and no lesson space
  if (!link && !hasLessonSpace) return null;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
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
    if (userRole === 'tutor') {
      return isGroupLesson ? 'Start Group Lesson' : 'Start Lesson';
    }
    return 'Join Lesson';
  };

  const getRoleDescription = () => {
    if (userRole === 'tutor') {
      return 'Teacher Access';
    } else if (userRole === 'student') {
      return 'Student Access';
    }
    return 'Admin Access';
  };

  // Generate student join URL for the single link workflow
  const getStudentJoinUrl = () => {
    if (!lessonId) return null;
    return `${window.location.origin}/join-lesson/${lessonId}`;
  };

  const showStudentJoinLink = (userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && 
                              provider === 'lesson_space' && hasLessonSpace && studentCount > 0;

  // For students using Lesson Space, show the join page link instead of direct access
  const shouldShowJoinPage = userRole === 'student' && provider === 'lesson_space' && hasLessonSpace;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col space-y-3">
        {/* Main lesson URL section */}
        {(link || shouldShowJoinPage) && (
          <>
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
              <div className={cn(
                "text-xs px-2 py-1 rounded",
                userRole === 'tutor' 
                  ? "text-green-600 bg-green-50" 
                  : userRole === 'student'
                  ? "text-blue-600 bg-blue-50"
                  : "text-purple-600 bg-purple-50"
              )}>
                {getRoleDescription()}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => {
                  if (shouldShowJoinPage) {
                    window.open(getStudentJoinUrl(), '_self');
                  } else {
                    window.open(link!, '_blank');
                  }
                }}
                className="flex-1"
                variant={userRole === 'tutor' ? 'default' : 'outline'}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {getJoinButtonText()}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyToClipboard(shouldShowJoinPage ? getStudentJoinUrl()! : link!)}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </Button>
            </div>

            {userRole === 'tutor' && provider === 'lesson_space' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Teacher privileges:</strong> You can control participant audio/video, 
                enable leader mode, and manage the session.
              </div>
            )}

            {userRole === 'student' && provider === 'lesson_space' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Student access:</strong> Click "Join Lesson" to authenticate and access your personalized lesson space.
              </div>
            )}
          </>
        )}

        {/* Student join link section for tutors/admins */}
        {showStudentJoinLink && (
          <div className="border-t pt-3">
            <Collapsible open={isStudentLinksOpen} onOpenChange={setIsStudentLinksOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground">
                <span>Student Join Link</span>
                {isStudentLinksOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Link className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm">Share this link with students</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getStudentJoinUrl(), '_blank')}
                      className="h-7 px-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getStudentJoinUrl()!)}
                      className="h-7 px-2"
                    >
                      <Clipboard className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Students will be authenticated and redirected to their personal lesson space.
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoConferenceLink;
