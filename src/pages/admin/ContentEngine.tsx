import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentCalendar } from '@/types/content';
import ContentCalendarGrid from '@/components/content/ContentCalendarGrid';
import VideoReviewCard from '@/components/content/VideoReviewCard';
import ContentStatistics from '@/components/content/ContentStatistics';
import AvailableVideosTab from '@/components/content/AvailableVideosTab';
import { ExcelImportDialog } from '@/components/content/ExcelImportDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles } from 'lucide-react';

const ContentEngine = () => {
  const [entries, setEntries] = useState<ContentCalendar[]>([]);
  const [pendingVideos, setPendingVideos] = useState<any[]>([]);
  const [approvedVideos, setApprovedVideos] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({
    totalVideos: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    averageApprovalTime: 0,
    activeTutors: 0,
    videosThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ContentCalendar | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchCalendarEntries(),
      fetchPendingVideos(),
      fetchApprovedVideos(),
      fetchStatistics(),
    ]);
    setLoading(false);
  };

  const fetchCalendarEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .order('month', { ascending: true })
        .order('video_number', { ascending: true });

      if (error) throw error;
      setEntries((data || []) as ContentCalendar[]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching calendar',
        description: error.message,
      });
    }
  };

  const fetchPendingVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('content_videos')
        .select('*')
        .eq('status', 'uploaded')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setPendingVideos(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching pending videos',
        description: error.message,
      });
    }
  };

  const fetchApprovedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('content_videos')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (error) throw error;
      setApprovedVideos(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching approved videos',
        description: error.message,
      });
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data: videos } = await supabase.from('content_videos').select('*');
      const { data: tutors } = await supabase.from('content_tutors').select('*').eq('is_active', true);

      if (videos) {
        const approved = videos.filter((v) => v.status === 'approved');
        const rejected = videos.filter((v) => v.status === 'rejected');
        const pending = videos.filter((v) => v.status === 'uploaded');
        
        const currentMonth = new Date().getMonth() + 1;
        const videosThisMonth = videos.filter(
          (v) => new Date(v.upload_date).getMonth() + 1 === currentMonth
        );

        // Calculate average approval time
        let totalApprovalTime = 0;
        let approvedCount = 0;
        approved.forEach((v) => {
          if (v.upload_date && v.approved_at) {
            const uploadTime = new Date(v.upload_date).getTime();
            const approvalTime = new Date(v.approved_at).getTime();
            totalApprovalTime += (approvalTime - uploadTime) / (1000 * 60 * 60); // hours
            approvedCount++;
          }
        });

        setStatistics({
          totalVideos: videos.length,
          approved: approved.length,
          rejected: rejected.length,
          pending: pending.length,
          averageApprovalTime: approvedCount > 0 ? totalApprovalTime / approvedCount : 0,
          activeTutors: tutors?.length || 0,
          videosThisMonth: videosThisMonth.length,
        });
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleApproveVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('content_videos')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Video approved successfully',
      });

      fetchAllData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleRejectVideo = async (videoId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('content_videos')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: 'Video rejected',
        description: 'The tutor will be notified',
      });

      fetchAllData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Engine</h1>
        <p className="text-muted-foreground mt-2">Manage video content creation and approval workflow</p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="available">
            <Sparkles className="h-4 w-4 mr-2" />
            Available Videos
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review
            {pendingVideos.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {pendingVideos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">Content Calendar</h3>
              <p className="text-sm text-muted-foreground">
                {entries.length} videos planned across all subjects
              </p>
            </div>
            <Button onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Calendar Data
            </Button>
          </div>
          
          <ContentCalendarGrid 
            entries={entries} 
            onEntryClick={setSelectedEntry}
          />
        </TabsContent>

        <TabsContent value="available">
          <AvailableVideosTab />
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Videos Pending Review</h3>
            {pendingVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No videos pending review</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingVideos.map((video) => (
                  <VideoReviewCard
                    key={video.id}
                    video={video}
                    onApprove={handleApproveVideo}
                    onReject={handleRejectVideo}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Approved Videos</h3>
            {approvedVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No approved videos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedVideos.map((video) => (
                  <VideoReviewCard
                    key={video.id}
                    video={video}
                    onApprove={handleApproveVideo}
                    onReject={handleRejectVideo}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          <ContentStatistics stats={statistics} />
        </TabsContent>

      </Tabs>

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          fetchCalendarEntries();
          toast({
            title: 'Success',
            description: 'Calendar data imported successfully!',
          });
        }}
      />

      {/* Entry Details Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEntry?.title}</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Hook</h4>
                <p className="text-sm text-muted-foreground">{selectedEntry.hook}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{selectedEntry.summary}</p>
              </div>
              {selectedEntry.talking_points && selectedEntry.talking_points.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Talking Points</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {selectedEntry.talking_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Lighting</h4>
                  <p className="text-xs text-muted-foreground">{selectedEntry.lighting_requirements}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Audio</h4>
                  <p className="text-xs text-muted-foreground">{selectedEntry.audio_requirements}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Quality</h4>
                  <p className="text-xs text-muted-foreground">{selectedEntry.quality_requirements}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Format</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedEntry.video_format} - {selectedEntry.max_duration_seconds}s max
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Assign Tutor</Button>
                <Button variant="outline" className="flex-1">Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentEngine;
