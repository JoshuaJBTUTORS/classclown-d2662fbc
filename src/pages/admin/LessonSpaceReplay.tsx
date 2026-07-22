import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LessonSpaceReplay() {
  const [sessionId, setSessionId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from('lesson_transcriptions')
      .select('session_id, lesson_id, transcription_status, created_at, lessons:lesson_id(title, start_time)')
      .eq('transcription_status', 'completed')
      .not('session_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCandidates(data ?? []);
  };

  const runReplay = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, string> = {};
      if (sessionId.trim()) body.session_id = sessionId.trim();
      else if (lessonId.trim()) body.lesson_id = lessonId.trim();
      else {
        toast.error('Provide a session id or a lesson id');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('lessonspace-replay-session', { body });
      if (error) {
        toast.error(error.message);
        setResult({ error: error.message });
      } else {
        setResult(data);
        toast.success('Replay complete');
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LessonSpace Webhook Replay</h1>
        <p className="text-sm text-muted-foreground">
          Run a known-good past LessonSpace session through the transcript/recording pipeline
          to verify storage without waiting for a live session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Replay a session</CardTitle>
          <CardDescription>Provide either a LessonSpace session id or one of our lesson ids.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sid">LessonSpace session id</Label>
            <Input id="sid" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="e.g. 6f2a…" />
          </div>
          <div className="text-center text-xs text-muted-foreground">or</div>
          <div className="space-y-2">
            <Label htmlFor="lid">Our lesson id</Label>
            <Input id="lid" value={lessonId} onChange={(e) => setLessonId(e.target.value)} placeholder="uuid" />
          </div>
          <Button onClick={runReplay} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Replaying…</> : 'Replay session through webhook'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Known-good candidates</CardTitle>
            <CardDescription>Recent lessons with a stored session id and transcript.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadCandidates}>Load</Button>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Click Load to fetch candidates.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {candidates.map((l) => (
                <li key={l.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{l.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.start_time).toLocaleString()} · session {l.lesson_space_session_id}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setSessionId(l.lesson_space_session_id); setLessonId(''); }}>
                    Use
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-[500px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
