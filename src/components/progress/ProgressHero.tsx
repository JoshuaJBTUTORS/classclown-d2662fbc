import React from 'react';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';

interface ProgressHeroProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

/** Pastel banner that opens the progress page and hosts the filter pills. */
const ProgressHero: React.FC<ProgressHeroProps> = ({ title, subtitle, children }) => (
  <section className="relative overflow-hidden rounded-[1.75rem] bg-pastel-sky p-6 md:p-8">
    <ScribbleStroke className="pointer-events-none absolute -right-6 -top-10 h-48 w-72 text-pastel-sky-foreground/20" />
    <div className="relative">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-pastel-sky-foreground md:text-3xl">
        {title}
      </h1>
      <p className="mt-1 max-w-xl text-sm text-pastel-sky-foreground/80">{subtitle}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  </section>
);

export default ProgressHero;
