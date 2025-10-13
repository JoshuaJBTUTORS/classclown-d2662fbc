import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video } from 'lucide-react';

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarEntryId: string;
  tutorId: string;
  onSuccess: () => void;
}

const VideoUploadDialog = ({
  open,
  onOpenChange,
  calendarEntryId,
  tutorId,
  onSuccess,
}: VideoUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Video must be under 500MB',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a video file',
      });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!videoFile || !title) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide a title and select a video file',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${calendarEntryId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('content-videos')
        .upload(filePath, videoFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-videos')
        .getPublicUrl(filePath);

      // Create video record
      const { error: insertError } = await supabase
        .from('content_videos')
        .insert({
          calendar_entry_id: calendarEntryId,
          tutor_id: tutorId,
          video_url: publicUrl,
          title,
          description,
          file_size_mb: videoFile.size / (1024 * 1024),
          status: 'uploaded',
        });

      if (insertError) throw insertError;

      // Update calendar entry status
      await supabase
        .from('content_calendar')
        .update({ status: 'uploaded' })
        .eq('id', calendarEntryId);

      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setVideoPreview(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-2">
            {/* Video Format Requirements Alert */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Required Video Format
                  </p>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Aspect Ratio:</strong> 9:16 (Portrait/Vertical)</li>
                    <li>• <strong>Recommended:</strong> 1080x1920 pixels</li>
                    <li>• <strong>Max Size:</strong> 500MB</li>
                    <li>• <strong>Orientation:</strong> Record in portrait mode</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="video">Video File *</Label>
              <div className="mt-2">
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('video')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {videoFile ? videoFile.name : 'Choose Video File'}
                </Button>
              </div>
            </div>

            {videoPreview && (
              <div className="border rounded-lg overflow-hidden">
                <video
                  src={videoPreview}
                  controls
                  className="w-full"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={uploading || !videoFile || !title}
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadDialog;
