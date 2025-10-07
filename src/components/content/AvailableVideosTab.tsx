import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentCalendar } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Sparkles, Video } from 'lucide-react';
import { format } from 'date-fns';

const AvailableVideosTab = () => {
  const [openVideos, setOpenVideos] = useState<ContentCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const { toast } = useToast();

  const subjects = ['all', 'Maths', 'English', 'Science'];
  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    fetchOpenVideos();
  }, []);

  const fetchOpenVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('is_open_assignment', true)
        .eq('status', 'planned')
        .eq('video_type', 'motivational')
        .is('assigned_tutor_id', null)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setOpenVideos((data || []) as ContentCalendar[]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading open videos',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVideo = async (videoId: string) => {
    try {
      setClaiming(videoId);
      
      // Get current user's tutor ID
      const { data: tutorData, error: tutorError } = await supabase
        .rpc('get_current_user_tutor_id');

      if (tutorError) throw tutorError;
      if (!tutorData) {
        throw new Error('You must be registered as a content tutor to claim videos');
      }

      // Claim the video
      const { error } = await supabase
        .from('content_calendar')
        .update({
          assigned_tutor_id: tutorData,
          status: 'assigned',
        })
        .eq('id', videoId)
        .eq('status', 'planned')
        .is('assigned_tutor_id', null);

      if (error) throw error;

      toast({
        title: 'Video claimed!',
        description: 'The video has been assigned to you. You can now upload content for it.',
      });

      // Refresh the list
      fetchOpenVideos();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to claim video',
        description: error.message,
      });
    } finally {
      setClaiming(null);
    }
  };

  const filteredVideos = openVideos.filter(
    video => selectedSubject === 'all' || video.subject === selectedSubject
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading available videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Available Motivational Videos</h2>
          <p className="text-muted-foreground">
            Claim open videos to contribute to the content calendar
          </p>
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Open Videos Available</h3>
            <p className="text-muted-foreground">
              {selectedSubject === 'all'
                ? 'All motivational videos have been claimed. Check back later!'
                : `No open ${selectedSubject} videos at the moment.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {shortMonthNames[video.month - 1]}
                  </Badge>
                  <Badge className="bg-purple-500 hover:bg-purple-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Motivational
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 text-xs mt-2">
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    #{video.video_number}
                  </span>
                  <span className="font-medium">{video.subject}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {video.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.summary}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {video.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {format(new Date(video.due_date), 'MMM d')}</span>
                    </div>
                  )}
                  {video.max_duration_seconds && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{video.max_duration_seconds}s</span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => handleClaimVideo(video.id)}
                  disabled={claiming === video.id}
                  className="w-full"
                >
                  {claiming === video.id ? 'Claiming...' : 'Claim This Video'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableVideosTab;
