import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Lightbulb, Mic, Sparkles } from "lucide-react";
import { ContentCalendar } from "@/types/content";
import { format } from "date-fns";

interface VideoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: ContentCalendar;
  onRequestVideo: () => void;
}

export const VideoDetailsDialog = ({
  open,
  onOpenChange,
  video,
  onRequestVideo,
}: VideoDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{video.title}</DialogTitle>
              <DialogDescription>
                Review all requirements before requesting this video
              </DialogDescription>
            </div>
            <Badge variant="secondary">{video.video_format}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Due Date</p>
                <p className="text-muted-foreground">
                  {video.due_date ? format(new Date(video.due_date), 'PPp') : 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Max Duration</p>
                <p className="text-muted-foreground">{video.max_duration_seconds}s</p>
              </div>
            </div>
            {video.subject && (
              <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Subject</p>
                  <p className="text-muted-foreground">{video.subject}</p>
                </div>
              </div>
            )}
            {video.video_type && (
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Type</p>
                  <p className="text-muted-foreground capitalize">{video.video_type}</p>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {video.summary && (
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{video.summary}</p>
            </div>
          )}

          {/* Hook */}
          {video.hook && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Hook</h4>
              </div>
              <p className="text-sm text-muted-foreground">{video.hook}</p>
            </div>
          )}

          {/* Talking Points */}
          {video.talking_points && video.talking_points.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Key Points to Cover</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                {video.talking_points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          <div className="space-y-4">
            <h4 className="font-semibold">Technical Requirements</h4>
            
            {video.lighting_requirements && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-sm">Lighting</p>
                </div>
                <p className="text-sm text-muted-foreground">{video.lighting_requirements}</p>
              </div>
            )}

            {video.audio_requirements && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-sm">Audio</p>
                </div>
                <p className="text-sm text-muted-foreground">{video.audio_requirements}</p>
              </div>
            )}

            {video.quality_requirements && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-sm">Quality</p>
                </div>
                <p className="text-sm text-muted-foreground">{video.quality_requirements}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={onRequestVideo}
            >
              Request This Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
