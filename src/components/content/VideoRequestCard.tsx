import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VideoRequest } from "@/types/videoRequest";
import { ContentCalendar } from "@/types/content";
import { Tutor } from "@/types/tutor";
import { format } from "date-fns";
import { CheckCircle2, XCircle, User, Calendar, FileText } from "lucide-react";

interface VideoRequestCardProps {
  request: VideoRequest;
  video: ContentCalendar;
  tutor: Tutor;
  onApprove: (requestId: string) => Promise<void>;
  onDeny: (requestId: string, reason: string) => Promise<void>;
}

export const VideoRequestCard = ({ request, video, tutor, onApprove, onDeny }: VideoRequestCardProps) => {
  const [showDenialReason, setShowDenialReason] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(request.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!denialReason.trim()) return;
    
    setIsProcessing(true);
    try {
      await onDeny(request.id, denialReason);
      setShowDenialReason(false);
      setDenialReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{video.title}</CardTitle>
            <CardDescription>
              Requested {format(new Date(request.request_date), 'PPp')}
            </CardDescription>
          </div>
          <Badge>{request.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{tutor.first_name} {tutor.last_name}</span>
            <span className="text-muted-foreground">({tutor.email})</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Due: {video.submission_deadline ? format(new Date(video.submission_deadline), 'PPp') : 'Not set'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span>Release Form: {request.release_form_accepted ? 'Signed' : 'Not signed'}</span>
          </div>
        </div>

        {video.summary && (
          <div className="pt-2 border-t">
            <h4 className="font-medium text-sm mb-2">Video Brief:</h4>
            <p className="text-sm text-muted-foreground">{video.summary}</p>
          </div>
        )}

        {!showDenialReason ? (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Request
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowDenialReason(true)}
              disabled={isProcessing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Deny Request
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="Enter reason for denial..."
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDenialReason(false);
                  setDenialReason("");
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeny}
                disabled={!denialReason.trim() || isProcessing}
              >
                Confirm Denial
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
