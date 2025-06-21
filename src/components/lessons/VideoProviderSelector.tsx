
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Video, Globe, Users } from 'lucide-react';

interface VideoProviderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: 'lesson_space' | 'agora') => void;
  isCreating: boolean;
  isGroupLesson: boolean;
  studentCount: number;
}

const VideoProviderSelector: React.FC<VideoProviderSelectorProps> = ({
  isOpen,
  onClose,
  onSelectProvider,
  isCreating,
  isGroupLesson,
  studentCount
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'lesson_space' | 'agora'>('lesson_space');

  const handleCreate = () => {
    onSelectProvider(selectedProvider);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Create Online Room
          </DialogTitle>
          <DialogDescription>
            Choose a video conferencing provider for your {isGroupLesson ? 'group ' : ''}lesson
            {isGroupLesson && ` (${studentCount} students)`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as 'lesson_space' | 'agora')}>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="lesson_space" id="lesson_space" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="lesson_space" className="flex items-center gap-2 font-medium cursor-pointer">
                    <Globe className="h-4 w-4 text-blue-500" />
                    Lesson Space
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browser-based virtual classroom with whiteboard, screen sharing, and interactive tools. 
                    Perfect for tutoring sessions.
                  </p>
                  <div className="mt-2 text-xs text-green-600">
                    ✓ No downloads required ✓ Interactive whiteboard ✓ Screen sharing
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="agora" id="agora" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="agora" className="flex items-center gap-2 font-medium cursor-pointer">
                    <Users className="h-4 w-4 text-purple-500" />
                    Agora Video Room
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    High-quality video conferencing with advanced features built into the platform.
                    Ideal for larger group sessions and professional meetings.
                  </p>
                  <div className="mt-2 text-xs text-blue-600">
                    ✓ HD video quality ✓ Recording capabilities ✓ Advanced controls ✓ Interactive whiteboard
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              `Create ${selectedProvider === 'lesson_space' ? 'Lesson Space' : 'Agora Video'} Room`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoProviderSelector;
