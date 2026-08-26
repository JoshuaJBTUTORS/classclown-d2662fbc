import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  'h-14 w-full gap-2 rounded-full border-0 bg-card px-6 sm:w-auto sm:min-w-[170px]',
  'text-sm font-medium text-foreground shadow-[var(--shadow-soft)]',
  'focus:ring-2 focus:ring-ring focus:ring-offset-0'
);

const StatPill: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className={cn('rounded-full px-5 py-2.5 shadow-[var(--shadow-soft)]', tone)}>
    <span className="font-heading text-lg font-extrabold tracking-tight">{value}</span>
    <span className="ml-2 text-sm opacity-80">{label}</span>
  </div>
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

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        Lesson Summaries
      </h1>

      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search lessons, subjects, or tutors..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'h-14 rounded-full border-0 bg-card pl-14 pr-5 text-base',
            'shadow-[var(--shadow-soft)] placeholder:text-muted-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0'
          )}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {showStudentFilter && (
          <Select value={studentFilter} onValueChange={onStudentFilterChange}>
            <SelectTrigger className={pillTrigger}>
              <SelectValue placeholder="All students" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-[var(--shadow-soft-lg)]">
              <SelectItem value="all" className="rounded-xl focus:bg-muted">All students</SelectItem>
              {students.map((student) => {
                const tone = getPastelTone(student.name);
                return (
                  <SelectItem key={student.id} value={student.id} className="rounded-xl focus:bg-muted">
                    <span className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', tone.bar)} />
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
          type="button"
          onClick={onRefresh}
          className={cn(
            'inline-flex h-14 items-center justify-center gap-2 rounded-full bg-foreground px-6',
            'text-sm font-medium text-background shadow-[var(--shadow-soft)]',
            'transition-transform hover:-translate-y-0.5'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default LessonSummariesHero;
