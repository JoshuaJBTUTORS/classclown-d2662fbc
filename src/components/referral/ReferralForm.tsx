import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { COUNTRY_DIAL_CODES, DEFAULT_DIAL_CODE, normalisePhone, validatePhone } from '@/utils/phone';
import { DoodleSend } from '@/components/progress/ProgressDoodles';
import type { NewReferralInput } from '@/hooks/useReferral';

interface ReferralFormProps {
  onSubmit: (input: NewReferralInput) => Promise<{ success: boolean; error?: string }>;
  mode?: 'authenticated' | 'public';
  initialReferrer?: { name: string; email: string };
}

const inputCls = 'h-12 rounded-full border-foreground/20 bg-background px-5 focus-visible:ring-foreground/30';
const selectCls = 'h-12 w-[130px] shrink-0 rounded-full border-foreground/20 bg-background focus:ring-foreground/30';

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
    <section className="rounded-3xl border border-foreground/10 bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h2 className="font-heading text-xl font-bold tracking-tight">
        {isPublic ? 'Refer a friend' : 'Or send us their details'}
      </h2>
      <p className="mb-5 mt-2 text-sm text-muted-foreground">
        Give us their details and our team will reach out to arrange a free trial lesson.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isPublic && (
          <div className="space-y-4 rounded-2xl border border-foreground/10 bg-pastel-sky/40 p-4">
            <p className="font-heading text-sm font-semibold">Your details</p>

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
                className={inputCls}
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
                className={inputCls}
              />
              {errors.myEmail && <p className="text-sm text-destructive">{errors.myEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="me-phone">Your phone number</Label>
              <div className="flex gap-2">
                <Select value={myDial} onValueChange={setMyDial}>
                  <SelectTrigger className={selectCls}>
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
                  className={inputCls}
                />
              </div>
              {errors.myPhone && <p className="text-sm text-destructive">{errors.myPhone}</p>}
            </div>
          </div>
        )}

        {isPublic && <p className="font-heading text-sm font-semibold">Your friend's details</p>}

        <div className="space-y-2">
          <Label htmlFor="ref-name">Parent's name</Label>
          <Input
            id="ref-name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Their full name"
            className={inputCls}
          />
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
            className={inputCls}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ref-phone">Phone number</Label>
          <div className="flex gap-2">
            <Select value={dial} onValueChange={setDial}>
              <SelectTrigger className={selectCls}>
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
              className={inputCls}
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
            className={inputCls}
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
            className="rounded-2xl border-foreground/20 bg-background px-5 py-3 focus-visible:ring-foreground/30"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DoodleSend className="h-4 w-4" aria-hidden="true" />
          )}
          Send referral
        </button>
      </form>
    </section>
  );
};

export default ReferralForm;
