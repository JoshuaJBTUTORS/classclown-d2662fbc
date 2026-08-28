import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressPanelProps {
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Soft rounded surface used for every block on the progress page. */
const ProgressPanel: React.FC<ProgressPanelProps> = ({
  title,
  description,
  className,
  action,
  children,
}) => (
  <section
    className={cn(
      'rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md',
      className,
    )}
  >
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
    {children}
  </section>
);

export default ProgressPanel;
