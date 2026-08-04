import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { COUNTRY_DIAL_CODES, DEFAULT_DIAL_CODE, normalisePhone, validatePhone } from '@/utils/phone';
import type { NewReferralInput } from '@/hooks/useReferral';

interface ReferralFormProps {
  onSubmit: (input: NewReferralInput) => Promise<{ success: boolean; error?: string }>;
}

export const ReferralForm: React.FC<ReferralFormProps> = ({ onSubmit }) => {
  const [values, setValues] = useState({ name: '', email: '', childName: '', notes: '' });
  const [dial, setDial] = useState(DEFAULT_DIAL_CODE);
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) nextErrors.name = "Please enter your friend's name";
    if (!values.email.trim() && !phone.trim()) {
      nextErrors.email = 'Please add an email or a phone number';
    }
    if (values.email.trim() && !/\S+@\S+\.\S+/.test(values.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (phone.trim()) {
      const check = validatePhone(phone, dial);
      if (!check.valid) nextErrors.phone = check.error!;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const result = await onSubmit({
      friend_name: values.name.trim(),
      friend_email: values.email.trim().toLowerCase() || undefined,
      friend_phone: phone.trim() ? normalisePhone(phone, dial) : undefined,
      child_name: values.childName.trim() || undefined,
      notes: values.notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSent(true);
      setValues({ name: '', email: '', childName: '', notes: '' });
      setPhone('');
      setTimeout(() => setSent(false), 5000);
    } else {
      setErrors({ form: result.error || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Or send us their details</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Give us their details and our team will reach out to arrange a free trial lesson.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ref-name">Parent's name</Label>
            <Input id="ref-name" value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="Their full name" />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref-email">Email</Label>
            <Input
              id="ref-email"
              type="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="their@email.com"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref-phone">Phone number</Label>
            <div className="flex gap-2">
              <Select value={dial} onValueChange={setDial}>
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {COUNTRY_DIAL_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.dial}>
                      {c.dial} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="ref-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="7700 900123"
              />
            </div>
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref-child">Child's name and year group (optional)</Label>
            <Input
              id="ref-child"
              value={values.childName}
              onChange={(e) => set('childName', e.target.value)}
              placeholder="e.g. Sara, Year 10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref-notes">Anything we should know? (optional)</Label>
            <Textarea
              id="ref-notes"
              value={values.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Subjects they need help with, best time to call…"
              rows={3}
            />
          </div>

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
          {sent && <p className="text-sm text-primary">Thank you. We will be in touch with them shortly.</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send referral
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReferralForm;
