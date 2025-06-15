
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, CheckCircle, Clock, SkipForward } from 'lucide-react';
import { revisionCalendarService } from '@/services/revisionCalendarService';
import { RevisionSession } from '@/types/revision';

const RevisionCalendar: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<RevisionSession | null>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  // Fetch revision sessions
  const { data: sessions, refetch } = useQuery({
    queryKey: ['revision-sessions'],
    queryFn: () => revisionCalendarService.getRevisionSessions(),
  });

  // Convert sessions to FullCalendar events
  const calendarEvents = React.useMemo(() => {
    if (!sessions) return [];
    
    return sessions.map(session => ({
      id: session.id,
      title: `${session.subject} Revision`,
      start: `${session.session_date}T${session.start_time}`,
      end: `${session.session_date}T${session.end_time}`,
      backgroundColor: getSessionColor(session.status),
      borderColor: getSessionColor(session.status),
      extendedProps: {
        session
      }
    }));
  }, [sessions]);

  const getSessionColor = (status: RevisionSession['status']) => {
    switch (status) {
      case 'completed':
        return '#22c55e'; // green
      case 'skipped':
        return '#f59e0b'; // amber
      case 'rescheduled':
        return '#3b82f6'; // blue
      default:
        return '#6366f1'; // indigo
    }
  };

  const handleEventClick = (eventInfo: any) => {
    const session = eventInfo.event.extendedProps.session;
    setSelectedSession(session);
    setIsSessionDialogOpen(true);
    setCompletionNotes('');
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;
    
    try {
      await revisionCalendarService.updateSessionStatus(
        selectedSession.id,
        'completed',
        completionNotes
      );
      refetch();
      setIsSessionDialogOpen(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleSkipSession = async () => {
    if (!selectedSession) return;
    
    try {
      await revisionCalendarService.updateSessionStatus(selectedSession.id, 'skipped');
      refetch();
      setIsSessionDialogOpen(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Failed to skip session:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Revision Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>Skipped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Rescheduled</span>
            </div>
          </div>
          
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView="timeGridWeek"
            events={calendarEvents}
            eventClick={handleEventClick}
            height="600px"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revision Session</DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Subject:</span>
                  <Badge variant="outline">{selectedSession.subject}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{new Date(selectedSession.session_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Time:</span>
                  <span>{selectedSession.start_time} - {selectedSession.end_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Duration:</span>
                  <span>{selectedSession.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={selectedSession.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedSession.status}
                  </Badge>
                </div>
              </div>

              {selectedSession.status === 'scheduled' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Completion Notes (Optional)</label>
                    <Textarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="What did you study? How did it go?"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCompleteSession}
                      className="flex-1"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                    <Button 
                      onClick={handleSkipSession}
                      variant="outline"
                      size="sm"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                  </div>
                </div>
              )}

              {selectedSession.completion_notes && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">Notes:</p>
                  <p className="text-sm text-green-700">{selectedSession.completion_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RevisionCalendar;
