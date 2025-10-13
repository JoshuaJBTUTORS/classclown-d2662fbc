import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Video, CheckCircle2, AlertCircle } from "lucide-react";
import { ReleaseFormDialog } from "./ReleaseFormDialog";
import { VideoDetailsDialog } from "./VideoDetailsDialog";
import VideoUploadDialog from "./VideoUploadDialog";
import { TutorSubmissionsTab } from "./TutorSubmissionsTab";
import { ContentCalendar, ContentVideo } from "@/types/content";
import { TutorActiveAssignment, VideoRequest } from "@/types/videoRequest";
import { format } from "date-fns";

export const TutorContentDashboard = () => {
  const [availableVideos, setAvailableVideos] = useState<ContentCalendar[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<TutorActiveAssignment | null>(null);
  const [assignedVideo, setAssignedVideo] = useState<ContentCalendar | null>(null);
  const [requestedVideos, setRequestedVideos] = useState<Array<VideoRequest & { calendar_entry: ContentCalendar }>>([]);
  const [submittedVideos, setSubmittedVideos] = useState<Array<ContentVideo & { calendar_entry: ContentCalendar }>>([]);
  const [loading, setLoading] = useState(true);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ContentCalendar | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsVideo, setDetailsVideo] = useState<ContentCalendar | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [weekDateRange, setWeekDateRange] = useState<string>('');
  const [isBeforeWeekStart, setIsBeforeWeekStart] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [tutorId, setTutorId] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate current active week based on date
  const calculateCurrentWeek = (): number => {
    const today = new Date();
    const baseStartDate = new Date('2025-10-13'); // Week 1 starts Oct 13, 2025
    
    // If before Week 1 start, return Week 1 (to show it in preview)
    if (today < baseStartDate) {
      return 1;
    }
    
    // Calculate days since base start date
    const daysSinceStart = Math.floor((today.getTime() - baseStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Each week is 7 days
    const weekNumber = Math.floor(daysSinceStart / 7) + 1;
    
    return weekNumber;
  };

  // Get date range for a specific week
  const getWeekDateRange = (weekNumber: number): string => {
    const baseStartDate = new Date('2025-10-13');
    const weekStartDate = new Date(baseStartDate);
    weekStartDate.setDate(baseStartDate.getDate() + (weekNumber - 1) * 7);
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      });
    };
    
    return `${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}`;
  };

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

      setTutorId(tutorData);

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

      // Fetch requested videos for this tutor
      const { data: requests } = await supabase
        .from('video_requests')
        .select(`
          *,
          calendar_entry:content_calendar!video_requests_calendar_entry_id_fkey(*)
        `)
        .eq('tutor_id', tutorData)
        .order('created_at', { ascending: false });

      setRequestedVideos((requests || []) as Array<VideoRequest & { calendar_entry: ContentCalendar }>);

      // Fetch submitted videos for this tutor
      const { data: submissions } = await supabase
        .from('content_videos')
        .select(`
          *,
          calendar_entry:content_calendar!content_videos_calendar_entry_id_fkey(*)
        `)
        .eq('tutor_id', tutorData)
        .order('created_at', { ascending: false });

      setSubmittedVideos((submissions || []) as Array<ContentVideo & { calendar_entry: ContentCalendar }>);

      // Fetch available videos only if no active assignment
      if (!assignment) {
        // Calculate the current active week based on date
        const today = new Date();
        const baseStartDate = new Date('2025-10-13'); // Week 1 starts Oct 13, 2025
        const activeWeek = calculateCurrentWeek();
        
        setCurrentWeek(activeWeek);
        setWeekDateRange(getWeekDateRange(activeWeek));
        setIsBeforeWeekStart(today < baseStartDate);
        
        // Fetch videos for the current active week
        const { data: videos, error } = await supabase
          .from('content_calendar')
          .select('*')
          .eq('week_number', activeWeek)
          .eq('is_available_for_claim', true)
          .eq('status', 'planned')
          .is('assigned_tutor_id', null)
          .order('video_number', { ascending: true });

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
  if (!activeAssignment && !assignedVideo && availableVideos.length === 0 && requestedVideos.length === 0 && !loading) {
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

  const pendingRequests = requestedVideos.filter(r => r.status === 'pending');

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="active">
          Active Assignment
          {activeAssignment && <Badge className="ml-2" variant="secondary">1</Badge>}
        </TabsTrigger>
        <TabsTrigger value="submissions">
          My Submissions
          {submittedVideos.length > 0 && <Badge className="ml-2" variant="secondary">{submittedVideos.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="requested">
          Requested Videos
          {pendingRequests.length > 0 && <Badge className="ml-2" variant="secondary">{pendingRequests.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="available">
          Available Videos
          {!activeAssignment && availableVideos.length > 0 && <Badge className="ml-2" variant="secondary">{availableVideos.length}</Badge>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-6">
        {activeAssignment && assignedVideo ? (
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

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {assignedVideo.submission_deadline ? format(new Date(assignedVideo.submission_deadline), 'PPp') : 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Max Duration: {assignedVideo.max_duration_seconds}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Format: 9:16 Portrait</span>
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

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setShowUploadDialog(true)}
                >
                  Upload Video
                </Button>
              </CardContent>
            </Card>

            {tutorId && assignedVideo && (
              <VideoUploadDialog
                open={showUploadDialog}
                onOpenChange={setShowUploadDialog}
                calendarEntryId={assignedVideo.id}
                tutorId={tutorId}
                onSuccess={() => {
                  setShowUploadDialog(false);
                  fetchData();
                  toast({
                    title: "Video submitted successfully",
                    description: "Your video has been submitted for review",
                  });
                }}
              />
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Assignment</h3>
              <p className="text-muted-foreground text-center">
                You don't have an active video assignment. Request one from the Available Videos tab.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="submissions" className="mt-6">
        <TutorSubmissionsTab 
          submissions={submittedVideos}
          onRefresh={fetchData}
          tutorId={tutorId || ''}
        />
      </TabsContent>

      <TabsContent value="requested" className="mt-6">
        {requestedVideos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Requested Videos</h3>
              <p className="text-muted-foreground text-center">
                You haven't requested any videos yet. Browse available videos to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requestedVideos.map((request) => (
              <Card key={request.id} className={
                request.status === 'pending' ? 'border-yellow-500/50' :
                request.status === 'denied' ? 'border-destructive/50' :
                'border-green-500/50'
              }>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{request.calendar_entry.title}</CardTitle>
                    <Badge variant={
                      request.status === 'pending' ? 'secondary' :
                      request.status === 'denied' ? 'destructive' :
                      'success'
                    }>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  {request.calendar_entry.summary && (
                    <CardDescription>{request.calendar_entry.summary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Requested: {format(new Date(request.request_date), 'PPp')}</span>
                  </div>

                  {request.status === 'pending' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Your request is pending admin approval. You'll be notified once it's reviewed.
                      </p>
                    </div>
                  )}

                  {request.status === 'denied' && request.denial_reason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-1 text-destructive">Request Denied</h4>
                      <p className="text-sm text-muted-foreground">{request.denial_reason}</p>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Your request has been approved! Check the Active Assignment tab to start working on it.
                      </p>
                    </div>
                  )}

                  {request.release_form_accepted && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span>Release form accepted</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="available" className="mt-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Available Videos - Week {currentWeek}
              {weekDateRange && (
                <span className="text-base font-normal text-muted-foreground ml-2">
                  ({weekDateRange})
                </span>
              )}
            </h2>
            {isBeforeWeekStart ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  Coming Soon
                </Badge>
                <p className="text-muted-foreground">
                  Week {currentWeek} videos will be available from {new Date('2025-10-13').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Request a video to work on. You can only work on one video at a time.
                {currentWeek && ` Showing ${availableVideos.length} video${availableVideos.length !== 1 ? 's' : ''} available this week.`}
              </p>
            )}
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Due: {video.due_date ? format(new Date(video.due_date), 'PP') : 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{video.max_duration_seconds}s max</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Video className="w-3 h-3" />
                        <span>9:16 Portrait</span>
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
                      disabled={isBeforeWeekStart}
                    >
                      {isBeforeWeekStart ? 'Available Soon' : 'View Full Details'}
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
      </TabsContent>
    </Tabs>
  );
};
