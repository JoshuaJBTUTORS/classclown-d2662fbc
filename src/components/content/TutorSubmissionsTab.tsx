import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Video, Download, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ContentCalendar, ContentVideo } from "@/types/content";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface TutorSubmissionsTabProps {
  submissions: Array<ContentVideo & { calendar_entry: ContentCalendar }>;
  onRefresh: () => void;
  tutorId: string;
}

export const TutorSubmissionsTab = ({ submissions, onRefresh, tutorId }: TutorSubmissionsTabProps) => {
  const [previewVideo, setPreviewVideo] = useState<ContentVideo | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="success" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Video className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
          <p className="text-muted-foreground text-center">
            You haven't submitted any videos yet. Complete your active assignment to see your submissions here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id} className={
            submission.status === 'uploaded' ? 'border-yellow-500/50' :
            submission.status === 'rejected' ? 'border-destructive/50' :
            'border-green-500/50'
          }>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{submission.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assignment: {submission.calendar_entry.title}
                  </p>
                </div>
                {getStatusBadge(submission.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.description && (
                <p className="text-sm text-muted-foreground">{submission.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Submitted: {submission.created_at ? format(new Date(submission.created_at), 'PPp') : 'N/A'}</span>
                </div>
                {submission.file_size_mb && (
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Size: {submission.file_size_mb.toFixed(2)} MB</span>
                  </div>
                )}
              </div>

              {submission.status === 'uploaded' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Your video is pending review by an administrator
                  </p>
                </div>
              )}

              {submission.status === 'approved' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Video approved{submission.approved_at ? ` on ${format(new Date(submission.approved_at), 'PPp')}` : ''}
                  </p>
                </div>
              )}

              {submission.status === 'rejected' && submission.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-1 text-destructive">Rejection Reason:</h4>
                  <p className="text-sm text-muted-foreground">{submission.rejection_reason}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPreviewVideo(submission)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Video
                </Button>
                {submission.status === 'approved' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(submission.video_url, '_blank')}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewVideo?.title}</DialogTitle>
            <DialogDescription>
              Preview your submitted video
            </DialogDescription>
          </DialogHeader>
          {previewVideo && (
            <div className="space-y-4">
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  src={previewVideo.video_url}
                  controls
                  className="w-full max-h-[70vh]"
                  preload="metadata"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="mt-1">{getStatusBadge(previewVideo.status)}</div>
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>
                  <p className="text-muted-foreground mt-1">
                    {previewVideo.created_at ? format(new Date(previewVideo.created_at), 'PPp') : 'N/A'}
                  </p>
                </div>
                {previewVideo.file_size_mb && (
                  <div>
                    <span className="font-medium">File Size:</span>
                    <p className="text-muted-foreground mt-1">{previewVideo.file_size_mb.toFixed(2)} MB</p>
                  </div>
                )}
                {previewVideo.description && (
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span>
                    <p className="text-muted-foreground mt-1">{previewVideo.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
