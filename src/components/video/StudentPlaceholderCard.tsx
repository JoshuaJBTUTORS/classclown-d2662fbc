
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MicOff, VideoOff, Clock } from 'lucide-react';

interface StudentPlaceholderCardProps {
  studentName: string;
}

const StudentPlaceholderCard: React.FC<StudentPlaceholderCardProps> = ({
  studentName
}) => {
  const initials = studentName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="relative bg-gray-800 border-gray-600 border-dashed border-2 overflow-hidden aspect-video shadow-lg opacity-60">
      {/* Placeholder content */}
      <div className="w-full h-full relative">
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <div className="text-center">
            <Avatar className="w-12 h-12 mx-auto mb-2">
              <AvatarFallback className="bg-gray-600 text-gray-300 text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center justify-center gap-1 text-gray-400">
              <Clock className="h-3 w-3" />
              <span className="text-xs">Not joined</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-medium truncate">
              {studentName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-gray-600 rounded-full p-1">
              <MicOff className="h-2.5 w-2.5 text-gray-300" />
            </div>
            <div className="bg-gray-600 rounded-full p-1">
              <VideoOff className="h-2.5 w-2.5 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StudentPlaceholderCard;
