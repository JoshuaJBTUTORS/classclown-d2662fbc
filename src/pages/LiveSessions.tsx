import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, RefreshCw, LogIn, LogOut, Play, Square, GraduationCap, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface LiveStint {
  joinedAt: string;
  leftAt: string | null;
  active: boolean;
  durationMinutes: number;
}

interface LiveParticipant {
  id: string;
  name: string;
  role: string | null;
  isLeader: boolean;
  joinedAt: string | null;
  lastJoinedAt?: string | null;
  rejoinCount?: number;
  stints?: LiveStint[];
  totalMinutes?: number;
}

interface LiveLesson {
  id: string;
  title: string | null;
  subject: string | null;
  start_time: string;
  end_time: string;
  lesson_space_room_id: string | null;
  sessionId: string | null;
  sessionStart: string | null;
  sessionActive: boolean;
  participants: LiveParticipant[];
  error?: string;
}

interface PunctualityRow {
  id: string;
  lesson_id: string;
  tutor_name: string | null;
  lesson_start: string;
  tutor_first_join_at: string | null;
  minutes_late: number | null;
  status: string;
  alert_sent_at: string | null;
}

interface ParticipantEvent {
  id: string;
  lesson_id: string | null;
  room_id: string | null;
  event_type: string;
  participant_name: string | null;
  participant_role: string | null;
  occurred_at: string;
}

const eventMeta = (type: string) => {
  switch (type) {
    case 'user.joined':
      return { label: 'Joined', icon: LogIn, className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'user.left':
      return { label: 'Left', icon: LogOut, className: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'session.start':
      return { label: 'Session started', icon: Play, className: 'bg-sky-100 text-sky-800 border-sky-200' };
    case 'session.end':
      return { label: 'Session ended', icon: Square, className: 'bg-muted text-muted-foreground border-border' };
    default:
      return { label: type, icon: Radio, className: 'bg-muted text-muted-foreground border-border' };
  }
};

const LiveSessions: React.FC = () => {
  const [lessons, setLessons] = useState<LiveLesson[]>([]);
  const [events, setEvents] = useState<ParticipantEvent[]>([]);
  const [punctuality, setPunctuality] = useState<PunctualityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLive = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('lessonspace-live-participants', { body: {} });
    if (error) {
      setLoadError(error.message);
    } else {
      setLoadError(null);
      setLessons((data?.lessons || []) as LiveLesson[]);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  const loadEvents = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('lesson_participant_events')
      .select('id, lesson_id, room_id, event_type, participant_name, participant_role, occurred_at')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(100);
    setEvents((data || []) as ParticipantEvent[]);
  }, []);

  const loadPunctuality = useCallback(async () => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('tutor_punctuality')
      .select('id, lesson_id, tutor_name, lesson_start, tutor_first_join_at, minutes_late, status, alert_sent_at')
      .gte('lesson_start', since.toISOString())
      .order('lesson_start', { ascending: false });
    setPunctuality((data || []) as PunctualityRow[]);
  }, []);

  useEffect(() => {
    loadLive();
    loadEvents();
    loadPunctuality();
    const interval = setInterval(() => {
      loadLive();
      loadEvents();
      loadPunctuality();
    }, 20000);

    const channel = supabase
      .channel('live-participant-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lesson_participant_events' },
        (payload) => {
          setEvents(prev => [payload.new as ParticipantEvent, ...prev].slice(0, 100));
          loadLive();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [loadLive, loadEvents, loadPunctuality]);

  const activeLessons = lessons.filter(l => l.participants.length > 0);
  const idleLessons = lessons.filter(l => l.participants.length === 0);
  const totalPeople = activeLessons.reduce((s, l) => s + l.participants.length, 0);
  const tutorsIn = activeLessons.reduce((s, l) => s + l.participants.filter(p => p.isLeader).length, 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Live Lesson Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Who is inside LessonSpace rooms right now
            {lastUpdated && ` · updated ${format(lastUpdated, 'HH:mm:ss')}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto refreshing
          </Badge>
          <Button variant="outline" size="sm" onClick={() => { loadLive(); loadEvents(); loadPunctuality(); }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {loadError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="h-4 w-4" />
          Could not reach LessonSpace: {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lessons in progress</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{activeLessons.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">People in rooms</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{totalPeople}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tutors in rooms</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{tutorsIn}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>In a room right now</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {activeLessons.length === 0 && (
            <p className="text-sm text-muted-foreground">Nobody is in a lesson room at the moment.</p>
          )}
          {activeLessons.map(lesson => (
            <div key={lesson.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold">{lesson.title || lesson.subject || 'Lesson'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(lesson.start_time), 'HH:mm')} to {format(new Date(lesson.end_time), 'HH:mm')}
                    {lesson.sessionStart && ` · started ${format(new Date(lesson.sessionStart), 'HH:mm')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.participants.some(p => p.isLeader) ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Tutor present</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">No tutor yet</Badge>
                  )}
                  <Badge variant="outline">{lesson.participants.length} in room</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.participants.flatMap(p => {
                  const Icon = p.isLeader ? GraduationCap : User;
                  const stints = p.stints?.length
                    ? p.stints
                    : [{ joinedAt: p.joinedAt ?? '', leftAt: null, active: true, durationMinutes: 0 }];
                  return stints.map((s, i) => (
                    <span
                      key={`${p.id}-${i}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${p.isLeader ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'} ${s.active ? '' : 'opacity-70'}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {p.name}
                      {s.joinedAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(s.joinedAt), 'HH:mm')}
                          {s.leftAt ? ` to ${format(new Date(s.leftAt), 'HH:mm')}` : ' to now'}
                          {` · ${s.durationMinutes} min`}
                        </span>
                      )}
                    </span>
                  ));
                })}
              </div>

            </div>
          ))}
        </CardContent>
      </Card>

      {idleLessons.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Scheduled now, nobody joined</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {idleLessons.map(lesson => (
              <div key={lesson.id} className="flex items-center justify-between border-b last:border-b-0 py-2">
                <span className="text-sm font-medium">{lesson.title || lesson.subject || 'Lesson'}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(lesson.start_time), 'HH:mm')} to {format(new Date(lesson.end_time), 'HH:mm')}
                  {lesson.error ? ` · ${lesson.error}` : ''}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tutor punctuality today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {punctuality.length === 0 && (
            <p className="text-sm text-muted-foreground">No lessons tracked yet today.</p>
          )}
          {punctuality.map(row => {
            const badge =
              row.status === 'on_time'
                ? { label: 'On time', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
                : row.status === 'late'
                ? { label: `Late by ${row.minutes_late} min`, className: 'bg-amber-100 text-amber-800 border-amber-200' }
                : row.status === 'no_show'
                ? { label: 'Tutor not joined', className: 'bg-destructive/10 text-destructive border-destructive/20' }
                : row.status === 'no_students_expected'
                ? { label: 'No students expected', className: 'bg-muted text-muted-foreground border-border' }
                : { label: 'Waiting', className: 'bg-muted text-muted-foreground border-border' };
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-3 border-b last:border-b-0 py-2">
                <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                <span className="text-sm font-medium">{row.tutor_name || 'Unassigned tutor'}</span>
                <span className="text-xs text-muted-foreground">
                  start {format(new Date(row.lesson_start), 'HH:mm')}
                  {row.tutor_first_join_at && ` · joined ${format(new Date(row.tutor_first_join_at), 'HH:mm')}`}
                </span>
                {row.alert_sent_at && (
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    alert sent {format(new Date(row.alert_sent_at), 'HH:mm')}
                  </span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>


      <Card>
        <CardHeader><CardTitle>Webhook activity feed (last 24 hours)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">No webhook events recorded yet.</p>
          )}
          {events.map(ev => {
            const meta = eventMeta(ev.event_type);
            const Icon = meta.icon;
            return (
              <div key={ev.id} className="flex items-center gap-3 border-b last:border-b-0 py-2">
                <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </Badge>
                <span className="text-sm font-medium">{ev.participant_name || '—'}</span>
                {ev.participant_role && (
                  <span className="text-xs text-muted-foreground capitalize">{ev.participant_role}</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {format(new Date(ev.occurred_at), 'HH:mm:ss')}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveSessions;
