import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import SessionPicker, { SelectedSession, REVIEW_ROOM_DAYS } from '@/components/reviewRoom/SessionPicker';
import { createReviewRoomBookings } from '@/services/trialBookingService';

type Step = 'sessions' | 'contact';

const ReviewRoom = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('sessions');
  const [selected, setSelected] = useState<SelectedSession[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [contact, setContact] = useState({
    parent_name: '',
    child_name: '',
    email: '',
    phone: '',
  });

  const toggleSession = (session: SelectedSession) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.date === session.date && s.time === session.time);
      if (exists) return prev.filter((s) => !(s.date === session.date && s.time === session.time));
      return [...prev, session];
    });
  };

  const handleProceed = () => {
    if (selected.length === 0) {
      toast.error('Please select at least one session');
      return;
    }
    setStep('contact');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.parent_name || !contact.child_name || !contact.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReviewRoomBookings({
        sessions: selected,
        contact,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create bookings');
      }

      toast.success(`${selected.length} session${selected.length > 1 ? 's' : ''} booked successfully!`);
      navigate('/trial-booking-confirmation');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Sort selection by date+time for display
  const sortedSelection = [...selected].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">The Review Room</h1>
          <p className="mt-2 text-muted-foreground">
            Free GCSE revision sessions across four weekend dates. Pick any combination.
          </p>
        </div>

        {step === 'sessions' && (
          <Card>
            <CardHeader>
              <CardTitle>Select your sessions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tick any sessions you'd like to attend across the {REVIEW_ROOM_DAYS.length} dates.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <SessionPicker selected={selected} onToggle={toggleSession} />

              <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between border-t bg-background/95 px-6 py-4 backdrop-blur">
                <p className="text-sm">
                  <span className="font-semibold">{selected.length}</span>{' '}
                  session{selected.length === 1 ? '' : 's'} selected
                </p>
                <Button onClick={handleProceed} disabled={selected.length === 0}>
                  Continue <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'contact' && (
          <Card>
            <CardHeader>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 w-fit -ml-2"
                onClick={() => setStep('sessions')}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to sessions
              </Button>
              <CardTitle>Your contact details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg border bg-muted/40 p-4">
                <p className="mb-3 text-sm font-medium">Selected sessions ({selected.length})</p>
                <ul className="space-y-1.5 text-sm">
                  {sortedSelection.map((s) => (
                    <li key={`${s.date}-${s.time}`} className="flex items-center gap-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{format(parseISO(s.date), 'EEE do MMM')}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{s.time}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{s.subject}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parent_name">Parent name *</Label>
                    <Input
                      id="parent_name"
                      required
                      value={contact.parent_name}
                      onChange={(e) => setContact({ ...contact, parent_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child_name">Child name *</Label>
                    <Input
                      id="child_name"
                      required
                      value={contact.child_name}
                      onChange={(e) => setContact({ ...contact, child_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (recommended for WhatsApp updates)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting} size="lg">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...
                    </>
                  ) : (
                    <>Confirm {selected.length} session{selected.length > 1 ? 's' : ''}</>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Your video lesson link will be sent to you shortly before the session.
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewRoom;
