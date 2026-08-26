import React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPastelTone } from '@/components/lessonPlans/pastelPalette';
import type { Student } from '@/types/student';

interface SchoolProgressHeroProps {
  documentCount: number;
  canUpload: boolean;
  showUpload: boolean;
  onToggleUpload: () => void;
  students: Student[];
  currentStudent: Student | null;
  onStudentChange: (student: Student) => void;
}

const studentFullName = (s: Student) => `${s.first_name} ${s.last_name || ''}`.trim();

export const SchoolProgressHero: React.FC<SchoolProgressHeroProps> = ({
  documentCount,
  canUpload,
  showUpload,
  onToggleUpload,
  students,
  currentStudent,
  onStudentChange,
}) => {
  const activeTone = currentStudent
    ? getPastelTone(studentFullName(currentStudent) || String(currentStudent.id))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            School Progress
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Upload and view report cards, mock exam results, and other school documents.
          </p>
        </div>

      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full bg-pastel-sky px-5 py-2.5 shadow-[var(--shadow-soft)]">
          <span className="font-heading text-lg font-extrabold tracking-tight text-pastel-sky-foreground">
            {documentCount}
          </span>
          <span className="ml-2 text-sm text-pastel-sky-foreground/75">
            {documentCount === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {students.length > 1 && currentStudent && (
          <Select
            value={String(currentStudent.id)}
            onValueChange={(value) => {
              const next = students.find((s) => String(s.id) === value);
              if (next) onStudentChange(next);
            }}
          >
            <SelectTrigger
              className={cn(
                'h-11 w-auto min-w-[180px] gap-2 rounded-full border-none px-5',
                'font-heading text-sm font-bold shadow-[var(--shadow-soft)]',
                'transition-shadow hover:shadow-[var(--shadow-soft-lg)] focus:ring-2 focus:ring-ring',
                activeTone?.bg,
                activeTone?.text
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
              {students.map((s) => {
                const name = studentFullName(s);
                const tone = getPastelTone(name || String(s.id));
                return (
                  <SelectItem key={s.id} value={String(s.id)} className="rounded-xl focus:bg-muted">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', tone.bg, tone.text)}>
                      {name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default SchoolProgressHero;
