import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const fieldClass =
  'w-full rounded-full border-2 border-foreground bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-pastel-butter/40';

const labelClass = 'mb-1.5 block text-sm font-semibold text-foreground';

export interface EditAdminTarget {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  is_active: boolean;
}

interface EditAdminDialogProps {
  admin: EditAdminTarget | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditAdminDialog: React.FC<EditAdminDialogProps> = ({ admin, onClose, onSaved }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('20:00');
  const [days, setDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!admin) return;

    setFirstName((admin.first_name || '').trim());
    setLastName((admin.last_name || '').trim());
    setJobTitle(admin.job_title || '');
    setIsActive(admin.is_active);
    setDays([]);
    setStartTime('09:00');
    setEndTime('20:00');

    const loadAvailability = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_availability')
        .select('day_of_week, start_time, end_time')
        .eq('admin_id', admin.id);

      if (!error && data && data.length > 0) {
        setDays(data.map((row) => row.day_of_week));
        setStartTime(String(data[0].start_time).slice(0, 5));
        setEndTime(String(data[0].end_time).slice(0, 5));
      }
      setLoading(false);
    };

    loadAvailability();
  }, [admin]);

  const toggleDay = (value: number) => {
    setDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!admin) return;

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: 'Missing details',
        description: 'First and last name are required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          job_title: jobTitle.trim() ? jobTitle.trim() : null,
          is_active: isActive,
        } as never)
        .eq('id', admin.id);

      if (profileError) throw profileError;

      const { error: deleteError } = await supabase
        .from('admin_availability')
        .delete()
        .eq('admin_id', admin.id);

      if (deleteError) throw deleteError;

      if (days.length > 0) {
        const { error: insertError } = await supabase.from('admin_availability').insert(
          days.map((day) => ({
            admin_id: admin.id,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
          }))
        );
        if (insertError) throw insertError;
      }

      toast({
        title: 'Staff member updated',
        description: `${firstName.trim()} ${lastName.trim()}'s details have been saved.`,
      });
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: 'Update failed',
        description: 'Could not save these changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!admin} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[92dvh] overflow-y-auto rounded-[var(--radius-soft)] border-2 border-foreground bg-card p-5 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-extrabold text-foreground">
            Edit Staff Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input
                className={fieldClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Last Name</label>
              <input
                className={fieldClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Job Title</label>
              <input
                className={fieldClass}
                placeholder="e.g. Head of Growth"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start Time</label>
                <input
                  type="time"
                  className={fieldClass}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>End Time</label>
                <input
                  type="time"
                  className={fieldClass}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Available Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const selected = days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        'rounded-full border-2 border-foreground px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5',
                        selected
                          ? 'bg-pastel-mint text-foreground'
                          : 'bg-background text-foreground'
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <div className="flex gap-2">
                {[
                  { label: 'Active', value: true, tone: 'bg-pastel-mint' },
                  { label: 'Inactive', value: false, tone: 'bg-pastel-blush' },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setIsActive(option.value)}
                    className={cn(
                      'rounded-full border-2 border-foreground px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5',
                      isActive === option.value ? option.tone : 'bg-background'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border-2 border-foreground bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sand"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAdminDialog;
