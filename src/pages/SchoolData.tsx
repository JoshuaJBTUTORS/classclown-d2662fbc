import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import Sidebar from '@/components/navigation/Sidebar';
import { supabase } from '@/integrations/supabase/client';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import LoadingHand from '@/components/ui/loading-hand';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

interface Row {
  id: number | string;
  first_name: string | null;
  last_name: string | null;
  school: string | null;
  year_group: string | null;
  school_urn: string | number | null;
  town?: string | null;
  local_authority?: string | null;
}

const SchoolData: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, first_name, last_name, school, year_group, school_urn')
          .not('school', 'is', null)
          .neq('school', '');
        if (error) throw error;

        const students = (data || []) as Row[];
        const urns = Array.from(
          new Set(students.map((s) => s.school_urn).filter(Boolean))
        ) as (string | number)[];

        let schoolMap = new Map<string, { town: string | null; local_authority: string | null }>();
        if (urns.length > 0) {
          const { data: schools } = await supabase
            .from('uk_schools')
            .select('urn, town, local_authority')
            .in("urn", urns as any);
          schoolMap = new Map(
            (schools || []).map((s: any) => [String(s.urn), { town: s.town, local_authority: s.local_authority }])
          );
        }

        setRows(
          students
            .map((s) => ({
              ...s,
              town: s.school_urn ? schoolMap.get(String(s.school_urn))?.town ?? null : null,
              local_authority: s.school_urn
                ? schoolMap.get(String(s.school_urn))?.local_authority ?? null
                : null,
            }))
            .sort(
              (a, b) =>
                (a.first_name || '').localeCompare(b.first_name || '', undefined, {
                  sensitivity: 'base',
                }) ||
                (a.last_name || '').localeCompare(b.last_name || '', undefined, {
                  sensitivity: 'base',
                })
            )
        );
      } catch (e) {
        console.error('Error loading school data:', e);
        toast.error('Failed to load school data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? rows.filter((r) =>
            [
              `${r.first_name ?? ''} ${r.last_name ?? ''}`,
              r.school ?? '',
              r.year_group ?? '',
              r.town ?? '',
              r.local_authority ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(q)
          )
        : rows,
    [rows, q]
  );

  const schoolCount = useMemo(
    () => new Set(rows.map((r) => (r.school || '').toLowerCase()).filter(Boolean)).size,
    [rows]
  );

  const statePanel = (content: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
      {content}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex-1 bg-background">
      <MobileMenuButton toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-w-0 flex-1">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  School Data
                </h1>
                {rows.length > 0 && (
                  <>
                    <span className="mt-2 inline-flex items-center rounded-full bg-pastel-lilac px-3 py-1 text-xs font-semibold text-foreground">
                      {q ? `${filtered.length}/${rows.length}` : `${rows.length} students`}
                    </span>
                    <span className="mt-2 inline-flex items-center rounded-full bg-pastel-mint px-3 py-1 text-xs font-semibold text-foreground">
                      {schoolCount} schools
                    </span>
                  </>
                )}
              </div>

              <div className="relative w-full sm:w-80">
                <span className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleSearch className="h-4 w-4" />
                </span>
                <input
                  placeholder="Search student, school, area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-full border-2 border-foreground bg-transparent pl-12 pr-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-foreground/[0.03]"
                />
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Showing students who have completed onboarding and told us their school.
            </p>

            <div className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              {isLoading ? (
                statePanel(<LoadingHand />)
              ) : rows.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">
                      No students have completed onboarding yet.
                    </p>
                  </>
                )
              ) : filtered.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">No results for "{search}".</p>
                  </>
                )
              ) : (
                <div className="space-y-2">
                  <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_48px] gap-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                    <span>Student</span>
                    <span>School</span>
                    <span>Year group</span>
                    <span>Area</span>
                    <span />
                  </div>

                  {filtered.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => navigate(`/students-list/${r.id}`)}
                      className="group grid w-full grid-cols-1 items-center gap-2 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sky/70 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_48px] lg:gap-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground',
                            avatarTones[i % avatarTones.length]
                          )}
                        >
                          {initials(r.first_name, r.last_name)}
                        </span>
                        <span className="truncate font-semibold text-foreground">
                          {r.first_name} {r.last_name}
                        </span>
                      </span>

                      <span className="truncate pl-12 text-sm text-foreground lg:pl-0">
                        {r.school || '—'}
                      </span>

                      <span className="pl-12 lg:pl-0">
                        <span className="inline-flex items-center rounded-full bg-pastel-butter px-3 py-1 text-xs font-semibold text-foreground">
                          {r.year_group || '—'}
                        </span>
                      </span>

                      <span className="truncate pl-12 text-sm text-muted-foreground lg:pl-0">
                        {[r.town, r.local_authority].filter(Boolean).join(', ') || '—'}
                      </span>

                      <span className="hidden justify-end lg:flex">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <DoodleArrow className="h-4 w-4" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolData;
