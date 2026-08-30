import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import { Loader2 } from 'lucide-react';
import { useStudentData } from '@/hooks/useStudentData';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import { cn } from '@/lib/utils';
import LoadingHand from '@/components/ui/loading-hand';

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M11 4.2c3.6-.3 6.4 2.4 6.3 5.9-.1 3.3-2.8 5.8-6.1 5.7-3.4-.1-5.9-2.7-5.8-6C5.5 6.7 7.9 4.4 11 4.2z" />
    <path d="M15.4 14.6c1.6 1.5 3 3.1 4.3 4.9" />
  </svg>
);

const DoodleArrow: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M4.8 12.2c4.7-.4 9.4-.5 14.1-.3" />
    <path d="M14.2 7.3c1.8 1.5 3.4 3 4.8 4.7-1.5 1.6-3.1 3.1-4.9 4.5" />
  </svg>
);

const initials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

const avatarTones = [
  'bg-pastel-mint',
  'bg-pastel-lilac',
  'bg-pastel-butter',
  'bg-pastel-blush',
  'bg-pastel-sky',
];

const StudentsList: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { students, isLoading } = useStudentData();

  const q = searchQuery.trim().toLowerCase();
  const byName = (a: any, b: any) =>
    (a.first_name || '').localeCompare(b.first_name || '', undefined, { sensitivity: 'base' }) ||
    (a.last_name || '').localeCompare(b.last_name || '', undefined, { sensitivity: 'base' });
  const sortedStudents = [...students].sort(byName);
  const filteredStudents = q
    ? sortedStudents.filter((s) => {
        const name = `${s.first_name ?? ''} ${s.last_name ?? ''}`.toLowerCase();
        return (
          name.includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.phone ?? '').toLowerCase().includes(q) ||
          (s.grade ?? '').toLowerCase().includes(q)
        );
      })
    : sortedStudents;

  const statePanel = (content: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
      {content}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Students
                </h1>
                {students.length > 0 && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-pastel-lilac px-3 py-1 text-xs font-semibold text-foreground">
                    {q ? `${filteredStudents.length}/${students.length}` : students.length}
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-80">
                <span className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleSearch className="h-4 w-4" />
                </span>
                <input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-full border-2 border-foreground bg-transparent pl-12 pr-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-foreground/[0.03]"
                />
              </div>
            </div>

            {/* List surface */}
            <div className="mt-8 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              {isLoading ? (
                statePanel(
                  <LoadingHand />
                )
              ) : students.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">No students yet.</p>
                  </>
                )
              ) : filteredStudents.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">
                      No students match "{searchQuery}".
                    </p>
                  </>
                )
              ) : (
                <div className="space-y-2">
                  {/* Column headers (desktop) */}
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_48px] gap-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Phone</span>
                    <span>Year / Grade</span>
                    <span>Status</span>
                    <span />
                  </div>

                  {filteredStudents.map((s, i) => {
                    const active = (s.status || 'active') === 'active';
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => navigate(`/students-list/${s.id}`)}
                        className="group grid w-full grid-cols-1 items-center gap-2 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sky/70 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_48px] lg:gap-4"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground',
                              avatarTones[i % avatarTones.length]
                            )}
                          >
                            {initials(s.first_name, s.last_name)}
                          </span>
                          <span className="truncate font-semibold text-foreground">
                            {s.first_name} {s.last_name}
                          </span>
                        </span>

                        <span className="truncate pl-12 text-sm text-muted-foreground lg:pl-0">
                          {s.email || '—'}
                        </span>
                        <span className="truncate pl-12 text-sm text-muted-foreground lg:pl-0">
                          {s.phone || '—'}
                        </span>
                        <span className="truncate pl-12 text-sm text-muted-foreground lg:pl-0">
                          {s.grade || '—'}
                        </span>

                        <span className="pl-12 lg:pl-0">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-foreground',
                              active ? 'bg-pastel-mint' : 'bg-pastel-blush'
                            )}
                          >
                            {s.status || 'active'}
                          </span>
                        </span>

                        <span className="hidden justify-end lg:flex">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <DoodleArrow className="h-4 w-4" />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsList;
