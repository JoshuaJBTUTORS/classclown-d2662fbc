import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  approveReviewRoomBookings,
  type ReviewRoomBookingRow,
} from '@/services/reviewRoomApprovalService';
import {
  DoodleCalendar,
  DoodleCheck,
  DoodleClock,
  DoodleSparkle,
} from '@/components/calendar/LessonDoodles';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookings: ReviewRoomBookingRow[]; // all rows for the same parent group
  onComplete: () => void;
}

const ReviewRoomApprovalDialog: React.FC<Props> = ({ isOpen, onClose, bookings, onComplete }) => {
  const head = bookings[0];

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'pending'),
    [bookings],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    pendingBookings.map((b) => b.id),
  );
  const [submitting, setSubmitting] = useState(false);

  // Re-sync defaults if the bookings list changes between opens
  React.useEffect(() => {
    setSelectedIds(pendingBookings.map((b) => b.id));
  }, [pendingBookings]);

  if (!head) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one session to approve');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = await approveReviewRoomBookings({
        bookings: pendingBookings,
        selectedIds,
        approvedBy: user?.id,
      });

      if (result.approvedCount === 0) {
        toast.error(result.error || 'No sessions could be approved');
      } else {
        toast.success(
          `Approved ${result.approvedCount} session${result.approvedCount === 1 ? '' : 's'} — parent notified by email & WhatsApp`,
        );
        if (result.skipped.length > 0) {
          toast.warning(`${result.skipped.length} session(s) skipped — see console for details`);
          console.warn('Skipped sessions:', result.skipped);
        }
        onComplete();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const sortedPending = [...pendingBookings].sort((a, b) =>
    `${a.preferred_date}${a.preferred_time}`.localeCompare(
      `${b.preferred_date}${b.preferred_time}`,
    ),
  );

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="cc-dialog max-h-[92dvh] overflow-y-auto rounded-[var(--radius-soft)] border-2 border-foreground/10 p-6 sm:max-w-[600px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/10 bg-pastel-lilac text-pastel-lilac-foreground">
            <DoodleSparkle className="h-8 w-8" />
          </span>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
              Approve Review Room Sessions
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-[1.25rem] bg-pastel-sand/50 p-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent</p>
                <p className="mt-1 font-semibold text-foreground">{head.parent_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Child</p>
                <p className="mt-1 font-semibold text-foreground">{head.child_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 break-all text-foreground">{head.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-1 text-foreground">{head.phone || '—'}</p>
              </div>
            </div>
            {head.message && (
              <div className="mt-3 border-t border-foreground/10 pt-3 text-xs text-muted-foreground">
                {head.message}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                Sessions to approve
              </p>
              <span className="inline-flex items-center rounded-full bg-pastel-butter px-3 py-1 text-xs font-semibold text-pastel-butter-foreground">
                {selectedIds.length} of {sortedPending.length}
              </span>
            </div>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {sortedPending.map((booking) => {
                const checked = selectedIds.includes(booking.id);
                return (
                  <label
                    key={booking.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-[1.25rem] p-3 transition-all duration-200',
                      checked
                        ? 'bg-pastel-mint/70 shadow-[var(--shadow-soft)]'
                        : 'bg-pastel-sand/50 hover:bg-pastel-sky/60',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(booking.id)}
                      className="border-foreground"
                    />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/70 text-foreground">
                      <DoodleCalendar className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="font-semibold text-foreground">
                        {booking.preferred_date
                          ? format(parseISO(booking.preferred_date), 'EEE, MMM d, yyyy')
                          : '—'}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DoodleClock className="h-3.5 w-3.5" />
                        {booking.preferred_time?.slice(0, 5) || '—'}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-pastel-butter px-3 py-1 text-xs font-semibold text-pastel-butter-foreground">
                      Pending
                    </span>
                  </label>
                );
              })}
              {sortedPending.length === 0 && (
                <div className="rounded-[1.25rem] bg-pastel-sand/60 px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No pending sessions for this parent.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.25rem] bg-pastel-sky/60 p-4 text-sm text-pastel-sky-foreground">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/60">
                <DoodleCheck className="h-4 w-4" />
              </span>
              <p>
                On approval we'll add {head.child_name} to each selected Review Room lesson on the
                calendar and send <strong>one combined</strong> email + WhatsApp message to the parent
                with the Lessonspace link and a warm welcome.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border-2 border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={submitting || selectedIds.length === 0}
            className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve & Notify Parent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewRoomApprovalDialog;