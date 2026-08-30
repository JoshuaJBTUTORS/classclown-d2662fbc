import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, BookOpen, Calendar, Clock } from 'lucide-react';
import { COUNTRY_DIAL_CODES, getCountryByDial, normalisePhone, splitPhone } from '@/utils/phone';
import { cn } from '@/lib/utils';

interface ContactInfoStepProps {
  formData: {
    parentName: string;
    childName: string;
    email: string;
    phone: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  selectedSubject: { id: string; name: string } | null;
  selectedDate: string;
  selectedTime: string;
}

const labelClass = 'text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground';
const inputClass = 'rounded-xl border-2 border-border bg-card h-11 focus-visible:border-foreground/70';
const errorClass = 'mt-2 inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive';

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  formData,
  onChange,
  errors,
  selectedSubject,
  selectedDate,
  selectedTime
}) => {
  const { dial, national } = splitPhone(formData.phone);
  const country = getCountryByDial(dial);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Booking Summary */}
      <div className="rounded-2xl border-2 border-foreground/80 bg-pastel-mint p-4 sm:p-5">
        <h3 className="font-heading text-base font-bold text-foreground mb-4">Booking Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, label: 'Subject', value: selectedSubject?.name },
            { icon: Calendar, label: 'Date', value: formatDate(selectedDate) },
            { icon: Clock, label: 'Time', value: formatTime(selectedTime) }
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl bg-background/70 border border-foreground/10 p-3">
              <Icon className="h-4 w-4 text-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h4 className={labelClass}>{label}</h4>
                <p className="text-sm font-medium text-foreground break-words">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information Form */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-foreground/80 bg-pastel-blush">
            <User className="h-5 w-5 text-foreground" />
          </span>
          <h2 className="font-heading text-lg font-bold text-foreground">Contact Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="parentName" className={labelClass}>Parent Name *</Label>
            <Input
              type="text"
              id="parentName"
              value={formData.parentName}
              onChange={(e) => onChange('parentName', e.target.value)}
              className={cn(inputClass, 'mt-1.5', errors.parentName && 'border-destructive')}
              placeholder="Enter parent's full name"
            />
            {errors.parentName && <p className={errorClass}>{errors.parentName}</p>}
          </div>

          <div>
            <Label htmlFor="childName" className={labelClass}>Child Name *</Label>
            <Input
              type="text"
              id="childName"
              value={formData.childName}
              onChange={(e) => onChange('childName', e.target.value)}
              className={cn(inputClass, 'mt-1.5', errors.childName && 'border-destructive')}
              placeholder="Enter child's full name"
            />
            {errors.childName && <p className={errorClass}>{errors.childName}</p>}
          </div>

          <div>
            <Label htmlFor="email" className={labelClass}>Email Address *</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => onChange('email', e.target.value)}
                className={cn(inputClass, 'pl-10', errors.email && 'border-destructive')}
                placeholder="Enter email address"
              />
            </div>
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone" className={labelClass}>Phone Number *</Label>
            <div className="flex gap-2 mt-1.5">
              <Select
                value={dial}
                onValueChange={(newDial) => onChange('phone', normalisePhone(national, newDial))}
              >
                <SelectTrigger className={cn(inputClass, 'w-[130px] shrink-0')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64 bg-background z-50 rounded-2xl border-2 border-foreground/80">
                  {COUNTRY_DIAL_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.dial}>
                      {c.dial} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  id="phone"
                  inputMode="tel"
                  value={national}
                  onChange={(e) => onChange('phone', normalisePhone(e.target.value, dial))}
                  className={cn(inputClass, 'pl-10', errors.phone && 'border-destructive')}
                  placeholder={country.example}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Saved as {formData.phone || `${dial}...`}
            </p>
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          </div>

          <div className="mt-6 rounded-2xl border-2 border-foreground/80 bg-pastel-butter p-4">
            <h4 className="font-heading font-bold text-foreground mb-2">Ready to book!</h4>
            <ul className="text-sm text-foreground/80 space-y-1">
              <li>• Your trial lesson will be scheduled with a qualified tutor</li>
              <li>• You'll receive a confirmation email shortly</li>
              <li>• The lesson link will be sent before your appointment</li>
              <li>• No payment required for the trial lesson</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoStep;
