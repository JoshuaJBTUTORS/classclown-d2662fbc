import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LessonPlansLoadingSkeleton: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <Skeleton className="h-44 w-full rounded-[var(--radius-soft)]" />

      <div className="mt-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>

        <Skeleton className="h-14 w-full max-w-xl rounded-full" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-soft)]" />
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[190px] w-full rounded-[var(--radius-soft)]" />
        ))}
      </div>
    </div>
  );
};
