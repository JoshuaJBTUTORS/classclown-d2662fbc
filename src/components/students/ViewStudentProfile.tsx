import React from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Student } from '@/types/student';
import { UserX, Users, Mail, Phone, CalendarDays, GraduationCap, Hash } from 'lucide-react';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { getPastelTone } from '@/components/lessonPlans/pastelPalette';
import { cn } from '@/lib/utils';

interface ViewStudentProfileProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  toneText: string;
}> = ({ icon, label, value, toneText }) => (
  <div className="flex items-start gap-3">
    <span className={cn('mt-0.5 opacity-70', toneText)}>{icon}</span>
    <div>
      <p className={cn('text-xs font-medium uppercase tracking-wide opacity-60', toneText)}>
        {label}
      </p>
      <p className={cn('text-sm font-semibold', toneText)}>{value}</p>
    </div>
  </div>
);

const ViewStudentProfile: React.FC<ViewStudentProfileProps> = ({ student, isOpen, onClose }) => {
  if (!student) return null;

  const fullName = `${student.first_name} ${student.last_name}`;
  const tone = getPastelTone(fullName || String(student.id));

  const subjectsArray = typeof student.subjects === 'string'
    ? student.subjects.split(',').map(subject => subject.trim())
    : student.subjects || [];

  const displayDate = student.joinedDate || (student.created_at
    ? new Date(student.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not available');

  const isStandaloneStudent = !student.parent_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] overflow-hidden rounded-[var(--radius-soft)] border-none p-0 shadow-[var(--shadow-soft-lg)]">
        {/* Pastel hero band */}
        <div className={cn('relative overflow-hidden p-6 pb-5', tone.bg)}>
          <ScribbleStroke
            className="pointer-events-none absolute -top-4 right-0 w-[55%] text-background"
          />
          <div className="relative">
            <h2 className={cn('font-heading text-3xl font-extrabold leading-tight tracking-tight', tone.text)}>
              {fullName}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize', tone.chip)}>
                {student.status}
              </span>
              <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', tone.chip)}>
                {isStandaloneStudent ? (
                  <><UserX className="h-3 w-3" /> Standalone</>
                ) : (
                  <><Users className="h-3 w-3" /> Family-linked</>
                )}
              </span>
              <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', tone.chip)}>
                <CalendarDays className="h-3 w-3" /> Joined {displayDate}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6 pt-5">
          {/* Student details */}
          <section>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Student Information
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 rounded-[var(--radius-soft)] bg-muted/50 p-4 sm:grid-cols-2">
              <InfoItem icon={<Hash className="h-4 w-4" />} label="Student ID" value={student.student_id || 'No ID assigned'} toneText="text-foreground" />
              {student.grade && (
                <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="Grade / Year" value={student.grade} toneText="text-foreground" />
              )}
              <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={student.email || 'Not provided'} toneText="text-foreground" />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone || 'Not provided'} toneText="text-foreground" />
            </div>
          </section>

          {/* Parent details or standalone notice */}
          {!isStandaloneStudent ? (
            <section>
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Parent Information
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 rounded-[var(--radius-soft)] bg-muted/50 p-4 sm:grid-cols-2">
                <InfoItem icon={<Users className="h-4 w-4" />} label="Parent Name" value={student.parentName || 'Not provided'} toneText="text-foreground" />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Parent Email" value={student.parentEmail || 'Not provided'} toneText="text-foreground" />
              </div>
            </section>
          ) : (
            <section className={cn('flex items-start gap-3 rounded-[var(--radius-soft)] p-4', getPastelTone('standalone-butter').bg)}>
              <UserX className={cn('mt-0.5 h-5 w-5 shrink-0', getPastelTone('standalone-butter').text)} />
              <div>
                <h3 className={cn('font-heading text-base font-bold', getPastelTone('standalone-butter').text)}>
                  Standalone Student
                </h3>
                <p className={cn('mt-1 text-sm opacity-80', getPastelTone('standalone-butter').text)}>
                  This student is not currently linked to any parent account. They can be converted to a family account or linked to an existing parent later if needed.
                </p>
              </div>
            </section>
          )}

          {/* Subjects */}
          <section>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Subjects
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjectsArray.length > 0 ? (
                subjectsArray.map((subject, i) => {
                  const subjectTone = getPastelTone(subject);
                  return (
                    <span
                      key={i}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-semibold',
                        subjectTone.bg,
                        subjectTone.text
                      )}
                    >
                      {subject}
                    </span>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No subjects assigned</p>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewStudentProfile;
