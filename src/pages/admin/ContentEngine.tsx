import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentCalendar } from '@/types/content';
import ContentCalendarGrid from '@/components/content/ContentCalendarGrid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const ContentEngine = () => {
  const [entries, setEntries] = useState<ContentCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ContentCalendar | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarEntries();
  }, []);

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
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
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
      <ContentCalendarGrid 
        entries={entries} 
        onEntryClick={setSelectedEntry}
      />

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
