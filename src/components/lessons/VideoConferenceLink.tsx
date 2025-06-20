import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, ExternalLink, Clipboard, CheckCircle, Users, ChevronDown, ChevronUp, Link } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

interface VideoConferenceLinkProps {
  link: string | null;
  provider: string | null;
  className?: string;
  userRole?: 'tutor' | 'student' | 'admin' | 'owner';
  isGroupLesson?: boolean;
  studentCount?: number;
  lessonId?: string;
  hasLessonSpace?: boolean;
  spaceId?: string;
  // Agora-specific props
  agoraChannelName?: string | null;
  agoraToken?: string | null;
  agoraAppId?: string;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({ 
  link, 
  provider, 
  className,
  userRole = 'tutor',
  isGroupLesson = false,
  studentCount = 0,
  lessonId,
  hasLessonSpace = false,
  spaceId,
  // Agora props
  agoraChannelName,
  agoraToken,
  agoraAppId
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isStudentLinksOpen, setIsStudentLinksOpen] = React.useState(false);
  const navigate = useNavigate();

  // Check if we have any video conference capability
  const hasAgoraRoom = provider === 'agora' && agoraChannelName && agoraToken;
  const hasVideoConference = link || hasLessonSpace || hasAgoraRoom;

  // Don't render if no video conference capabilities are available
  if (!hasVideoConference) return null;

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
      case 'agora':
        return 'Agora.io';
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

  // Update the getCorrectUrl function
  const getCorrectUrl = () => {
    if (provider === 'lesson_space' && hasLessonSpace && spaceId) {
      if (userRole === 'student') {
        // Students get the simple invite URL
        return `https://www.thelessonspace.com/space/${spaceId}`;
      } else {
        // Tutors and admins get the authenticated URL
        return link;
      }
    }
    return link;
  };

  const handleJoinLesson = () => {
    // Handle Agora rooms differently - navigate to internal video room
    if (provider === 'agora' && hasAgoraRoom && lessonId) {
      navigate(`/video-room/${lessonId}`);
      return;
    }

    // For students and parents with other providers, redirect to consent flow
    if ((userRole === 'student') && lessonId && provider !== 'agora') {
      navigate(`/join-lesson/${lessonId}`);
      return;
    }

    // For tutors, admins, and owners with non-Agora providers, join directly
    const urlToUse = getCorrectUrl();
    if (urlToUse) {
      window.open(urlToUse, '_blank');
      const providerName = getProviderName();
      toast.success(`Redirecting to ${providerName}...`);
    } else {
      toast.error('Meeting room not available');
    }
  };

  const urlToUse = getCorrectUrl();
  const showStudentJoinLink = (userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && 
                              provider === 'lesson_space' && hasLessonSpace && studentCount > 0 && spaceId;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col space-y-3">
        {/* Main lesson URL section */}
        {(urlToUse || hasAgoraRoom) && (
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
                  {provider === 'agora' && agoraChannelName && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Channel: {agoraChannelName}
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
                onClick={handleJoinLesson}
                className="flex-1"
                variant={userRole === 'tutor' ? 'default' : 'outline'}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {getJoinButtonText()}
              </Button>
              
              {/* Only show copy button for tutors/admins/owners and when we have a URL */}
              {userRole !== 'student' && urlToUse && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(urlToUse)}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {userRole === 'tutor' && provider === 'lesson_space' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Teacher privileges:</strong> You have full control of the lesson space with leader permissions.
              </div>
            )}

            {userRole === 'tutor' && provider === 'agora' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Host privileges:</strong> You have full control of the Agora meeting room.
              </div>
            )}

            {userRole === 'student' && provider === 'lesson_space' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Student access:</strong> Click "Join Lesson" to review requirements and enter the lesson space.
              </div>
            )}

            {userRole === 'student' && provider === 'agora' && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Student access:</strong> Click "Join Lesson" to review requirements and enter the meeting.
              </div>
            )}
          </>
        )}

        {/* Student invite link section for tutors/admins */}
        {showStudentJoinLink && (
          <div className="border-t pt-3">
            <Collapsible open={isStudentLinksOpen} onOpenChange={setIsStudentLinksOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground">
                <span>Student Invite Link</span>
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
                    <span className="text-sm">Student invite URL</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://www.thelessonspace.com/space/${spaceId}`, '_blank')}
                      className="h-7 px-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`https://www.thelessonspace.com/space/${spaceId}`)}
                      className="h-7 px-2"
                    >
                      <Clipboard className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Share this simple URL with students to join the lesson.
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
