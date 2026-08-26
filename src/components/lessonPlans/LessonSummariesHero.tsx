import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { getPastelTone } from '@/components/lessonPlans/pastelPalette';

export interface SummaryStudentOption {
  id: string;
  name: string;
}

interface LessonSummariesHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  studentFilter?: string;
  onStudentFilterChange?: (value: string) => void;
  students?: SummaryStudentOption[];
  onRefresh: () => void;
  uniqueSubjects: string[];
  totalLessons: number;
  filteredCount: number;
}

const pillTrigger = cn(
  'h-11 w-full gap-2 rounded-full border-none bg-background/70 px-5 sm:w-auto sm:min-w-[160px]',
  'font-heading text-sm font-bold text-pastel-sky-foreground shadow-[var(--shadow-soft)]',
  'transition-shadow hover:shadow-[var(--shadow-soft-lg)] focus:ring-2 focus:ring-ring'
);

export const LessonSummariesHero: React.FC<LessonSummariesHeroProps> = ({
  searchTerm,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  dateFilter,
  onDateFilterChange,
  studentFilter = 'all',
  onStudentFilterChange,
  students = [],
  onRefresh,
  uniqueSubjects,
  totalLessons,
  filteredCount
}) => {
  const showStudentFilter = students.length > 1 && !!onStudentFilterChange;
  const activeStudent = students.find((s) => s.id === studentFilter);
  const activeTone = activeStudent ? getPastelTone(activeStudent.name) : null;

  return (
    <div className="relative w-full overflow-hidden rounded-[1.5rem] bg-pastel-sky px-6 py-6 shadow-[var(--shadow-soft)] sm:px-10 sm:py-7">
      <ScribbleStroke className="pointer-events-none absolute -right-6 -top-10 h-48 w-72 text-foreground/15" />

      <div className="relative space-y-5">
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-pastel-sky-foreground sm:text-4xl lg:text-5xl">
            Lesson Summaries
          </h1>
          <p className="max-w-xl text-sm text-pastel-sky-foreground/75 sm:text-base">
            Lesson recordings and AI-written summaries, all in one place.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="rounded-full bg-background/70 px-4 py-2 text-sm text-pastel-sky-foreground/75 shadow-[var(--shadow-soft)]">
              <span className="font-heading font-extrabold text-pastel-sky-foreground">{totalLessons}</span>
              <span className="ml-2">recordings</span>
            </span>
            <span className="rounded-full bg-background/70 px-4 py-2 text-sm text-pastel-sky-foreground/75 shadow-[var(--shadow-soft)]">
              <span className="font-heading font-extrabold text-pastel-sky-foreground">{filteredCount}</span>
              <span className="ml-2">shown</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-pastel-sky-foreground/50" />
            <Input
              placeholder="Search lessons, subjects, or tutors..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={cn(
                'h-11 rounded-full border-none bg-background/70 pl-12 pr-5 text-sm',
                'text-pastel-sky-foreground shadow-[var(--shadow-soft)]',
                'placeholder:text-pastel-sky-foreground/50 focus-visible:ring-2 focus-visible:ring-ring'
              )}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {showStudentFilter && (
              <Select value={studentFilter} onValueChange={onStudentFilterChange}>
                <SelectTrigger
                  className={cn(pillTrigger, activeTone?.bg, activeTone?.text)}
                >
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
                  <SelectItem value="all" className="rounded-xl focus:bg-muted">All students</SelectItem>
                  {students.map((student) => {
                    const tone = getPastelTone(student.name);
                    return (
                      <SelectItem key={student.id} value={student.id} className="rounded-xl focus:bg-muted">
                        <span className={cn('rounded-full px-3 py-1 text-xs font-bold', tone.bg, tone.text)}>
                          {student.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            <Select value={subjectFilter} onValueChange={onSubjectFilterChange}>
              <SelectTrigger className={pillTrigger}>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
                <SelectItem value="all" className="rounded-xl focus:bg-muted">All subjects</SelectItem>
                {uniqueSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject} className="rounded-xl focus:bg-muted">
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={onDateFilterChange}>
              <SelectTrigger className={pillTrigger}>
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
                <SelectItem value="all" className="rounded-xl focus:bg-muted">All time</SelectItem>
                <SelectItem value="last-7-days" className="rounded-xl focus:bg-muted">Last 7 days</SelectItem>
                <SelectItem value="last-30-days" className="rounded-xl focus:bg-muted">Last 30 days</SelectItem>
                <SelectItem value="last-90-days" className="rounded-xl focus:bg-muted">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={onRefresh}
              className={cn(
                'inline-flex h-11 items-center justify-center gap-2 rounded-full px-6',
                'bg-foreground font-heading text-sm font-bold text-background',
                'shadow-[var(--shadow-soft)] transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-lg)]'
              )}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
