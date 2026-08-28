import React from 'react';

interface ProgressHeroProps {
  title: string;
  children?: React.ReactNode;
}

/** Plain header that opens the progress page and hosts the filter pills. */
const ProgressHero: React.FC<ProgressHeroProps> = ({ title, children }) => (
  <section className="relative">
    <div className="relative">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        {title}
      </h1>
      {children && <div className="mt-6">{children}</div>}
    </div>
  </section>
);

export default ProgressHero;
