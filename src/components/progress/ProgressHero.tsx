import React from 'react';

interface ProgressHeroProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

/** Plain header that opens the progress page and hosts the filter pills. */
const ProgressHero: React.FC<ProgressHeroProps> = ({ title, subtitle, children }) => (
  <section className="relative">
    <div className="relative">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {title}
      </h1>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  </section>
);

export default ProgressHero;
