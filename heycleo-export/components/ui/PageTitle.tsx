
import React from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function PageTitle({ title, subtitle, className, children }: PageTitleProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h1 className="text-2xl font-bold tracking-tight">{title || children}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
