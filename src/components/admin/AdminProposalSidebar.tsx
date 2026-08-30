import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AdminProposalSidebarProps {
  totalProposals: number;
  filteredCount: number;
  onFilterChange?: (filter: string) => void;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleChart: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M4.5 19.2c4.9.4 10 .4 15 0" />
    <path d="M7.5 19V12.4" />
    <path d="M12 19V6.8" />
    <path d="M16.5 19v-4.4" />
  </svg>
);

const DoodleFunnel: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M4.8 5.4c4.8-.5 9.6-.5 14.4 0-1.9 2.7-3.8 4.9-5.6 6.6v6.4l-3.2-1.9v-4.5C8.6 10.3 6.7 8.1 4.8 5.4z" />
  </svg>
);

const DoodleSigned: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M6.4 3.9c3.4-.4 6.8-.4 10.2 0 .5 5.4.5 10.8 0 16.2-3.4.4-6.8.4-10.2 0-.5-5.4-.5-10.8 0-16.2z" />
    <path d="M8.9 12.6c1 1 1.7 1.9 2.2 2.6 1.1-2 2.4-3.6 3.9-4.9" />
  </svg>
);

export function AdminProposalSidebar({ totalProposals, filteredCount }: AdminProposalSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const signedActive = pathname.startsWith('/admin/proposals/signed');

  const statCard = (
    label: string,
    value: number,
    tone: string,
    icon: React.ReactNode,
    big?: boolean
  ) => {
    if (isCollapsed) {
      return (
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground', tone)}>
          {icon}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 rounded-[1.25rem] border-2 border-foreground bg-background px-3 py-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground', tone)}>
          {icon}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              'font-heading font-extrabold leading-none text-foreground',
              big ? 'text-2xl' : 'text-xl'
            )}
          >
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    );
  };

  return (
    <Sidebar
      variant="sidebar"
      className={cn(
        'border-r-2 border-foreground/10 [&>div]:bg-card',
        isCollapsed ? 'w-14' : 'w-64'
      )}
    >
      <SidebarContent className="bg-card">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Statistics
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <div className={cn('space-y-3', isCollapsed ? 'px-2 py-3' : 'px-3 py-2')}>
              {statCard('Total Proposals', totalProposals, 'bg-pastel-lilac', <DoodleChart className="h-5 w-5" />, true)}
              {statCard('Filtered Results', filteredCount, 'bg-pastel-mint', <DoodleFunnel className="h-5 w-5" />)}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Links
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <div className={cn(isCollapsed ? 'px-2 py-1' : 'px-3 py-1')}>
              <button
                type="button"
                onClick={() => navigate('/admin/proposals/signed')}
                title="Signed Proposals"
                className={cn(
                  'flex w-full items-center gap-3 rounded-full border-2 border-foreground transition-colors',
                  isCollapsed ? 'h-10 w-10 justify-center p-0' : 'px-2 py-2 pr-4',
                  signedActive
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground hover:bg-pastel-sky'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    signedActive ? 'bg-background/20 text-background' : 'bg-pastel-butter text-foreground'
                  )}
                >
                  <DoodleSigned className="h-4 w-4" />
                </span>
                {!isCollapsed && <span className="text-sm font-semibold">Signed Proposals</span>}
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
