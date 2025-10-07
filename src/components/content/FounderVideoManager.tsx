import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Video, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';

interface FounderVideo {
  id: string;
  topic: string;
  script?: string;
  week_number: number;
  year: number;
  status: string;
  video_url?: string;
  due_date?: string;
  uploaded_at?: string;
  download_count: number;
}

const FounderVideoManager = () => {
  const [videos, setVideos] = useState<FounderVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVideo, setNewVideo] = useState({
    topic: '',
    script: '',
    week_number: 1,
    year: new Date().getFullYear(),
    due_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFounderVideos();
  }, []);

  const fetchFounderVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('founder_videos')
        .select('*')
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    try {
      const { error } = await supabase.from('founder_videos').insert([
        {
          topic: newVideo.topic,
          script: newVideo.script,
          week_number: newVideo.week_number,
          year: newVideo.year,
          due_date: newVideo.due_date || null,
          status: 'planned',
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Founder video added successfully',
      });

      setShowAddDialog(false);
      setNewVideo({
        topic: '',
        script: '',
        week_number: 1,
        year: new Date().getFullYear(),
        due_date: '',
      });
      fetchFounderVideos();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Founder Videos</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card key={video.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{video.topic}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Week {video.week_number}, {video.year}
                  </p>
                </div>
                <Video className="h-4 w-4 text-muted-foreground" />
              </div>

              {video.script && (
                <p className="text-sm text-muted-foreground line-clamp-3">{video.script}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{video.status}</span>
                {video.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(video.due_date), 'MMM dd')}
                  </span>
                )}
              </div>

              {video.video_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(video.video_url, '_blank')}
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download ({video.download_count})
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Video Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Founder Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={newVideo.topic}
                onChange={(e) => setNewVideo({ ...newVideo, topic: e.target.value })}
                placeholder="Video topic"
              />
            </div>

            <div>
              <Label htmlFor="script">Script</Label>
              <Textarea
                id="script"
                value={newVideo.script}
                onChange={(e) => setNewVideo({ ...newVideo, script: e.target.value })}
                placeholder="Video script or notes"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="week">Week Number</Label>
                <Input
                  id="week"
                  type="number"
                  min="1"
                  max="52"
                  value={newVideo.week_number}
                  onChange={(e) =>
                    setNewVideo({ ...newVideo, week_number: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={newVideo.year}
                  onChange={(e) => setNewVideo({ ...newVideo, year: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={newVideo.due_date}
                onChange={(e) => setNewVideo({ ...newVideo, due_date: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleAddVideo} disabled={!newVideo.topic}>
                Add Video
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FounderVideoManager;
