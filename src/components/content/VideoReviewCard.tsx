import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';

interface VideoReviewCardProps {
  video: {
    id: string;
    title: string;
    description?: string;
    video_url: string;
    thumbnail_url?: string;
    upload_date: string;
    duration_seconds?: number;
    file_size_mb?: number;
    status: string;
    tutor_id: string;
  };
  onApprove: (videoId: string) => Promise<void>;
  onReject: (videoId: string, reason: string) => Promise<void>;
}

const VideoReviewCard = ({ video, onApprove, onReject }: VideoReviewCardProps) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(video.id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    try {
      await onReject(video.id, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="space-y-4">
          {/* Video preview thumbnail */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group cursor-pointer" onClick={() => setShowPreview(true)}>
            {video.thumbnail_url ? (
              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Eye className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Video info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{video.title}</h3>
              <Badge variant="outline">{video.status}</Badge>
            </div>
            {video.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Uploaded {format(new Date(video.upload_date), 'MMM dd, yyyy')}</span>
              {video.duration_seconds && <span>{Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}</span>}
              {video.file_size_mb && <span>{video.file_size_mb.toFixed(1)} MB</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleApprove}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowRejectDialog(true)}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(video.video_url, '_blank')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={!rejectReason.trim() || loading}
              >
                Reject Video
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{video.title}</DialogTitle>
          </DialogHeader>
          <video
            src={video.video_url}
            controls
            className="w-full rounded-lg"
            autoPlay
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoReviewCard;
