import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  approveReviewRoomBookings,
  type ReviewRoomBookingRow,
} from '@/services/reviewRoomApprovalService';

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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Approve Review Room Sessions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Parent:</span> <strong>{head.parent_name}</strong></div>
              <div><span className="text-muted-foreground">Child:</span> <strong>{head.child_name}</strong></div>
              <div><span className="text-muted-foreground">Email:</span> {head.email}</div>
              <div><span className="text-muted-foreground">Phone:</span> {head.phone || '—'}</div>
            </div>
            {head.message && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                {head.message}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Sessions to approve ({selectedIds.length} of {sortedPending.length})
            </p>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {sortedPending.map((b) => {
                const checked = selectedIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40 transition"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(b.id)}
                    />
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">
                        {b.preferred_date
                          ? format(parseISO(b.preferred_date), 'EEE, MMM d, yyyy')
                          : '—'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {b.preferred_time?.slice(0, 5) || '—'}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                      Pending
                    </Badge>
                  </label>
                );
              })}
              {sortedPending.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No pending sessions for this parent.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-900">
            On approval we'll add {head.child_name} to each selected Review Room lesson on the
            calendar and send <strong>one combined</strong> email + WhatsApp message to the parent
            with the Lessonspace link and a warm welcome.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={submitting || selectedIds.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white"
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
