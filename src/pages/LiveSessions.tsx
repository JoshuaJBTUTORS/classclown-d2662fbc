import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, RefreshCw, LogIn, LogOut, Play, Square, GraduationCap, User } from 'lucide-react';
import { format } from 'date-fns';

interface ParticipantEvent {
  id: string;
  lesson_id: string | null;
  room_id: string | null;
  session_id: string | null;
  event_type: string;
  participant_external_id: string | null;
  participant_name: string | null;
  participant_role: string | null;
  is_leader: boolean | null;
  occurred_at: string;
}

interface LessonInfo {
  id: string;
  title: string | null;
  start_time: string | null;
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
  const [events, setEvents] = useState<ParticipantEvent[]>([]);
  const [lessons, setLessons] = useState<Record<string, LessonInfo>>({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('lesson_participant_events')
      .select('id, lesson_id, room_id, session_id, event_type, participant_external_id, participant_name, participant_role, is_leader, occurred_at')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(300);

    const rows = (data || []) as ParticipantEvent[];
    setEvents(rows);

    const lessonIds = Array.from(new Set(rows.map(r => r.lesson_id).filter(Boolean))) as string[];
    if (lessonIds.length) {
      const { data: lessonRows } = await supabase
        .from('lessons')
        .select('id, title, start_time')
        .in('id', lessonIds);
      const map: Record<string, LessonInfo> = {};
      (lessonRows || []).forEach((l: any) => { map[l.id] = l; });
      setLessons(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();

    const channel = supabase
      .channel('live-participant-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lesson_participant_events' },
        (payload) => {
          setEvents(prev => [payload.new as ParticipantEvent, ...prev].slice(0, 300));
        }
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Derive who is currently in a room (joined without a later leave), per session/room
  const liveRooms = useMemo(() => {
    const ordered = [...events].sort(
      (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
    );
    const rooms: Record<string, {
      key: string;
      lessonId: string | null;
      roomId: string | null;
      ended: boolean;
      lastActivity: string;
      participants: Record<string, ParticipantEvent>;
    }> = {};

    ordered.forEach(ev => {
      const key = ev.room_id || ev.session_id || ev.lesson_id || 'unknown';
      if (!rooms[key]) {
        rooms[key] = { key, lessonId: ev.lesson_id, roomId: ev.room_id, ended: false, lastActivity: ev.occurred_at, participants: {} };
      }
      const room = rooms[key];
      room.lastActivity = ev.occurred_at;
      if (ev.lesson_id) room.lessonId = ev.lesson_id;

      if (ev.event_type === 'session.start') room.ended = false;
      if (ev.event_type === 'session.end') { room.ended = true; room.participants = {}; }
      if (ev.event_type === 'user.joined') {
        const pk = ev.participant_external_id || ev.participant_name || ev.id;
        room.participants[pk] = ev;
      }
      if (ev.event_type === 'user.left') {
        const pk = ev.participant_external_id || ev.participant_name || ev.id;
        delete room.participants[pk];
      }
    });

    return Object.values(rooms)
      .filter(r => !r.ended && Object.keys(r.participants).length > 0)
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [events]);

  const joinedCount = events.filter(e => e.event_type === 'user.joined').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Live Lesson Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Real time joins and leaves from LessonSpace rooms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
            {connected ? 'Live' : 'Connecting'}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rooms with people in now</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{liveRooms.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">People in rooms</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">
            {liveRooms.reduce((sum, r) => sum + Object.keys(r.participants).length, 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Joins in last 24h</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{joinedCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>In a room right now</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {liveRooms.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nobody is in a lesson room at the moment. Joins appear here the instant they happen.
            </p>
          )}
          {liveRooms.map(room => {
            const lesson = room.lessonId ? lessons[room.lessonId] : null;
            const people = Object.values(room.participants);
            return (
              <div key={room.key} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold">{lesson?.title || 'Unmatched room'}</p>
                    <p className="text-xs text-muted-foreground">
                      {lesson?.start_time ? format(new Date(lesson.start_time), 'EEE d MMM, HH:mm') : room.roomId || room.key}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{people.length} in room</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {people.map(p => {
                    const isTutor = p.participant_role === 'teacher' || p.is_leader;
                    const Icon = isTutor ? GraduationCap : User;
                    return (
                      <span
                        key={p.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${isTutor ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {p.participant_name || p.participant_external_id || 'Unknown'}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(p.occurred_at), 'HH:mm')}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activity feed (last 24 hours)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          )}
          {events.map(ev => {
            const meta = eventMeta(ev.event_type);
            const Icon = meta.icon;
            const lesson = ev.lesson_id ? lessons[ev.lesson_id] : null;
            return (
              <div key={ev.id} className="flex items-center gap-3 border-b last:border-b-0 py-2">
                <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </Badge>
                <span className="text-sm font-medium">
                  {ev.participant_name || ev.participant_external_id || '—'}
                </span>
                {ev.participant_role && (
                  <span className="text-xs text-muted-foreground capitalize">{ev.participant_role}</span>
                )}
                <span className="text-sm text-muted-foreground truncate">
                  {lesson?.title || ev.room_id || ''}
                </span>
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
