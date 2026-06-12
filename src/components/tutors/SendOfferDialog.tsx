import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SendOfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
  tutorId?: string;
}

export default function SendOfferDialog({ isOpen, onClose, defaultName, defaultEmail, tutorId }: SendOfferDialogProps) {
  const [recipientName, setRecipientName] = useState(defaultName || '');
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail || '');
  const [position, setPosition] = useState('Tutor');
  const [hourlyRate, setHourlyRate] = useState('11.20');
  const [startDate, setStartDate] = useState('');
  const [minHoursPerWeek, setMinHoursPerWeek] = useState('15');
  const [customIntro, setCustomIntro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async () => {
    if (!recipientName.trim() || !recipientEmail.trim() || !hourlyRate || !startDate) {
      toast({ title: 'Missing fields', description: 'Name, email, hourly rate and start date are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-tutor-offer', {
        body: {
          recipientName,
          recipientEmail,
          position,
          hourlyRate: parseFloat(hourlyRate),
          startDate,
          minHoursPerWeek: parseInt(minHoursPerWeek, 10),
          customIntro: customIntro || undefined,
          tutorId: tutorId || undefined,
        },
      });
      if (error) throw error;
      toast({ title: 'Offer sent!', description: `Email sent to ${recipientEmail}` });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Failed to send offer', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Offer Letter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Recipient name</Label>
            <Input id="name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Recipient email</Label>
            <Input id="email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="rate">Hourly rate (£)</Label>
              <Input id="rate" type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Start date</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hours">Min hours/week</Label>
              <Input id="hours" type="number" value={minHoursPerWeek} onChange={(e) => setMinHoursPerWeek(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="intro">Custom intro (optional)</Label>
            <Textarea id="intro" rows={3} value={customIntro} onChange={(e) => setCustomIntro(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSend} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
