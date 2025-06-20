
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, UserPlus, Settings, MoreVertical } from 'lucide-react';

interface VideoRoomHeaderProps {
  lessonTitle: string;
  participantCount: number;
  onLeave: () => void;
}

const VideoRoomHeader: React.FC<VideoRoomHeaderProps> = ({
  lessonTitle,
  participantCount,
  onLeave
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 font-playfair">
            {lessonTitle}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{participantCount} participants</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="text-gray-600">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-600">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-600">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VideoRoomHeader;
