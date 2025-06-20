
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, UserPlus, Settings, MoreVertical, Share, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VideoRoomHeaderProps {
  lessonTitle: string;
  participantCount: number;
  userRole: 'tutor' | 'student';
  isRecording?: boolean;
  onLeave: () => void;
}

const VideoRoomHeader: React.FC<VideoRoomHeaderProps> = ({
  lessonTitle,
  participantCount,
  userRole,
  isRecording = false,
  onLeave
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Leave
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 font-playfair">
              {lessonTitle}
            </h1>
            {isRecording && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Circle className="h-3 w-3" />
                Recording
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{participantCount} participants</span>
            <span>•</span>
            <span className="capitalize">{userRole}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {userRole === 'tutor' && (
          <>
            <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-900">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-900">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
            <div className="h-6 w-px bg-gray-200 mx-1" />
          </>
        )}
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VideoRoomHeader;
