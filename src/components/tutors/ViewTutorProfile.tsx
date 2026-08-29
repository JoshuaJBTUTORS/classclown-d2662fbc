import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tutor } from '@/types/tutor';
import { cn } from '@/lib/utils';
import { DoodleMail, DoodlePhone, DoodleCalendar, DoodleSparkle } from '@/components/doodles/LessonDoodles';

interface ViewTutorProfileProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
}

const avatarTones = ['bg-pastel-mint', 'bg-pastel-lilac', 'bg-pastel-butter', 'bg-pastel-sky', 'bg-pastel-blush'];

const statusTone = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-pastel-mint text-foreground';
    case 'pending':
      return 'bg-pastel-butter text-foreground';
    default:
      return 'bg-pastel-sand text-foreground';
  }
};

const formatJoinedDate = (value?: string | null) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-foreground">{children}</p>
  </div>
);

const ViewTutorProfile: React.FC<ViewTutorProfileProps> = ({ tutor, isOpen, onClose }) => {
  if (!tutor) return null;

  const initials = `${tutor.first_name?.[0] ?? ''}${tutor.last_name?.[0] ?? ''}`.toUpperCase();
  const tone = avatarTones[(tutor.first_name?.length ?? 0) % avatarTones.length];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cc-dialog sm:max-w-[560px] max-h-[90vh] overflow-y-auto rounded-[var(--radius-soft)] border-0 shadow-[var(--shadow-soft-lg)] p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-foreground', tone)}>
              {initials}
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
                {tutor.first_name} {tutor.last_name}'s Profile
              </DialogTitle>
              <span className={cn('mt-1.5 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize', statusTone(tutor.status))}>
                {tutor.status}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Contact */}
          <section className="rounded-2xl bg-pastel-sand/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <DoodleSparkle className="h-4 w-4 text-foreground/70" />
              <h2 className="font-heading text-sm font-extrabold tracking-tight">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                {tutor.title ? `${tutor.title} ` : ''}{tutor.first_name} {tutor.last_name}
              </Field>
              <Field label="Title">{tutor.title || 'No title'}</Field>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email Address</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <DoodleMail className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
                  <span className="truncate">{tutor.email}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Phone Number</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <DoodlePhone className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
                  {tutor.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </section>

          {/* Biography */}
          {tutor.bio && (
            <section className="rounded-2xl bg-pastel-sky/40 p-4 sm:p-5">
              <h2 className="mb-2 font-heading text-sm font-extrabold tracking-tight">Biography</h2>
              <p className="text-sm leading-relaxed text-foreground/90">{tutor.bio}</p>
            </section>
          )}

          {/* Joined */}
          <section className="flex items-center gap-3 rounded-2xl bg-pastel-lilac/50 p-4 sm:p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card">
              <DoodleCalendar className="h-4 w-4 text-foreground/70" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Joined</p>
              <p className="text-sm font-semibold text-foreground">{formatJoinedDate(tutor.joined_date)}</p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTutorProfile;
