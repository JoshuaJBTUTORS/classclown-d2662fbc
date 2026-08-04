import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { COUNTRY_DIAL_CODES, DEFAULT_DIAL_CODE, normalisePhone, validatePhone } from '@/utils/phone';
import type { NewReferralInput } from '@/hooks/useReferral';

interface ReferralFormProps {
  onSubmit: (input: NewReferralInput) => Promise<{ success: boolean; error?: string }>;
  mode?: 'authenticated' | 'public';
  initialReferrer?: { name: string; email: string };
}

export const ReferralForm: React.FC<ReferralFormProps> = ({ onSubmit, mode = 'authenticated', initialReferrer }) => {
  const isPublic = mode === 'public';
  const [values, setValues] = useState({ name: '', email: '', childName: '', notes: '' });
  const [me, setMe] = useState({ name: initialReferrer?.name ?? '', email: initialReferrer?.email ?? '' });
  const [myDial, setMyDial] = useState(DEFAULT_DIAL_CODE);
  const [myPhone, setMyPhone] = useState('');
  const [dial, setDial] = useState(DEFAULT_DIAL_CODE);
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (initialReferrer) {
      setMe({ name: initialReferrer.name, email: initialReferrer.email });
    }
  }, [initialReferrer?.name, initialReferrer?.email]);

  const set = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (isPublic) {
      if (!me.name.trim()) nextErrors.myName = 'Please enter your name';
      if (!me.email.trim() && !myPhone.trim()) {
        nextErrors.myEmail = 'Please add your email or phone number';
      }
      if (me.email.trim() && !/\S+@\S+\.\S+/.test(me.email)) {
        nextErrors.myEmail = 'Please enter a valid email address';
      }
      if (myPhone.trim()) {
        const check = validatePhone(myPhone, myDial);
        if (!check.valid) nextErrors.myPhone = check.error!;
      }
    }

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
      ...(isPublic
        ? {
            referrer_name: me.name.trim(),
            referrer_email: me.email.trim().toLowerCase() || undefined,
            referrer_phone: myPhone.trim() ? normalisePhone(myPhone, myDial) : undefined,
          }
        : {}),
    });
    setIsSubmitting(false);

    if (result.success) {
      setSent(true);
      setValues({ name: '', email: '', childName: '', notes: '' });
      setPhone('');
      setMe({ name: initialReferrer?.name ?? '', email: initialReferrer?.email ?? '' });
      setMyPhone('');
      setTimeout(() => setSent(false), 5000);
    } else {
      setErrors({ form: result.error || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{isPublic ? 'Refer a friend' : 'Or send us their details'}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Give us their details and our team will reach out to arrange a free trial lesson.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isPublic && (
            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold">Your details</p>

              <div className="space-y-2">
                <Label htmlFor="me-name">Your name</Label>
                <Input
                  id="me-name"
                  value={me.name}
                  onChange={(e) => {
                    setMe((prev) => ({ ...prev, name: e.target.value }));
                    setErrors((prev) => ({ ...prev, myName: '' }));
                  }}
                  placeholder="Your full name"
                />
                {errors.myName && <p className="text-sm text-destructive">{errors.myName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="me-email">Your email</Label>
                <Input
                  id="me-email"
                  type="email"
                  value={me.email}
                  onChange={(e) => {
                    setMe((prev) => ({ ...prev, email: e.target.value }));
                    setErrors((prev) => ({ ...prev, myEmail: '' }));
                  }}
                  placeholder="you@email.com"
                />
                {errors.myEmail && <p className="text-sm text-destructive">{errors.myEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="me-phone">Your phone number</Label>
                <div className="flex gap-2">
                  <Select value={myDial} onValueChange={setMyDial}>
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
                    id="me-phone"
                    type="tel"
                    value={myPhone}
                    onChange={(e) => {
                      setMyPhone(e.target.value);
                      setErrors((prev) => ({ ...prev, myPhone: '' }));
                    }}
                    placeholder="7700 900123"
                  />
                </div>
                {errors.myPhone && <p className="text-sm text-destructive">{errors.myPhone}</p>}
              </div>
            </div>
          )}

          {isPublic && <p className="text-sm font-semibold">Your friend's details</p>}

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
          {sent && (
            <div className="space-y-1">
              <p className="text-sm text-primary">Thank you. We will be in touch with them shortly.</p>
              {isPublic && (
                <p className="text-sm text-muted-foreground">
                  <a href="/auth" className="underline">Log in</a> to get your own share link and track your referrals.
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2" aria-hidden="true">📨</span>}
            Send referral
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReferralForm;
