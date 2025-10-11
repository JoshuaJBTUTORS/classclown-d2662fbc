import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, CheckCircle2 } from "lucide-react";
import { ReleaseFormDialog } from "./ReleaseFormDialog";
import { VideoDetailsDialog } from "./VideoDetailsDialog";
import { ContentCalendar } from "@/types/content";
import { TutorActiveAssignment } from "@/types/videoRequest";
import { format } from "date-fns";

export const TutorContentDashboard = () => {
  const [availableVideos, setAvailableVideos] = useState<ContentCalendar[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<TutorActiveAssignment | null>(null);
  const [assignedVideo, setAssignedVideo] = useState<ContentCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ContentCalendar | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsVideo, setDetailsVideo] = useState<ContentCalendar | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current tutor ID
      const { data: tutorData } = await supabase.rpc('get_current_user_tutor_id');
      
      if (!tutorData) {
        setLoading(false);
        return;
      }

      // Check if tutor is registered in content_tutors
      const { data: contentTutor } = await supabase
        .from('content_tutors')
        .select('is_active')
        .eq('tutor_id', tutorData)
        .maybeSingle();

      if (!contentTutor || !contentTutor.is_active) {
        setLoading(false);
        return;
      }

      // Check for active assignment
      const { data: assignment } = await supabase
        .from('tutor_active_assignments')
        .select('*')
        .eq('tutor_id', tutorData)
        .maybeSingle();

      setActiveAssignment(assignment);

      // If has active assignment, fetch that video
      if (assignment) {
        const { data: video } = await supabase
          .from('content_calendar')
          .select('*')
          .eq('id', assignment.calendar_entry_id)
          .single();
        
        setAssignedVideo(video);
      }

      // Fetch available videos only if no active assignment
      if (!assignment) {
        const { data: videos, error } = await supabase
          .from('content_calendar')
          .select('*')
          .eq('is_available_for_claim', true)
          .eq('status', 'planned')
          .is('assigned_tutor_id', null)
          .order('due_date', { ascending: true });

        if (error) throw error;
        setAvailableVideos(videos || []);
      }
    } catch (error: any) {
      toast({
        title: "Error loading content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVideo = (video: ContentCalendar) => {
    setSelectedVideo(video);
    setShowReleaseForm(true);
  };

  const handleAcceptReleaseForm = async () => {
    if (!selectedVideo) return;

    try {
      const { data: tutorData } = await supabase.rpc('get_current_user_tutor_id');
      
      const { error } = await supabase
        .from('video_requests')
        .insert({
          calendar_entry_id: selectedVideo.id,
          tutor_id: tutorData,
          release_form_accepted: true,
          release_form_accepted_at: new Date().toISOString(),
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Your video request has been submitted for approval",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if tutor has access
  if (!activeAssignment && !assignedVideo && availableVideos.length === 0 && !loading) {
    return (
      <Card className="p-8 text-center">
        <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Content Creation Access Required</h3>
        <p className="text-muted-foreground">
          You don't have access to content creation yet. 
          Please contact an administrator to be added to the content creation platform.
        </p>
      </Card>
    );
  }

  // Show current assignment if exists
  if (activeAssignment && assignedVideo) {
    return (
      <div className="space-y-6">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Your Current Assignment
            </CardTitle>
            <CardDescription>
              Complete this video before requesting another
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{assignedVideo.title}</h3>
              {assignedVideo.summary && (
                <p className="text-muted-foreground mt-2">{assignedVideo.summary}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Due: {assignedVideo.submission_deadline ? format(new Date(assignedVideo.submission_deadline), 'PPp') : 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Max Duration: {assignedVideo.max_duration_seconds}s</span>
              </div>
            </div>

            {assignedVideo.hook && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <h4 className="font-medium mb-2">Hook:</h4>
                <p className="text-sm text-muted-foreground">{assignedVideo.hook}</p>
              </div>
            )}

            {assignedVideo.talking_points && assignedVideo.talking_points.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Key Points to Cover:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {assignedVideo.talking_points.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {(assignedVideo.lighting_requirements || assignedVideo.audio_requirements || assignedVideo.quality_requirements) && (
              <div>
                <h4 className="font-medium mb-2">Technical Requirements:</h4>
                <div className="space-y-2">
                  {assignedVideo.lighting_requirements && (
                    <div className="text-sm">
                      <span className="font-medium">Lighting:</span>{' '}
                      <span className="text-muted-foreground">{assignedVideo.lighting_requirements}</span>
                    </div>
                  )}
                  {assignedVideo.audio_requirements && (
                    <div className="text-sm">
                      <span className="font-medium">Audio:</span>{' '}
                      <span className="text-muted-foreground">{assignedVideo.audio_requirements}</span>
                    </div>
                  )}
                  {assignedVideo.quality_requirements && (
                    <div className="text-sm">
                      <span className="font-medium">Quality:</span>{' '}
                      <span className="text-muted-foreground">{assignedVideo.quality_requirements}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button className="w-full" size="lg">
              Upload Video
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show available videos
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Available Videos</h2>
        <p className="text-muted-foreground">
          Request a video to work on. You can only work on one video at a time.
        </p>
      </div>

      {availableVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Videos Available</h3>
            <p className="text-muted-foreground text-center">
              All videos have been claimed. Check back later for new assignments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {availableVideos.map((video) => (
            <Card 
              key={video.id} 
              className="hover:border-primary transition-colors cursor-pointer"
              onClick={() => {
                setDetailsVideo(video);
                setShowDetailsDialog(true);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <Badge variant="secondary">{video.video_format}</Badge>
                </div>
                {video.summary && (
                  <CardDescription>{video.summary}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Due: {video.due_date ? format(new Date(video.due_date), 'PP') : 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{video.max_duration_seconds}s max</span>
                  </div>
                </div>

                {video.talking_points && video.talking_points.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Points:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {video.talking_points.slice(0, 3).map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                      {video.talking_points.length > 3 && (
                        <li className="text-primary">+{video.talking_points.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailsVideo(video);
                    setShowDetailsDialog(true);
                  }}
                >
                  View Full Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {detailsVideo && (
        <VideoDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          video={detailsVideo}
          onRequestVideo={() => {
            setShowDetailsDialog(false);
            setSelectedVideo(detailsVideo);
            setShowReleaseForm(true);
          }}
        />
      )}

      {selectedVideo && (
        <ReleaseFormDialog
          open={showReleaseForm}
          onOpenChange={setShowReleaseForm}
          onAccept={handleAcceptReleaseForm}
          videoTitle={selectedVideo.title}
        />
      )}
    </div>
  );
};
