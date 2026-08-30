import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { resolveDiscountDeadline } from './discountDeadline';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: { id: string; recipient_name: string; created_at: string; discount_deadline?: string | null } | null;
  onExtended: () => void;
}

const toLocalInput = (ms: number) => format(new Date(ms), "yyyy-MM-dd'T'HH:mm");

export default function ExtendOfferDialog({ open, onOpenChange, proposal, onExtended }: Props) {
  const [saving, setSaving] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const currentDeadline = proposal ? resolveDiscountDeadline(proposal) : 0;
  const expired = currentDeadline > 0 && currentDeadline <= Date.now();

  useEffect(() => {
    if (open && proposal) {
      setCustomValue(toLocalInput(Math.max(currentDeadline, Date.now())));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, proposal?.id]);

  const save = async (deadlineMs: number) => {
    if (!proposal) return;
    if (Number.isNaN(deadlineMs)) {
      toast({ title: 'Invalid date', description: 'Please pick a valid date and time.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lesson_proposals')
        .update({ discount_deadline: new Date(deadlineMs).toISOString() } as any)
        .eq('id', proposal.id);

      if (error) throw error;

      toast({
        title: 'Offer extended',
        description: `Discounted rate now runs until ${format(new Date(deadlineMs), 'd MMM yyyy, HH:mm')}.`,
      });
      onExtended();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error extending offer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to extend the offer',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Expired deadlines count forward from now so "+24 hours" always means a full 24 hours.
  const base = () => Math.max(currentDeadline, Date.now());
  const extendBy = (hours: number) => save(base() + hours * 60 * 60 * 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[var(--radius-soft)] border-2 border-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-extrabold">
            Extend discounted rate
          </DialogTitle>
          <DialogDescription>
            {proposal ? `Give ${proposal.recipient_name} more time to claim the discounted rate.` : ''}
          </DialogDescription>
        </DialogHeader>

        {proposal && (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] bg-pastel-sand/60 p-4 text-sm">
              <p className="text-muted-foreground">Current deadline</p>
              <p className="font-semibold text-foreground">
                {format(new Date(currentDeadline), 'd MMM yyyy, HH:mm')}
                {expired && <span className="ml-2 text-destructive">(expired)</span>}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[12, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={saving}
                  onClick={() => extendBy(h)}
                  className="h-11 rounded-full border-2 border-foreground bg-transparent text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
                >
                  +{h} hours
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-deadline">Or set a specific date and time</Label>
              <Input
                id="custom-deadline"
                type="datetime-local"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="h-12 rounded-full border-2 border-foreground bg-transparent px-5"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-11 rounded-full border-2 border-foreground bg-transparent px-5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => save(new Date(customValue).getTime())}
            disabled={saving || !customValue}
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save deadline
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
