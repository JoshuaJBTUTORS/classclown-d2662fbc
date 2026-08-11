import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddReferralDialogProps {
  onCreated?: () => void;
}

const SOURCES = [
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In person' },
  { value: 'manual', label: 'Other / manual' },
];

const emptyForm = {
  referrer_name: '',
  referrer_email: '',
  referrer_phone: '',
  friend_name: '',
  friend_email: '',
  friend_phone: '',
  child_name: '',
  notes: '',
  source: 'phone',
};

const AddReferralDialog: React.FC<AddReferralDialogProps> = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = (key: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.referrer_name.trim()) {
      toast.error("Please enter the referrer's name");
      return;
    }
    if (!form.friend_name.trim()) {
      toast.error("Please enter the friend's name");
      return;
    }
    if (!form.friend_email.trim() && !form.friend_phone.trim()) {
      toast.error("Add the friend's email or phone number");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('referrals').insert({
      referrer_name: form.referrer_name.trim(),
      referrer_email: form.referrer_email.trim().toLowerCase() || null,
      referrer_phone: form.referrer_phone.trim() || null,
      friend_name: form.friend_name.trim(),
      friend_email: form.friend_email.trim().toLowerCase() || null,
      friend_phone: form.friend_phone.trim() || null,
      child_name: form.child_name.trim() || null,
      notes: form.notes.trim() || null,
      source: form.source,
      status: 'invited',
    });
    setSaving(false);

    if (error) {
      console.error('Failed to add referral:', error);
      toast.error('Could not save the referral');
      return;
    }

    toast.success('Referral added');
    setForm(emptyForm);
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add referral
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a referral</DialogTitle>
          <DialogDescription>
            Log a referral that came in by phone, WhatsApp or any other channel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">How did it come in?</Label>
            <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}>
              <SelectTrigger id="source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referrer_name">Referrer name *</Label>
            <Input id="referrer_name" value={form.referrer_name} onChange={set('referrer_name')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="referrer_email">Referrer email</Label>
              <Input id="referrer_email" type="email" value={form.referrer_email} onChange={set('referrer_email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referrer_phone">Referrer phone</Label>
              <Input id="referrer_phone" value={form.referrer_phone} onChange={set('referrer_phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="friend_name">Friend's name *</Label>
            <Input id="friend_name" value={form.friend_name} onChange={set('friend_name')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="friend_email">Friend's email</Label>
              <Input id="friend_email" type="email" value={form.friend_email} onChange={set('friend_email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="friend_phone">Friend's phone</Label>
              <Input id="friend_phone" value={form.friend_phone} onChange={set('friend_phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="child_name">Child's name</Label>
            <Input id="child_name" value={form.child_name} onChange={set('child_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save referral
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddReferralDialog;
